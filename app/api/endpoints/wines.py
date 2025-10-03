from __future__ import annotations

from http import HTTPStatus
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...database import get_db, engine, Base
from ...models import Wine, GrapeComposition
from ...schemas import WineCreateRequest, WineResponse, GrapeCompositionResponse


# Ensure tables exist (simple auto-create). In production, use Alembic migrations instead.
Base.metadata.create_all(bind=engine)

router = APIRouter(prefix="/api/wines", tags=["wines"])


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

