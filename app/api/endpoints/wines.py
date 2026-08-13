from __future__ import annotations

import base64
from http import HTTPStatus
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from ...database import get_db
from ...models import User, Wine, GrapeComposition, InventoryLog, TastingNote
from ...core.security import get_current_user
from ...schemas import (
    WineCreateRequest,
    WineUpdateRequest,
    WineResponse,
    GrapeCompositionResponse,
    DrinkingWindowSuggestionResponse,
    WineListPageResponse,
    WineListItem,
    WineType,
    WineQuantityUpdateRequest,
    InventoryLogResponse,
    TastingNoteCreateRequest,
    TastingNoteResponse,
    WineConsumptionResponse,
    LabelExtractionResponse,
    WineFilterOptionsResponse,
)
from ...services.wine_api_service import fetch_drinking_window_suggestion, ExternalApiError, SupportedWineType
from ...services.label_extraction_service import extract_wine_from_label_image, LabelExtractionError
from ...core.config import XaiConfig


router = APIRouter(prefix="/api/wines", tags=["wines"])


def get_owned_wine(
    db: Session,
    wine_id: int,
    user_id: int,
    *,
    load_grapes: bool = False,
) -> Wine:
    stmt = select(Wine).where(Wine.id == wine_id, Wine.user_id == user_id)
    if load_grapes:
        stmt = stmt.options(selectinload(Wine.grape_compositions))
    wine = db.execute(stmt).scalar_one_or_none()
    if wine is None:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Vin ikke funnet")
    return wine


def wine_has_label(wine: Wine) -> bool:
    return bool(wine.label_image)


def decode_label_image(payload) -> tuple[bytes | None, str | None]:
    raw = getattr(payload, "label_image_base64", None)
    if not raw:
        return None, None
    content_type = getattr(payload, "label_image_content_type", None) or "image/jpeg"
    data = raw.strip()
    if data.startswith("data:") and "," in data:
        header, data = data.split(",", 1)
        if ";base64" in header and header.startswith("data:"):
            content_type = header[5:].split(";")[0] or content_type
    try:
        image_bytes = base64.b64decode(data, validate=False)
    except Exception as exc:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="Ugyldig etikettbilde (base64).") from exc
    if not image_bytes:
        return None, None
    if len(image_bytes) > 12 * 1024 * 1024:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="Etikettbildet er for stort (maks 12 MB).")
    return image_bytes, content_type


def to_wine_response(wine: Wine) -> WineResponse:
    return WineResponse(
        id=wine.id,
        name=wine.name,
        type=wine.type,
        producer=wine.producer,
        vintage=wine.vintage,
        country=wine.country,
        district=wine.district,
        subdistrict=wine.subdistrict,
        purchase_price=wine.purchase_price,
        quantity=wine.quantity,
        drink_after_date=wine.drink_after_date,
        drink_before_date=wine.drink_before_date,
        grape_composition=[
            GrapeCompositionResponse(id=gc.id, grape_variety=gc.grape_variety, percentage=gc.percentage)
            for gc in (wine.grape_compositions or [])
        ],
        has_label_image=wine_has_label(wine),
    )


