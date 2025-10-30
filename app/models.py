from __future__ import annotations

from datetime import date, datetime
from typing import List

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Wine(Base):
    __tablename__ = "wines"
    __table_args__ = (
        CheckConstraint("quantity IS NULL OR quantity >= 0", name="ck_wines_quantity_non_negative"),
        CheckConstraint("purchase_price IS NULL OR purchase_price >= 0", name="ck_wines_price_non_negative"),
        CheckConstraint(
            "(drink_after_date IS NULL OR drink_before_date IS NULL) OR (drink_after_date < drink_before_date)",
            name="ck_wines_drinking_window_order",
        ),
    )

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
    
    inventory_logs: Mapped[List["InventoryLog"]] = relationship(
        back_populates="wine", cascade="all, delete-orphan"
    )
    
    tasting_notes: Mapped[List["TastingNote"]] = relationship(
        back_populates="wine", cascade="all, delete-orphan"
    )


class GrapeComposition(Base):
    __tablename__ = "grape_compositions"
    __table_args__ = (
        CheckConstraint("percentage >= 0 AND percentage <= 100", name="ck_grapes_percentage_range"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    wine_id: Mapped[int] = mapped_column(ForeignKey("wines.id", ondelete="CASCADE"), nullable=False, index=True)
    grape_variety: Mapped[str] = mapped_column(String(100), nullable=False)
    percentage: Mapped[float] = mapped_column(Float, nullable=False)

    wine: Mapped[Wine] = relationship(back_populates="grape_compositions")


class InventoryLog(Base):
    __tablename__ = "inventory_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    wine_id: Mapped[int] = mapped_column(ForeignKey("wines.id", ondelete="CASCADE"), nullable=False, index=True)
    change_type: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity_change: Mapped[int] = mapped_column(Integer, nullable=False)
    new_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    wine: Mapped[Wine] = relationship(back_populates="inventory_logs")


class TastingNote(Base):
    __tablename__ = "tasting_notes"
    __table_args__ = (
        CheckConstraint("rating IS NULL OR (rating >= 1 AND rating <= 10)", name="ck_notes_rating_range"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    wine_id: Mapped[int] = mapped_column(ForeignKey("wines.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # In production, this would be a proper user relationship
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Rating scale 1-10
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    wine: Mapped[Wine] = relationship(back_populates="tasting_notes")
