from __future__ import annotations

import logging
import sys
from typing import Optional

from .config import LoggingConfig


def setup_logging(config: Optional[LoggingConfig] = None) -> None:
    """
    Configure application logging based on settings.
    
    Args:
        config: Logging configuration. If None, loads from environment.
    """
    if config is None:
        config = LoggingConfig.from_env()
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, config.level, logging.INFO),
        format=config.format,
        datefmt=config.date_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ],
    )
    
    # Set log levels for third-party libraries
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    # Get application logger
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured with level: {config.level}")


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a module.
    
    Args:
        name: Logger name (typically __name__ of the calling module)
        
    Returns:
        Logger instance
    """
    return logging.getLogger(name)

