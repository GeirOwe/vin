from __future__ import annotations

from sqlalchemy import inspect, text

from .database import Base, engine
from .core.logging import get_logger

logger = get_logger(__name__)


def _add_column_if_missing(table: str, column: str, ddl_type: str) -> None:
    insp = inspect(engine)
    if table not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns(table)}
    if column in cols:
        return
    logger.info(f"Adding missing column {table}.{column}")
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))


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

    # Non-destructive column adds for newer features
    blob_type = "BYTEA" if engine.dialect.name == "postgresql" else "BLOB"
    _add_column_if_missing("wines", "label_image", blob_type)
    _add_column_if_missing("wines", "label_image_content_type", "VARCHAR(100)")

    logger.info("Database schema ready")
