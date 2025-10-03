from __future__ import annotations

from http import HTTPStatus
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from ...database import get_db, engine, Base
from ...models import Wine, GrapeComposition
from ...schemas import (
    WineCreateRequest,
    WineResponse,
    GrapeCompositionResponse,
    DrinkingWindowSuggestionResponse,
    WineListPageResponse,
    WineListItem,
    WineType,
)
from ...services.wine_api_service import fetch_drinking_window_suggestion, ExternalApiError, SupportedWineType


# Ensure tables exist (simple auto-create). In production, use Alembic migrations instead.
Base.metadata.create_all(bind=engine)

router = APIRouter(prefix="/api/wines", tags=["wines"])


def apply_filters(stmt, search_term: Optional[str], wine_type: Optional[WineType], vintage: Optional[int], country: Optional[str], district: Optional[str], subdistrict: Optional[str]):
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
        stmt = stmt.filter(Wine.district == district)
    if subdistrict:
        stmt = stmt.filter(Wine.subdistrict == subdistrict)
    return stmt


@router.get("", response_model=List[WineResponse])
def list_wines(
    db: Session = Depends(get_db),
    search_term: Optional[str] = Query(None),
    wine_type: Optional[WineType] = Query(None),
    vintage: Optional[int] = Query(None, ge=1800, le=2100),
    country: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    subdistrict: Optional[str] = Query(None),
) -> List[WineResponse]:
    try:
        stmt = select(Wine).options(selectinload(Wine.grape_compositions)).order_by(Wine.id.desc())
        stmt = apply_filters(stmt, search_term, wine_type, vintage, country, district, subdistrict)
        wines = db.execute(stmt).scalars().all()
        return [
            WineResponse(
                id=w.id,
                name=w.name,
                type=w.type,
                producer=w.producer,
                vintage=w.vintage,
                country=w.country,
                district=w.district,
                subdistrict=w.subdistrict,
                purchase_price=w.purchase_price,
                quantity=w.quantity,
                drink_after_date=w.drink_after_date,
                drink_before_date=w.drink_before_date,
                grape_composition=[
                    GrapeCompositionResponse(id=gc.id, grape_variety=gc.grape_variety, percentage=gc.percentage)
                    for gc in (w.grape_compositions or [])
                ],
            )
            for w in wines
        ]
    except Exception as exc:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get("/page", response_model=WineListPageResponse)
def list_wines_page(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("id", pattern="^(id|name|producer|vintage|type)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search_term: Optional[str] = Query(None),
    wine_type: Optional[WineType] = Query(None),
    vintage: Optional[int] = Query(None, ge=1800, le=2100),
    country: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    subdistrict: Optional[str] = Query(None),
) -> WineListPageResponse:
    try:
        # Base query with eager load to prevent N+1
        base_stmt = select(Wine).options(selectinload(Wine.grape_compositions))
        base_stmt = apply_filters(base_stmt, search_term, wine_type, vintage, country, district, subdistrict)

        # Sorting
        sort_field = {
            "id": Wine.id,
            "name": Wine.name,
            "producer": Wine.producer,
            "vintage": Wine.vintage,
            "type": Wine.type,
        }[sort_by]
        if sort_order == "desc":
            base_stmt = base_stmt.order_by(sort_field.desc())
        else:
            base_stmt = base_stmt.order_by(sort_field.asc())

        # Count total AFTER filters
        count_stmt = select(func.count(Wine.id))
        count_stmt = apply_filters(count_stmt, search_term, wine_type, vintage, country, district, subdistrict)
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
                grape_composition=[
                    GrapeCompositionResponse(id=gc.id, grape_variety=gc.grape_variety, percentage=gc.percentage)
                    for gc in (w.grape_compositions or [])
                ],
            )
            for w in wines
        ]

        total_pages = (total_items + page_size - 1) // page_size
        return WineListPageResponse(items=items, page=page, page_size=page_size, total_items=total_items, total_pages=total_pages)
    except Exception as exc:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail=str(exc))


@router.get("/drinking-window-suggestions", response_model=DrinkingWindowSuggestionResponse)
async def drinking_window_suggestions(
    wine_type: SupportedWineType = Query(..., description="Wine type e.g., Red, White, Rosé, Sparkling, Dessert, Fortified"),
    vintage: int = Query(..., ge=1800, le=2100, description="Vintage year"),
) -> DrinkingWindowSuggestionResponse:
    try:
        return await fetch_drinking_window_suggestion(wine_type=wine_type, vintage=vintage)
    except ExternalApiError as e:
        raise HTTPException(status_code=HTTPStatus.BAD_GATEWAY, detail=str(e))


@router.post("", response_model=WineResponse, status_code=HTTPStatus.CREATED)
def create_wine(payload: WineCreateRequest, db: Session = Depends(get_db)) -> WineResponse:
    try:
        with db.begin():
            wine = Wine(
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
            )
            db.add(wine)
            db.flush()  # Ensure wine.id is available

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

        # session committed successfully
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
                for gc in (wine.grape_compositions or created_grapes)
            ],
        )
    except HTTPException:
        raise
    except Exception as exc:
        # Any exception should trigger rollback due to context manager; return 500
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(exc))

