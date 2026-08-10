from __future__ import annotations

import os
from typing import Generator
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from sqlalchemy.pool import NullPool


def _normalize_database_url(url: str) -> str:
    """Normalize provider URLs for SQLAlchemy + Neon/Postgres.

    - Heroku/Neon/Render sometimes use postgres://; SQLAlchemy expects postgresql://
    - Neon requires SSL; ensure sslmode=require when connecting to neon.tech
    """
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]

    if "neon.tech" not in url:
        return url

    parsed = urlparse(url)
    query = parse_qs(parsed.query, keep_blank_values=True)
    if "sslmode" not in query:
        query["sslmode"] = ["require"]
    return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


DATABASE_URL = _normalize_database_url(os.getenv("DATABASE_URL", "sqlite:///./vin.db"))

# For SQLite, check_same_thread must be False when using threads (e.g., with FastAPI/Uvicorn)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Connection pooling for PostgreSQL. Neon pooler (PgBouncer) needs NullPool.
is_postgresql = DATABASE_URL.startswith("postgresql")
uses_neon_pooler = is_postgresql and "-pooler." in DATABASE_URL
pool_kwargs: dict = {}
if is_postgresql:
    if uses_neon_pooler:
        # Neon pooled endpoint: let Neon/PgBouncer manage connections
        pool_kwargs = {
            "poolclass": NullPool,
        }
    else:
        pool_kwargs = {
            "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
            "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
            "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
            "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "3600")),
            "pool_pre_ping": True,
        }

engine = create_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args=connect_args,
    **pool_kwargs,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, class_=Session, future=True)


def check_database_connection() -> tuple[bool, str]:
    """
    Check if the database is accessible.
    Returns (is_healthy, message) tuple.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True, "Database connection successful"
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
