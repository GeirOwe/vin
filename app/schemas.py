from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator


class GrapeCompositionSchema(BaseModel):
    grape_variety: str = Field(min_length=1, max_length=100)
    percentage: float = Field(ge=0, le=100)


class WineCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: Optional[str] = Field(default=None, max_length=100)
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
        return self


class GrapeCompositionResponse(BaseModel):
    id: int
    grape_variety: str
    percentage: float


class WineResponse(BaseModel):
    id: int
    name: str
    type: Optional[str]
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
