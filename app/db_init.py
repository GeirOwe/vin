from __future__ import annotations

from sqlalchemy import inspect

from .database import Base, engine
from .core.logging import get_logger

logger = get_logger(__name__)


def ensure_schema() -> None:
    """
    Create tables. If the auth schema is missing (no users table / no wines.user_id),
    drop and recreate so we can introduce multi-user ownership cleanly.
    Existing wine data will be wiped in that one-time migration.
    """
    # Import models so metadata is populated
    from . import models  # noqa: F401

    insp = inspect(engine)
    tables = set(insp.get_table_names())
    needs_reset = False

    if "users" not in tables:
        needs_reset = True
    elif "wines" in tables:
        wine_cols = {c["name"] for c in insp.get_columns("wines")}
        if "user_id" not in wine_cols:
            needs_reset = True

    if needs_reset and tables:
        logger.warning(
            "Database schema is missing user ownership — resetting tables "
            "(existing wine data will be deleted)."
        )
        Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)
    logger.info("Database schema ready")
