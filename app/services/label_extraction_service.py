from __future__ import annotations

import base64
import json
import re
from typing import Any

import httpx

from ..core.config import XaiConfig
from ..schemas import LabelExtractionResponse, WineType


class LabelExtractionError(Exception):
    """Raised when label extraction fails."""


ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 12 * 1024 * 1024  # 12 MiB (xAI limit is 20 MiB)

SYSTEM_PROMPT = """You are an expert sommelier reading wine bottle labels from photos.
Extract structured wine information visible on the label.
Return ONLY a JSON object (no markdown) with these keys:
- name (string|null): wine name / cuvée as shown on the label
- type (string|null): one of Red, White, Rose, Sparkling, Dessert, Fortified
- producer (string|null): winery / producer / château / domain
- vintage (integer|null): 4-digit year if shown
- country (string|null)
- district (string|null): region / appellation / district (e.g. Bordeaux, Piedmont)
- subdistrict (string|null): more specific area if shown (e.g. Pauillac, Barolo)
- grape_composition (array|null): objects with grape_variety (string) and percentage (number 0-100).
  If grapes are listed without percentages, omit percentages or estimate only when clearly stated.
  If percentages are unknown, return varieties with equal shares that sum to 100, or a single variety at 100.
- notes (string|null): brief note about uncertainty or what was hard to read

Use null for fields you cannot determine from the image.
Do not invent a famous wine if the label is unreadable — prefer nulls.
Map Rosé/rosé to type "Rose".
"""

USER_PROMPT = (
    "Read this wine label image and extract the wine details as JSON. "
    "Focus on text printed on the label."
)


def _normalize_wine_type(raw: Any) -> WineType | None:
    if raw is None:
        return None
    text = str(raw).strip().lower().replace("é", "e")
    mapping = {
        "red": WineType.Red,
        "white": WineType.White,
        "rose": WineType.Rose,
        "rosé": WineType.Rose,
        "sparkling": WineType.Sparkling,
        "dessert": WineType.Dessert,
        "fortified": WineType.Fortified,
    }
    return mapping.get(text)


def _parse_json_content(content: str) -> dict[str, Any]:
    content = content.strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)
    return json.loads(content)


def _to_response(data: dict[str, Any]) -> LabelExtractionResponse:
    grapes_raw = data.get("grape_composition")
    grapes = None
    if isinstance(grapes_raw, list):
        grapes = []
        for item in grapes_raw:
            if not isinstance(item, dict):
                continue
            variety = (item.get("grape_variety") or item.get("variety") or "").strip()
            if not variety:
                continue
            pct = item.get("percentage")
            try:
                percentage = float(pct) if pct is not None else None
            except (TypeError, ValueError):
                percentage = None
            grapes.append(
                {
                    "grape_variety": variety[:100],
                    "percentage": percentage,
                }
            )
        if not grapes:
            grapes = None

    vintage = data.get("vintage")
    try:
        vintage_int = int(vintage) if vintage is not None else None
    except (TypeError, ValueError):
        vintage_int = None
    if vintage_int is not None and (vintage_int < 1800 or vintage_int > 2100):
        vintage_int = None

    def _str(key: str) -> str | None:
        val = data.get(key)
        if val is None:
            return None
        text = str(val).strip()
        return text or None

    return LabelExtractionResponse(
        name=_str("name"),
        type=_normalize_wine_type(data.get("type")),
        producer=_str("producer"),
        vintage=vintage_int,
        country=_str("country"),
        district=_str("district"),
        subdistrict=_str("subdistrict"),
        grape_composition=grapes,
        notes=_str("notes"),
    )


async def extract_wine_from_label_image(
    *,
    image_bytes: bytes,
    content_type: str,
    config: XaiConfig,
) -> LabelExtractionResponse:
    if not config.api_key:
        raise LabelExtractionError(
            "XAI_API_KEY is not configured. Set it on the backend environment."
        )

    normalized_type = (content_type or "").split(";")[0].strip().lower()
    if normalized_type == "image/jpg":
        normalized_type = "image/jpeg"
    if normalized_type not in ALLOWED_CONTENT_TYPES:
        raise LabelExtractionError(
            f"Unsupported image type '{content_type}'. Use JPEG, PNG, or WebP."
        )
    if not image_bytes:
        raise LabelExtractionError("Empty image upload.")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise LabelExtractionError("Image is too large (max 12 MB).")

    data_url = f"data:{normalized_type};base64,{base64.b64encode(image_bytes).decode('ascii')}"
    payload = {
        "model": config.model,
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": data_url, "detail": "high"},
                    },
                    {"type": "text", "text": USER_PROMPT},
                ],
            },
        ],
    }

    url = f"{config.api_base}/chat/completions"
    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
    except httpx.TimeoutException as exc:
        raise LabelExtractionError("xAI request timed out.") from exc
    except httpx.HTTPError as exc:
        raise LabelExtractionError(f"xAI request failed: {exc}") from exc

    if response.status_code == 401:
        raise LabelExtractionError("xAI authentication failed. Check XAI_API_KEY.")
    if response.status_code == 429:
        raise LabelExtractionError("xAI rate limit exceeded. Try again shortly.")
    if response.status_code >= 400:
        detail = response.text[:500]
        raise LabelExtractionError(f"xAI error ({response.status_code}): {detail}")

    try:
        body = response.json()
        content = body["choices"][0]["message"]["content"]
        parsed = _parse_json_content(content)
    except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
        raise LabelExtractionError("Could not parse wine data from xAI response.") from exc

    return _to_response(parsed)
