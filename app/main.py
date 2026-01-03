from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.endpoints.wines import router as wines_router
from .core.config import Settings
from .core.logging import setup_logging, get_logger
from .database import check_database_connection

# Initialize settings
settings = Settings.from_env()

# Setup logging
setup_logging(settings.logging)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting VIN API application...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Debug mode: {settings.debug}")
    
    # Verify database connection on startup
    db_healthy, db_message = check_database_connection()
    if db_healthy:
        logger.info("Database connection verified successfully")
    else:
        logger.warning(f"Database connection check failed: {db_message}")
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down VIN API application...")
    # Add any cleanup logic here (close connections, cleanup resources, etc.)
    logger.info("Application shutdown complete")


# Create FastAPI application with lifespan
app = FastAPI(
    title="VIN API",
    description="Wine Collection Management System API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors.allowed_origins,
    allow_credentials=settings.cors.allow_credentials,
    allow_methods=settings.cors.allow_methods,
    allow_headers=settings.cors.allow_headers,
)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "status": "ok",
        "service": "VIN API",
        "version": "1.0.0",
        "routes": ["/api/wines"],
    }

# Health check endpoint
@app.get("/health")
async def health():
    """
    Health check endpoint that verifies both API and database connectivity.
    Returns detailed status information for monitoring.
    """
    db_healthy, db_message = check_database_connection()
    
    status = "ok" if db_healthy else "degraded"
    
    return {
        "status": status,
        "api": "ok",
        "database": {
            "status": "ok" if db_healthy else "error",
            "message": db_message
        }
    }

# Include routers
app.include_router(wines_router)
