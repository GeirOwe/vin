from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import List, Optional, Literal

from pydantic import BaseModel, Field, model_validator


class GrapeCompositionSchema(BaseModel):
    grape_variety: str = Field(min_length=1, max_length=100)
    percentage: float = Field(ge=0, le=100)


class WineCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: Optional["WineType"] = Field(default=None)
    producer: Optional[str] = Field(default=None, max_length=255)
    vintage: Optional[int] = Field(default=None, ge=1800, le=2100)
    country: Optional[str] = Field(default=None, max_length=100)
    district: Optional[str] = Field(default=None, max_length=100)
    subdistrict: Optional[str] = Field(default=None, max_length=100)
    purchase_price: Optional[float] = Field(default=None, ge=0)
    quantity: Optional[int] = Field(default=None, ge=0)
    drink_after_date: Optional[date] = None
    drink_before_date: Optional[date] = None

    grape_composition: Optional[List[GrapeCompositionSchema]] = None

    @model_validator(mode="after")
    def validate_dates_and_grapes(self) -> "WineCreateRequest":
        if self.drink_after_date and self.drink_before_date:
            if self.drink_after_date >= self.drink_before_date:
                raise ValueError("drink_before_date must be later than drink_after_date")
        if self.grape_composition and len(self.grape_composition) > 0:
            total = sum(gc.percentage for gc in self.grape_composition)
            if abs(total - 100.0) > 0.5:
                raise ValueError("Sum of grape composition percentages must be approximately 100 (±0.5)")
            # Enforce unique grape varieties in the composition
            varieties = [gc.grape_variety.strip().lower() for gc in self.grape_composition]
            if len(set(varieties)) != len(varieties):
                raise ValueError("Duplicate grape varieties are not allowed in grape_composition")
        return self


class WineUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    type: Optional["WineType"] = Field(default=None)
    producer: Optional[str] = Field(default=None, max_length=255)
    vintage: Optional[int] = Field(default=None, ge=1800, le=2100)
    country: Optional[str] = Field(default=None, max_length=100)
    district: Optional[str] = Field(default=None, max_length=100)
    subdistrict: Optional[str] = Field(default=None, max_length=100)
    purchase_price: Optional[float] = Field(default=None, ge=0)
    quantity: Optional[int] = Field(default=None, ge=0)
    drink_after_date: Optional[date] = None
    drink_before_date: Optional[date] = None

    @model_validator(mode="after")
    def validate_dates(self) -> "WineUpdateRequest":
        if self.drink_after_date and self.drink_before_date:
            if self.drink_after_date >= self.drink_before_date:
                raise ValueError("drink_before_date must be later than drink_after_date")
        return self


class GrapeCompositionResponse(BaseModel):
    id: int
    grape_variety: str
    percentage: float


class WineResponse(BaseModel):
    id: int
    name: str
    type: Optional["WineType"]
    producer: Optional[str]
    vintage: Optional[int]
    country: Optional[str]
    district: Optional[str]
    subdistrict: Optional[str]
    purchase_price: Optional[float]
    quantity: Optional[int]
    drink_after_date: Optional[date]
    drink_before_date: Optional[date]
    grape_composition: List[GrapeCompositionResponse] = []

    class Config:
        from_attributes = True


class DrinkingWindowSuggestionResponse(BaseModel):
    drink_after_date: date
    drink_before_date: date


# Filtering & pagination
class WineType(str, Enum):
    Red = "Red"
    White = "White"
    Rose = "Rose"
    Sparkling = "Sparkling"
    Dessert = "Dessert"
    Fortified = "Fortified"


class WineFilterParameters(BaseModel):
    search_term: Optional[str] = None
    wine_type: Optional[WineType] = None
    vintage: Optional[int] = Field(default=None, ge=1800, le=2100)
    country: Optional[str] = None
    district: Optional[str] = None
    subdistrict: Optional[str] = None
    drinking_window_status: Optional[Literal["ready_to_drink", "approaching_deadline", "not_ready"]] = None


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(10, ge=1, le=100)


class SortingParams(BaseModel):
    sort_by: Literal["id", "name", "producer", "vintage", "type"] = "id"
    sort_order: Literal["asc", "desc"] = "desc"


class WineListItem(BaseModel):
    id: int
    name: str
    producer: Optional[str]
    vintage: Optional[int]
    type: Optional["WineType"]
    quantity: Optional[int] = None
    grape_composition: List[GrapeCompositionResponse] = []

    class Config:
        from_attributes = True


class WineListPageResponse(BaseModel):
    items: List[WineListItem]
    page: int
    page_size: int
    total_items: int
    total_pages: int


class WineQuantityUpdateRequest(BaseModel):
    quantity_change: int = Field(description="Change in quantity (positive for increase, negative for decrease)")
    notes: Optional[str] = Field(default=None, max_length=500, description="Optional notes about the inventory change")


class InventoryLogResponse(BaseModel):
    id: int
    wine_id: int
    change_type: str
    quantity_change: int
    new_quantity: int
    notes: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class TastingNoteCreateRequest(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=10, description="Rating from 1 to 10")
    notes: Optional[str] = Field(default=None, max_length=1000, description="Tasting notes")


class TastingNoteResponse(BaseModel):
    id: int
    wine_id: int
    user_id: int
    rating: Optional[int] = None
    notes: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class WineConsumptionResponse(BaseModel):
    wine: WineResponse
    inventory_log: InventoryLogResponse
    tasting_note: Optional[TastingNoteResponse] = None
