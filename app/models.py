from __future__ import annotations

from datetime import date
from typing import List

from sqlalchemy import Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Wine(Base):
    __tablename__ = "wines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    producer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    vintage: Mapped[int | None] = mapped_column(Integer, nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    subdistrict: Mapped[str | None] = mapped_column(String(100), nullable=True)
    purchase_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    drink_after_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    drink_before_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    grape_compositions: Mapped[List["GrapeComposition"]] = relationship(
        back_populates="wine", cascade="all, delete-orphan"
    )


class GrapeComposition(Base):
    __tablename__ = "grape_compositions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    wine_id: Mapped[int] = mapped_column(ForeignKey("wines.id", ondelete="CASCADE"), nullable=False, index=True)
    grape_variety: Mapped[str] = mapped_column(String(100), nullable=False)
    percentage: Mapped[float] = mapped_column(Float, nullable=False)

    wine: Mapped[Wine] = relationship(back_populates="grape_compositions")
