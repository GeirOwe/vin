"""
Query construction utilities for common database operations.

This module provides reusable query building functions that follow
SQLAlchemy 2.0 patterns and best practices.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

from sqlalchemy import Select, func
from sqlalchemy.orm import selectinload

from ..models import Wine, GrapeComposition


def build_wine_base_query(include_compositions: bool = True) -> Select:
    """
    Build a base query for Wine with optional eager loading of relationships.
    
    Args:
        include_compositions: If True, eagerly load grape_compositions to prevent N+1 queries
        
    Returns:
        Select statement for Wine queries
    """
    stmt = Select(Wine)
    if include_compositions:
        stmt = stmt.options(selectinload(Wine.grape_compositions))
    return stmt


def apply_wine_filters(
    stmt: Select,
    search_term: Optional[str] = None,
    wine_type: Optional[str] = None,
    vintage: Optional[int] = None,
    country: Optional[str] = None,
    district: Optional[str] = None,
    subdistrict: Optional[str] = None,
    drinking_window_status: Optional[str] = None,
) -> Select:
    """
    Apply common filters to a Wine query.
    
    Args:
        stmt: Base Select statement for Wine
        search_term: Search by wine name or producer (case-insensitive, partial match)
        wine_type: Filter by wine type
        vintage: Filter by vintage year
        country: Filter by country
        district: Filter by district
        subdistrict: Filter by subdistrict
        drinking_window_status: Filter by drinking window status
            - "ready_to_drink": Wines currently in optimal drinking window
            - "approaching_deadline": Wines that should be consumed within 30 days
            - "not_ready": Wines not yet ready to drink
            Note: All drinking window status filters exclude wines with zero quantity
        
    Returns:
        Select statement with filters applied
    """
    if search_term:
        like = f"%{search_term}%"
        stmt = stmt.filter((Wine.name.ilike(like)) | (Wine.producer.ilike(like)))
    
    if wine_type:
        stmt = stmt.filter(Wine.type == wine_type)
    
    if vintage is not None:
        stmt = stmt.filter(Wine.vintage == vintage)
    
    if country:
        stmt = stmt.filter(Wine.country == country)
    
    if district:
        stmt = stmt.filter(Wine.district == district)
    
    if subdistrict:
        stmt = stmt.filter(Wine.subdistrict == subdistrict)
    
    # Drinking window status filtering
    if drinking_window_status:
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


def apply_sorting(
    stmt: Select,
    sort_by: str = "id",
    sort_order: str = "desc",
) -> Select:
    """
    Apply sorting to a Wine query.
    
    Args:
        stmt: Select statement to sort
        sort_by: Field to sort by (id, name, producer, vintage, type)
        sort_order: Sort order (asc or desc)
        
    Returns:
        Select statement with sorting applied
        
    Raises:
        ValueError: If sort_by is not a valid field
    """
    sort_fields = {
        "id": Wine.id,
        "name": Wine.name,
        "producer": Wine.producer,
        "vintage": Wine.vintage,
        "type": Wine.type,
    }
    
    if sort_by not in sort_fields:
        raise ValueError(f"Invalid sort_by field: {sort_by}. Must be one of {list(sort_fields.keys())}")
    
    sort_field = sort_fields[sort_by]
    
    if sort_order == "desc":
        return stmt.order_by(sort_field.desc())
    else:
        return stmt.order_by(sort_field.asc())


def apply_pagination(
    stmt: Select,
    page: int,
    page_size: int,
) -> Select:
    """
    Apply pagination to a query.
    
    Args:
        stmt: Select statement to paginate
        page: Page number (1-indexed)
        page_size: Number of items per page
        
    Returns:
        Select statement with pagination applied
    """
    offset = (page - 1) * page_size
    return stmt.offset(offset).limit(page_size)


def build_wine_count_query(
    search_term: Optional[str] = None,
    wine_type: Optional[str] = None,
    vintage: Optional[int] = None,
    country: Optional[str] = None,
    district: Optional[str] = None,
    subdistrict: Optional[str] = None,
    drinking_window_status: Optional[str] = None,
) -> Select:
    """
    Build a count query for wines with filters applied.
    
    Args:
        search_term: Search by wine name or producer
        wine_type: Filter by wine type
        vintage: Filter by vintage year
        country: Filter by country
        district: Filter by district
        subdistrict: Filter by subdistrict
        drinking_window_status: Filter by drinking window status
        
    Returns:
        Select statement for counting wines
    """
    stmt = Select(func.count(Wine.id))
    return apply_wine_filters(
        stmt,
        search_term=search_term,
        wine_type=wine_type,
        vintage=vintage,
        country=country,
        district=district,
        subdistrict=subdistrict,
        drinking_window_status=drinking_window_status,
    )