def apply_filters(
    stmt,
    search_term: Optional[str],
    wine_type: Optional[WineType],
    vintage: Optional[int],
    country: Optional[str],
    district: Optional[str],
    subdistrict: Optional[str],
    drinking_window_status: Optional[str] = None,
    grape: Optional[str] = None,
):
    if search_term:
        like = f"%{search_term}%"
        stmt = stmt.filter((Wine.name.ilike(like)) | (Wine.producer.ilike(like)))
    if wine_type:
        stmt = stmt.filter(Wine.type == wine_type.value)
    if vintage is not None:
        stmt = stmt.filter(Wine.vintage == vintage)
    if country:
        stmt = stmt.filter(Wine.country == country)
    if district:
        stmt = stmt.filter(Wine.district.ilike(district))
    if subdistrict:
        stmt = stmt.filter(Wine.subdistrict == subdistrict)
    if grape:
        stmt = stmt.filter(
            Wine.grape_compositions.any(GrapeComposition.grape_variety.ilike(grape))
        )

    # Drinking window status filtering
    if drinking_window_status:
        from datetime import date, timedelta
        today = date.today()

        if drinking_window_status == "ready_to_drink":
            # Wines where today is between drink_after_date and drink_before_date
            # Both dates must be present (not NULL) for a wine to be considered ready
            stmt = stmt.filter(
                Wine.drink_after_date.isnot(None),
                Wine.drink_before_date.isnot(None),
                Wine.drink_after_date <= today,
                Wine.drink_before_date >= today
            )
        elif drinking_window_status == "approaching_deadline":
            # Wines where drink_before_date is within 30 days of today
            # Must have drink_before_date set, and it must be in the future but within 30 days
            deadline_threshold = today + timedelta(days=30)
            stmt = stmt.filter(
                Wine.drink_before_date.isnot(None),
                Wine.drink_before_date <= deadline_threshold,
                Wine.drink_before_date >= today
            )
        elif drinking_window_status == "not_ready":
            # Wines where today is before drink_after_date
            # Must have drink_after_date set, and it must be in the future
            stmt = stmt.filter(
                Wine.drink_after_date.isnot(None),
                Wine.drink_after_date > today
            )

        # Exclude wines with zero quantity from drinking window status filters
        # Wines with zero quantity are no longer in the collection and shouldn't trigger alerts
        stmt = stmt.filter(Wine.quantity > 0)

    return stmt


@router.get("/filter-options", response_model=WineFilterOptionsResponse)
def wine_filter_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WineFilterOptionsResponse:
    owned = Wine.user_id == current_user.id
    in_stock = (Wine.quantity.isnot(None)) & (Wine.quantity > 0)

    types = db.execute(
        select(Wine.type)
        .where(owned, in_stock, Wine.type.isnot(None), Wine.type != "")
        .distinct()
        .order_by(Wine.type)
    ).scalars().all()

    districts = db.execute(
        select(Wine.district)
        .where(owned, in_stock, Wine.district.isnot(None), Wine.district != "")
        .distinct()
        .order_by(Wine.district)
    ).scalars().all()

    grapes = db.execute(
        select(GrapeComposition.grape_variety)
        .join(Wine, GrapeComposition.wine_id == Wine.id)
        .where(owned, in_stock, GrapeComposition.grape_variety != "")
        .distinct()
        .order_by(GrapeComposition.grape_variety)
    ).scalars().all()

    return WineFilterOptionsResponse(
        types=[t for t in types if t],
        districts=[d for d in districts if d],
        grapes=[g for g in grapes if g],
    )


@router.get("", response_model=List[WineResponse])
def list_wines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search_term: Optional[str] = Query(None),
    wine_type: Optional[WineType] = Query(None),
    vintage: Optional[int] = Query(None, ge=1800, le=2100),
    country: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    subdistrict: Optional[str] = Query(None),
    grape: Optional[str] = Query(None),
    drinking_window_status: Optional[str] = Query(None),
    quantity_filter: Optional[str] = Query("non_zero", pattern="^(non_zero|zero|all)$"),
) -> List[WineResponse]:
    try:
        stmt = (
            select(Wine)
            .options(selectinload(Wine.grape_compositions))
            .where(Wine.user_id == current_user.id)
            .order_by(Wine.id.desc())
        )
        stmt = apply_filters(
            stmt, search_term, wine_type, vintage, country, district, subdistrict, drinking_window_status, grape
        )
        
        # Apply quantity filter (default: exclude zero quantity wines)
        if quantity_filter == "non_zero":
            stmt = stmt.filter(Wine.quantity > 0)
        elif quantity_filter == "zero":
            stmt = stmt.filter((Wine.quantity == 0) | (Wine.quantity.is_(None)))
        # If quantity_filter is "all", don't apply any quantity filter
        
        wines = db.execute(stmt).scalars().all()
        return [to_wine_response(w) for w in wines]
    except Exception as exc:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get("/page", response_model=WineListPageResponse)
