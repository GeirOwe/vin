from __future__ import annotations

import os
from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class DatabaseConfig:
    """Database configuration settings."""
    url: str
    pool_size: int
    max_overflow: int
    pool_timeout: int
    pool_recycle: int

    @classmethod
    def from_env(cls) -> DatabaseConfig:
        """Load database configuration from environment variables."""
        return cls(
            url=os.getenv("DATABASE_URL", "sqlite:///./vin.db"),
            pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
            max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
            pool_timeout=int(os.getenv("DB_POOL_TIMEOUT", "30")),
            pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "3600")),
        )


@dataclass(frozen=True)
class CORSConfig:
    """CORS configuration settings."""
    allowed_origins: List[str]
    allow_credentials: bool
    allow_methods: List[str]
    allow_headers: List[str]

    @classmethod
    def from_env(cls) -> CORSConfig:
        """Load CORS configuration from environment variables."""
        origins_str = os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        )
        origins = [o.strip() for o in origins_str.split(",") if o.strip()]
        return cls(
            allowed_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )


@dataclass(frozen=True)
class ExternalWineApiConfig:
    """External wine API configuration."""
    base_url: str | None
    api_key: str | None

    @classmethod
    def from_env(cls) -> ExternalWineApiConfig:
        """Load external wine API configuration from environment variables."""
        return cls(
            base_url=os.getenv("EXTERNAL_WINE_API_BASE_URL"),
            api_key=os.getenv("EXTERNAL_WINE_API_KEY"),
        )


@dataclass(frozen=True)
class LoggingConfig:
    """Logging configuration settings."""
    level: str
    format: str
    date_format: str

    @classmethod
    def from_env(cls) -> LoggingConfig:
        """Load logging configuration from environment variables."""
        return cls(
            level=os.getenv("LOG_LEVEL", "INFO").upper(),
            format=os.getenv(
                "LOG_FORMAT",
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            ),
            date_format=os.getenv("LOG_DATE_FORMAT", "%Y-%m-%d %H:%M:%S"),
        )


@dataclass(frozen=True)
class Settings:
    """Application settings combining all configuration."""
    database: DatabaseConfig
    cors: CORSConfig
    external_wine_api: ExternalWineApiConfig
    logging: LoggingConfig
    environment: str
    debug: bool

    @classmethod
    def from_env(cls) -> Settings:
        """Load all settings from environment variables."""
        environment = os.getenv("ENVIRONMENT", "development")
        return cls(
            database=DatabaseConfig.from_env(),
            cors=CORSConfig.from_env(),
            external_wine_api=ExternalWineApiConfig.from_env(),
            logging=LoggingConfig.from_env(),
            environment=environment,
            debug=os.getenv("DEBUG", "false").lower() == "true",
        )


# Convenience functions for backward compatibility
def load_external_wine_api_config() -> ExternalWineApiConfig:
    """Load external wine API configuration (backward compatibility)."""
    return ExternalWineApiConfig.from_env()
