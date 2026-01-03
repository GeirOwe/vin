"""
Database models for the wine collection management system.

This module defines SQLAlchemy 2.0 ORM models with type annotations,
relationships, and database-level constraints for data integrity.
"""

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
    """
    Wine entity representing a wine in the collection.
    
    Attributes:
        id: Primary key
        name: Wine name (required)
        type: Wine type (Red, White, Rosé, Sparkling, Dessert, Fortified)
        producer: Wine producer name
        vintage: Vintage year (1800-2100)
        country: Country of origin
        district: Wine district/region
        subdistrict: Wine subdistrict/subregion
        purchase_price: Purchase price (must be >= 0)
        quantity: Current inventory quantity (must be >= 0)
        drink_after_date: Earliest recommended drinking date
        drink_before_date: Latest recommended drinking date (must be > drink_after_date)
        grape_compositions: Related grape composition records
        inventory_logs: Related inventory change log records
        tasting_notes: Related tasting note records
    
    Constraints:
        - Quantity must be non-negative
        - Purchase price must be non-negative
        - drink_before_date must be after drink_after_date
    """
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
    """
    Grape composition for a wine.
    
    Represents the percentage breakdown of grape varieties in a wine.
    
    Attributes:
        id: Primary key
        wine_id: Foreign key to Wine
        grape_variety: Name of the grape variety
        percentage: Percentage of this variety (0-100)
        wine: Relationship to parent Wine
    
    Constraints:
        - Percentage must be between 0 and 100 (inclusive)
    """
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
    """
    Inventory change log for audit trail.
    
    Tracks all quantity changes (additions, removals, adjustments) for wines.
    
    Attributes:
        id: Primary key
        wine_id: Foreign key to Wine
        change_type: Type of change (e.g., "purchase", "consumption", "adjustment")
        quantity_change: Change in quantity (positive or negative)
        new_quantity: Quantity after this change
        notes: Optional notes about the change
        timestamp: When the change occurred (auto-set to UTC now)
        wine: Relationship to parent Wine
    """
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
    """
    Tasting note for a wine.
    
    Records user ratings and notes when consuming a wine.
    
    Attributes:
        id: Primary key
        wine_id: Foreign key to Wine
        user_id: User who created the note (in production, this would be a proper User relationship)
        rating: Rating on a scale of 1-10
        notes: Free-text tasting notes
        timestamp: When the note was created (auto-set to UTC now)
        wine: Relationship to parent Wine
    
    Constraints:
        - Rating must be between 1 and 10 (inclusive) if provided
    """
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