def list_wines_page(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query(
        "id",
        pattern="^(id|name|producer|vintage|type|purchase_price|drink_after_date|drink_before_date)$",
    ),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search_term: Optional[str] = Query(None),
    wine_type: Optional[WineType] = Query(None),
    vintage: Optional[int] = Query(None, ge=1800, le=2100),
    country: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    subdistrict: Optional[str] = Query(None),
    grape: Optional[str] = Query(None),
    drinking_window_status: Optional[str] = Query(None),
    quantity_filter: Optional[str] = Query("non_zero", pattern="^(non_zero|zero|all)$"),
) -> WineListPageResponse:
    try:
        # Base query with eager load to prevent N+1
        base_stmt = (
            select(Wine)
            .options(selectinload(Wine.grape_compositions))
            .where(Wine.user_id == current_user.id)
        )
        base_stmt = apply_filters(
            base_stmt, search_term, wine_type, vintage, country, district, subdistrict, drinking_window_status, grape
        )
        
        # Apply quantity filter (default: exclude zero quantity wines)
        # Note: If drinking_window_status is set, quantity > 0 is already applied in apply_filters
        # So we only apply quantity_filter if drinking_window_status is not set, or if quantity_filter is explicitly "all"
        if not drinking_window_status:
            if quantity_filter == "non_zero":
                base_stmt = base_stmt.filter(Wine.quantity > 0)
            elif quantity_filter == "zero":
                base_stmt = base_stmt.filter((Wine.quantity == 0) | (Wine.quantity.is_(None)))
        elif quantity_filter == "all":
            # If drinking_window_status is set but quantity_filter is "all", remove the quantity > 0 filter
            # This allows viewing wines with zero quantity even in drinking window views (though unusual)
            pass

        # Sorting (nulls last so incomplete rows don't float to the top)
        sort_field = {
            "id": Wine.id,
            "name": Wine.name,
            "producer": Wine.producer,
            "vintage": Wine.vintage,
            "type": Wine.type,
            "purchase_price": Wine.purchase_price,
            "drink_after_date": Wine.drink_after_date,
            "drink_before_date": Wine.drink_before_date,
        }[sort_by]
        if sort_order == "desc":
            base_stmt = base_stmt.order_by(sort_field.desc().nulls_last(), Wine.id.desc())
        else:
            base_stmt = base_stmt.order_by(sort_field.asc().nulls_last(), Wine.id.desc())

        # Count total AFTER filters (including quantity filter)
        count_stmt = select(func.count(Wine.id))
        count_stmt = apply_filters(
            count_stmt, search_term, wine_type, vintage, country, district, subdistrict, drinking_window_status, grape
        )
        # Apply quantity filter consistently with main query
        if not drinking_window_status:
            if quantity_filter == "non_zero":
                count_stmt = count_stmt.filter(Wine.quantity > 0)
            elif quantity_filter == "zero":
                count_stmt = count_stmt.filter((Wine.quantity == 0) | (Wine.quantity.is_(None)))
        elif quantity_filter == "all":
            # If drinking_window_status is set but quantity_filter is "all", remove the quantity > 0 filter
            pass
        total_items = db.execute(count_stmt).scalar_one()

        # Pagination
        offset = (page - 1) * page_size
        stmt = base_stmt.offset(offset).limit(page_size)
        wines = db.execute(stmt).scalars().all()

        items: List[WineListItem] = [
            WineListItem(
                id=w.id,
                name=w.name,
                producer=w.producer,
                vintage=w.vintage,
                type=w.type,
                quantity=w.quantity,
                purchase_price=w.purchase_price,
                drink_after_date=w.drink_after_date,
                drink_before_date=w.drink_before_date,
                grape_composition=[
                    GrapeCompositionResponse(id=gc.id, grape_variety=gc.grape_variety, percentage=gc.percentage)
                    for gc in (w.grape_compositions or [])
                ],
                has_label_image=wine_has_label(w),
            )
            for w in wines
        ]

        total_pages = (total_items + page_size - 1) // page_size
        return WineListPageResponse(items=items, page=page, page_size=page_size, total_items=total_items, total_pages=total_pages)
    except Exception as exc:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail=str(exc))


@router.get("/{wine_id}", response_model=WineResponse)
def get_wine(
    wine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WineResponse:
    try:
        wine = get_owned_wine(db, wine_id, current_user.id, load_grapes=True)
        return to_wine_response(wine)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(exc))


