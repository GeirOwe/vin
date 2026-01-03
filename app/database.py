from __future__ import annotations

import os
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vin.db")

# For SQLite, check_same_thread must be False when using threads (e.g., with FastAPI/Uvicorn)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Connection pooling configuration for PostgreSQL (Aurora, Render PostgreSQL, etc.)
# SQLite doesn't support connection pooling, so these are only applied to PostgreSQL
is_postgresql = DATABASE_URL.startswith("postgresql")
pool_kwargs = {}
if is_postgresql:
    # Connection pool settings optimized for production PostgreSQL databases
    pool_kwargs = {
        "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),  # Number of connections to maintain
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),  # Additional connections beyond pool_size
        "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),  # Seconds to wait for connection
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "3600")),  # Recycle connections after 1 hour
        "pool_pre_ping": True,  # Verify connections before using (helps with connection health)
    }

engine = create_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args=connect_args,
    **pool_kwargs
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
