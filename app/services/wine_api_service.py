from __future__ import annotations

import httpx
from datetime import date
from typing import Literal

from ..core.config import load_external_wine_api_config
from ..schemas import DrinkingWindowSuggestionResponse

SupportedWineType = Literal["Red", "White", "Rosé", "Sparkling", "Dessert", "Fortified"]


class ExternalApiError(Exception):
    pass


async def fetch_drinking_window_suggestion(wine_type: SupportedWineType, vintage: int) -> DrinkingWindowSuggestionResponse:
    cfg = load_external_wine_api_config()
    if not cfg.base_url or not cfg.api_key:
        raise ExternalApiError("External wine API is not configured")

    headers = {"Authorization": f"Bearer {cfg.api_key}", "Accept": "application/json"}

    url = f"{cfg.base_url.rstrip('/')}/suggestions/drinking-window"
    params = {"wine_type": wine_type, "vintage": vintage}

    timeout = httpx.Timeout(10.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            resp = await client.get(url, headers=headers, params=params)
        except httpx.ConnectTimeout:
            raise ExternalApiError("External wine API timed out")
        except httpx.HTTPError as e:
            raise ExternalApiError(f"External wine API error: {e}")

    if resp.status_code == 429:
        raise ExternalApiError("External wine API rate limit exceeded")
    if resp.status_code >= 500:
        raise ExternalApiError("External wine API unavailable")
    if resp.status_code >= 400:
        try:
            detail = resp.json().get("detail")
        except Exception:
            detail = None
        raise ExternalApiError(detail or f"External wine API request failed ({resp.status_code})")

    try:
        data = resp.json()
        # Expecting keys: drink_after_date, drink_before_date as ISO strings
        after = date.fromisoformat(data["drink_after_date"])  # may raise
        before = date.fromisoformat(data["drink_before_date"])  # may raise
    except Exception:
        raise ExternalApiError("Invalid response from external wine API")

    if after >= before:
        raise ExternalApiError("External API returned invalid drinking window range")

    return DrinkingWindowSuggestionResponse(drink_after_date=after, drink_before_date=before)