@router.patch("/{wine_id}", response_model=WineResponse)
def update_wine(
    wine_id: int, 
    payload: WineUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WineResponse:
    try:
        wine = get_owned_wine(db, wine_id, current_user.id, load_grapes=True)

        update_data = payload.model_dump(exclude_unset=True)
        grape_payload = update_data.pop("grape_composition", None)
        update_data.pop("label_image_base64", None)
        update_data.pop("label_image_content_type", None)

        for field, value in update_data.items():
            setattr(wine, field, value)

        if "label_image_base64" in payload.model_fields_set and payload.label_image_base64:
            image_bytes, content_type = decode_label_image(payload)
            wine.label_image = image_bytes
            wine.label_image_content_type = content_type

        if grape_payload is not None:
            wine.grape_compositions.clear()
            for gc in grape_payload:
                wine.grape_compositions.append(
                    GrapeComposition(
                        grape_variety=gc["grape_variety"],
                        percentage=gc["percentage"],
                    )
                )

        db.commit()
        wine = get_owned_wine(db, wine_id, current_user.id, load_grapes=True)
        return to_wine_response(wine)
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(exc))


@router.patch("/{wine_id}/quantity", response_model=WineResponse)
def update_wine_quantity(
    wine_id: int, 
    payload: WineQuantityUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WineResponse:
    try:
        wine = get_owned_wine(db, wine_id, current_user.id, load_grapes=True)
        
        # Calculate new quantity
        current_quantity = wine.quantity or 0
        new_quantity = current_quantity + payload.quantity_change
        
        # Validate new quantity
        if new_quantity < 0:
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST, 
                detail=f"Quantity change would result in negative quantity. Current: {current_quantity}, Change: {payload.quantity_change}"
            )
        
        # Update wine quantity
        wine.quantity = new_quantity
        
        # Create inventory log entry
        inventory_log = InventoryLog(
            wine_id=wine_id,
            change_type="manual_adjustment",
            quantity_change=payload.quantity_change,
            new_quantity=new_quantity,
            notes=payload.notes
        )
        db.add(inventory_log)
        
        # Commit the changes to the database
        db.commit()
        
        db.refresh(wine)
        
        return to_wine_response(wine)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get("/{wine_id}/inventory-log", response_model=List[InventoryLogResponse])
