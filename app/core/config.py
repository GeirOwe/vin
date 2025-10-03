from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ExternalWineApiConfig:
    base_url: str | None
    api_key: str | None


def load_external_wine_api_config() -> ExternalWineApiConfig:
    return ExternalWineApiConfig(
        base_url=os.getenv("EXTERNAL_WINE_API_BASE_URL"),
        api_key=os.getenv("EXTERNAL_WINE_API_KEY"),
    )