def get_wine_inventory_log(
    wine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[InventoryLogResponse]:
    """
    Retrieve inventory change history for a specific wine.
    Returns inventory log entries ordered by timestamp descending (most recent first).
    """
    try:
        get_owned_wine(db, wine_id, current_user.id)
        
        # Get inventory logs for the wine, ordered by timestamp descending
        stmt = (
            select(InventoryLog)
            .where(InventoryLog.wine_id == wine_id)
            .order_by(InventoryLog.timestamp.desc())
        )
        logs = db.execute(stmt).scalars().all()
        
        return [
            InventoryLogResponse(
                id=log.id,
                wine_id=log.wine_id,
                change_type=log.change_type,
                quantity_change=log.quantity_change,
                new_quantity=log.new_quantity,
                notes=log.notes,
                timestamp=log.timestamp
            )
            for log in logs
        ]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/{wine_id}/consume", response_model=WineConsumptionResponse)
def consume_wine(
    wine_id: int,
    tasting_request: TastingNoteCreateRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WineConsumptionResponse:
    """
    Record wine consumption by decrementing quantity by 1 and optionally creating a tasting note.
    """
    try:
        wine = get_owned_wine(db, wine_id, current_user.id, load_grapes=True)
        
        # Check current quantity
        current_quantity = wine.quantity or 0
        if current_quantity <= 0:
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST, 
                detail="Cannot consume wine: quantity is already 0"
            )
        
        new_quantity = current_quantity - 1
        
        # Update wine quantity
        wine.quantity = new_quantity
        
        # Create inventory log entry
        inventory_log = InventoryLog(
            wine_id=wine_id,
            change_type="consume",
            quantity_change=-1,
            new_quantity=new_quantity,
            notes="Bottle consumed"
        )
        db.add(inventory_log)
        
        # Create tasting note if provided
        tasting_note = None
        if tasting_request and (tasting_request.rating is not None or tasting_request.notes):
            # For now, use a placeholder user_id. In production, this would come from authentication
            tasting_note = TastingNote(
                wine_id=wine_id,
                user_id=current_user.id,
                rating=tasting_request.rating,
                notes=tasting_request.notes
            )
            db.add(tasting_note)
        
        # Commit the changes to the database
        db.commit()
        
        db.refresh(wine)
        db.refresh(inventory_log)
        if tasting_note:
            db.refresh(tasting_note)
        
        # Build response
        wine_response = to_wine_response(wine)
        
        inventory_log_response = InventoryLogResponse(
            id=inventory_log.id,
            wine_id=inventory_log.wine_id,
            change_type=inventory_log.change_type,
            quantity_change=inventory_log.quantity_change,
            new_quantity=inventory_log.new_quantity,
            notes=inventory_log.notes,
            timestamp=inventory_log.timestamp
        )
        
        tasting_note_response = None
        if tasting_note:
            tasting_note_response = TastingNoteResponse(
                id=tasting_note.id,
                wine_id=tasting_note.wine_id,
                user_id=tasting_note.user_id,
                rating=tasting_note.rating,
                notes=tasting_note.notes,
                timestamp=tasting_note.timestamp
            )
        
        return WineConsumptionResponse(
            wine=wine_response,
            inventory_log=inventory_log_response,
            tasting_note=tasting_note_response
        )
        
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get("/drinking-window-suggestions", response_model=DrinkingWindowSuggestionResponse)
async def drinking_window_suggestions(
    wine_type: SupportedWineType = Query(..., description="Wine type e.g., Red, White, Rosé, Sparkling, Dessert, Fortified"),
    vintage: int = Query(..., ge=1800, le=2100, description="Vintage year"),
    current_user: User = Depends(get_current_user),
) -> DrinkingWindowSuggestionResponse:
    try:
        return await fetch_drinking_window_suggestion(wine_type=wine_type, vintage=vintage)
    except ExternalApiError as e:
        raise HTTPException(status_code=HTTPStatus.BAD_GATEWAY, detail=str(e))


@router.post("/extract-from-label", response_model=LabelExtractionResponse)
async def extract_from_label(
    image: UploadFile = File(..., description="Wine label photo (JPEG, PNG, or WebP)"),
    current_user: User = Depends(get_current_user),
) -> LabelExtractionResponse:
    """
    Analyze a wine label image with Grok (xAI) and return suggested form fields.
    Does not create a wine; client should review and submit via POST /api/wines.
    """
    content_type = image.content_type or "application/octet-stream"
    image_bytes = await image.read()
    try:
        return await extract_wine_from_label_image(
            image_bytes=image_bytes,
            content_type=content_type,
            config=XaiConfig.from_env(),
        )
    except LabelExtractionError as e:
        message = str(e)
        status = HTTPStatus.BAD_REQUEST
        if "not configured" in message or "authentication" in message.lower():
            status = HTTPStatus.SERVICE_UNAVAILABLE
        elif "xAI error" in message or "rate limit" in message.lower() or "timed out" in message.lower():
            status = HTTPStatus.BAD_GATEWAY
        raise HTTPException(status_code=status, detail=message)



@router.get("/{wine_id}/label-image")
def get_wine_label_image(
    wine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    wine = get_owned_wine(db, wine_id, current_user.id)
    if not wine.label_image:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Ingen etikettbilde for denne vinen")
    return Response(
        content=wine.label_image,
        media_type=wine.label_image_content_type or "image/jpeg",
        headers={"Cache-Control": "private, max-age=3600"},
    )


@router.post("", response_model=WineResponse, status_code=HTTPStatus.CREATED)
def create_wine(
    payload: WineCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WineResponse:
    try:
        label_bytes, label_type = decode_label_image(payload)
        wine = Wine(
            user_id=current_user.id,
            name=payload.name,
            type=payload.type,
            producer=payload.producer,
            vintage=payload.vintage,
            country=payload.country,
            district=payload.district,
            subdistrict=payload.subdistrict,
            purchase_price=payload.purchase_price,
            quantity=payload.quantity,
            drink_after_date=payload.drink_after_date,
            drink_before_date=payload.drink_before_date,
            label_image=label_bytes,
            label_image_content_type=label_type if label_bytes else None,
        )
        db.add(wine)
        db.flush()

        created_grapes: List[GrapeComposition] = []
        if payload.grape_composition:
            for gc in payload.grape_composition:
                gc_row = GrapeComposition(
                    wine_id=wine.id,
                    grape_variety=gc.grape_variety,
                    percentage=gc.percentage,
                )
                db.add(gc_row)
                created_grapes.append(gc_row)

        db.commit()
        db.refresh(wine)
        if created_grapes and not wine.grape_compositions:
            wine.grape_compositions = created_grapes
        return to_wine_response(wine)
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(exc))

