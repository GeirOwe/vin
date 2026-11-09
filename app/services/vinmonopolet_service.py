"""Look up a Vinmonopolet bottle from a scanned QR code, barcode, or varenummer.

The subscription key is sent only to apis.vinmonopolet.no. The storefront
product call has no key. A storefront 401 or 403 is a missing store payload,
and the official response is still returned. Only the official host can
reject the key. The official details feed currently returns the product id
and short name. Grapes, place, producer, and price come from the storefront
product when the official payload does not include them.
"""

from __future__ import annotations

import re
from typing import Any

import httpx

from ..core.config import VinmonopoletConfig
from ..schemas import BarcodeLookupResponse, FoodPairing, LabelGrapeComposition, WineType

FOOD_PAIRING_CHOICES = (
    ("A", "Aperitif"),
    ("B", "Skalldyr"),
    ("C", "Fisk"),
    ("R", "Grønnsaker"),
    ("D", "Lyst kjøtt"),
    ("Q", "Svin"),
    ("E", "Storfe"),
    ("F", "Lam"),
    ("G", "Småvilt"),
    ("H", "Storvilt"),
    ("L", "Ost"),
    ("N", "Dessert"),
)

_PRODUCT_PATH = re.compile(r"/p/(\d{2,12})(?:\D|$)")
_YEAR_AT_END = re.compile(r"(?:^|\s)((?:19|20)\d{2})$")
_PERCENT = re.compile(r"(\d+(?:[.,]\d+)?)\s*(?:%|prosent)\b", re.IGNORECASE)
_USER_AGENT = "vin-cellar/1.0"


class VinmonopoletLookupError(Exception):
    def __init__(self, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.status = status


def parse_scan(raw: str) -> tuple[str, str]:
    """Return (kind, value). kind is ean, product, or ambiguous."""
    text = (raw or "").strip()
    if not text:
        raise VinmonopoletLookupError("Lim inn eller skann en kode.")

    match = _PRODUCT_PATH.search(text)
    if match:
        return "product", match.group(1)

    compact = re.sub(r"[\s-]", "", text)
    if compact.isdigit():
        return _classify_digits(compact)

    digits = re.sub(r"\D", "", text)
    if len(digits) >= 8:
        return _classify_digits(digits)

    raise VinmonopoletLookupError(
        "Kjenner ikke koden. Skann strekkoden, QR-koden, eller lim inn varenummeret."
    )


def _classify_digits(digits: str) -> tuple[str, str]:
    length = len(digits)
    if length in (12, 13, 14):
        return "ean", digits
    if length == 8:
        return "ambiguous", digits
    if 2 <= length <= 11:
        return "product", digits
    raise VinmonopoletLookupError(
        "Kjenner ikke koden. Skann strekkoden, QR-koden, eller lim inn varenummeret."
    )


def map_lookup(
    product_id: str,
    store: dict[str, Any] | None,
    official: dict[str, Any] | None,
    barcode_hit: dict[str, Any] | None,
) -> BarcodeLookupResponse:
    store = store or {}
    official = official or {}
    barcode_hit = barcode_hit or {}
    basic = official.get("basic") if isinstance(official.get("basic"), dict) else {}
    origins = _origin(official)
    classification = official.get("classification") if isinstance(official.get("classification"), dict) else {}

    name = _first_text(
        store.get("name"),
        basic.get("productLongName"),
        basic.get("productShortName"),
        barcode_hit.get("name"),
    )
    if not name:
        raise VinmonopoletLookupError("Fant ikke denne koden hos Vinmonopolet.", 404)

    vintage = _vintage(basic.get("vintage")) or _vintage_from_name(name)
    category = _first_text(
        _named(store.get("main_category")),
        classification.get("mainProductTypeName"),
        classification.get("subProductTypeName"),
    )
    producer = _first_text(
        _named(store.get("main_producer")),
        official.get("manufacturerName"),
    )
    country = _first_text(_named(store.get("main_country")), origins.get("country"))
    district = _first_text(_named(store.get("district")), origins.get("region"))
    subdistrict = _first_text(
        _named(store.get("sub_District")),
        _named(store.get("subDistrict")),
        origins.get("subRegion"),
    )
    price = _store_price(store) or _official_price(official) or _as_price(barcode_hit.get("price"))
    grapes = _grapes_from_official(official) or _grapes_from_store(store)
    notes = _notes(store)
    foods = food_pairings_from_store(store)

    return BarcodeLookupResponse(
        name=name[:255],
        type=_wine_type(category),
        producer=producer[:255] if producer else None,
        vintage=vintage,
        country=_clip(country, 100),
        district=_clip(district, 100),
        subdistrict=_clip(subdistrict, 100),
        grape_composition=grapes,
        purchase_price=price,
        varenummer=str(product_id),
        notes=notes,
        food_pairings=foods,
    )


async def lookup_wine_code(raw: str, config: VinmonopoletConfig) -> BarcodeLookupResponse:
    if not config.api_key:
        raise VinmonopoletLookupError("VINMONOPOLET_API_KEY er ikke satt.", 503)

    kind, value = parse_scan(raw)
    barcode_hit: dict[str, Any] | None = None
    store_try: dict[str, Any] | None = None
    if kind == "ean":
        barcode_hit = await _barcode_search(value, config)
        product_id = barcode_hit.get("code") if barcode_hit else None
        if not product_id:
            raise VinmonopoletLookupError("Fant ikke denne strekkoden hos Vinmonopolet.", 404)
    elif kind == "ambiguous":
        store_try = await _store_product(value, config)
        if store_try and store_try.get("name"):
            product_id = value
        else:
            barcode_hit = await _barcode_search(value, config)
            product_id = barcode_hit.get("code") if barcode_hit else None
            if not product_id:
                product_id = value
    else:
        product_id = value

    official = await _official_product(str(product_id), config)
    try:
        store = await _store_product(str(product_id), config)
    except VinmonopoletLookupError:
        if not official and not store_try:
            raise
        store = None
    if store is None:
        store = store_try
    return map_lookup(str(product_id), store, official, barcode_hit)


def food_pairings_from_store(store: dict[str, Any] | None) -> list[FoodPairing]:
    """Read Passer til from the storefront product. The official API does not send it."""
    if not isinstance(store, dict):
        return []
    content = store.get("content") if isinstance(store.get("content"), dict) else {}
    items = content.get("isGoodFor")
    if not isinstance(items, list):
        return []
    found: list[FoodPairing] = []
    seen: set[str] = set()
    for item in items:
        if not isinstance(item, dict):
            continue
        code = str(item.get("code") or "").strip()
        name = str(item.get("name") or "").strip()
        if not code or not name or code in seen:
            continue
        seen.add(code)
        found.append(FoodPairing(code=code[:8], name=name[:80]))
    return found


async def fetch_food_pairings(product_id: str, config: VinmonopoletConfig) -> list[FoodPairing]:
    store = await _store_product(product_id, config)
    if not store:
        raise VinmonopoletLookupError("Fant ikke matparing hos Vinmonopolet.", 404)
    return food_pairings_from_store(store)


def _wine_type(category: str | None) -> WineType | None:
    if not category:
        return None
    name = category.casefold()
    if any(word in name for word in ("musserende", "champagne", "perlende", "cava", "prosecco")):
        return WineType.Sparkling
    if "rosé" in name or "rosevin" in name or name.strip() == "rose":
        return WineType.Rose
    if any(word in name for word in ("hetvin", "sterkvin", "portvin", "sherry", "madeira", "vermut")):
        return WineType.Fortified
    if "dessert" in name or "søtvin" in name:
        return WineType.Dessert
    if "hvit" in name:
        return WineType.White
    if "rød" in name or "rodvin" in name:
        return WineType.Red
    return None


def _grapes_from_store(store: dict[str, Any]) -> list[LabelGrapeComposition] | None:
    content = store.get("content") if isinstance(store.get("content"), dict) else {}
    ingredients = content.get("ingredients")
    if not isinstance(ingredients, list):
        return None
    named: list[tuple[str, float | None]] = []
    for item in ingredients:
        if not isinstance(item, dict):
            continue
        if str(item.get("code") or "") == "999":
            continue
        grape = _first_text(item.get("name"))
        if not grape or len(grape) > 80 or "," in grape:
            continue
        text = " ".join(
            part for part in (item.get("formattedValue"), item.get("readableValue")) if isinstance(part, str)
        )
        percent = _percent_in(text)
        grape_type = str(item.get("type") or "").casefold()
        if percent is None and grape_type not in {"blue", "white", "green", "red"}:
            continue
        named.append((grape, percent))
    return _finish_grapes(named)


def _grapes_from_official(official: dict[str, Any]) -> list[LabelGrapeComposition] | None:
    ingredients = official.get("ingredients") if isinstance(official.get("ingredients"), dict) else {}
    grapes = ingredients.get("grapes")
    if not isinstance(grapes, list):
        return None
    named: list[tuple[str, float | None]] = []
    for item in grapes:
        if not isinstance(item, dict):
            continue
        grape = _first_text(item.get("grapeDesc"), item.get("name"))
        if not grape:
            continue
        percent = _percent_in(str(item.get("grapePct") or ""))
        if percent is None:
            percent = _as_percent(item.get("grapePct"))
        named.append((grape, percent))
    return _finish_grapes(named)


def _finish_grapes(named: list[tuple[str, float | None]]) -> list[LabelGrapeComposition] | None:
    merged: list[tuple[str, float | None]] = []
    index: dict[str, int] = {}
    for grape, percent in named:
        key = grape.casefold()
        if key in index:
            pos = index[key]
            previous_name, previous_percent = merged[pos]
            if previous_percent is None or percent is None:
                merged[pos] = (previous_name, None)
            else:
                merged[pos] = (previous_name, previous_percent + percent)
            continue
        index[key] = len(merged)
        merged.append((grape, percent))

    if not merged:
        return None
    if any(percent is None for _, percent in merged):
        shares = _equal_shares(len(merged))
        pairs = [(grape, share) for (grape, _), share in zip(merged, shares)]
    else:
        pairs = [(grape, float(percent)) for grape, percent in merged]
        pairs = _scale_to_100(pairs)
    return [
        LabelGrapeComposition(grape_variety=grape[:100], percentage=percent)
        for grape, percent in pairs
        if percent >= 0
    ] or None


def _equal_shares(count: int) -> list[float]:
    if count <= 0:
        return []
    base = int(1000 / count) / 10
    shares = [base] * (count - 1)
    last = round(100 - base * (count - 1), 1)
    shares.append(last)
    return shares


def _scale_to_100(pairs: list[tuple[str, float]]) -> list[tuple[str, float]]:
    total = sum(percent for _, percent in pairs)
    if total <= 0:
        shares = _equal_shares(len(pairs))
        return [(grape, share) for (grape, _), share in zip(pairs, shares)]
    if abs(total - 100) <= 0.5:
        scaled = [round(percent, 1) for _, percent in pairs]
    else:
        scaled = [round(percent * 100 / total, 1) for _, percent in pairs]
    if len(scaled) == 1:
        scaled[0] = 100.0
    else:
        scaled[-1] = round(100 - sum(scaled[:-1]), 1)
    if scaled[-1] < 0:
        scaled[scaled.index(max(scaled[:-1]))] = round(max(scaled[:-1]) + scaled[-1], 1)
        scaled[-1] = 0.0
    return [(grape, percent) for (grape, _), percent in zip(pairs, scaled)]


def _notes(store: dict[str, Any]) -> str | None:
    bits: list[str] = []
    volume = store.get("volume")
    if isinstance(volume, dict) and isinstance(volume.get("formattedValue"), str):
        bits.append(volume["formattedValue"])
    alcohol = store.get("alcohol")
    if isinstance(alcohol, dict) and isinstance(alcohol.get("formattedValue"), str):
        bits.append(alcohol["formattedValue"])
    if not bits:
        return None
    return ", ".join(bits)


def _origin(official: dict[str, Any]) -> dict[str, Any]:
    origins = official.get("origins")
    if not isinstance(origins, dict):
        return {}
    origin = origins.get("origin")
    return origin if isinstance(origin, dict) else {}


def _store_price(store: dict[str, Any]) -> float | None:
    price = store.get("price")
    if isinstance(price, dict):
        return _as_price(price.get("value"))
    return _as_price(price)


def _official_price(official: dict[str, Any]) -> float | None:
    prices = official.get("prices")
    if not isinstance(prices, list):
        return None
    for item in prices:
        if isinstance(item, dict):
            value = _as_price(item.get("salesPrice"))
            if value is not None:
                return value
    return None


def _percent_in(text: str) -> float | None:
    match = _PERCENT.search(text or "")
    if not match:
        return None
    return _as_percent(match.group(1))


def _as_percent(value: Any) -> float | None:
    number = _as_float(value)
    if number is None or number < 0 or number > 100:
        return None
    return number


def _as_price(value: Any) -> float | None:
    number = _as_float(value)
    if number is None or number < 0:
        return None
    return round(number, 2)


def _as_float(value: Any) -> float | None:
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value) if value == value else None
    if isinstance(value, str):
        cleaned = value.strip().replace(",", ".")
        if not cleaned:
            return None
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def _vintage(value: Any) -> int | None:
    if value is None or isinstance(value, bool):
        return None
    text = str(value).strip()
    if not re.fullmatch(r"(19|20)\d{2}", text):
        return None
    year = int(text)
    if 1800 <= year <= 2100:
        return year
    return None


def _vintage_from_name(name: str) -> int | None:
    match = _YEAR_AT_END.search(name.strip())
    if not match:
        return None
    return int(match.group(1))


def _named(value: Any) -> str | None:
    if isinstance(value, dict):
        return _first_text(value.get("name"))
    return None


def _first_text(*values: Any) -> str | None:
    for value in values:
        if isinstance(value, str):
            cleaned = value.strip()
            if cleaned:
                return cleaned
    return None


def _clip(value: str | None, limit: int) -> str | None:
    if not value:
        return None
    return value[:limit]


def parse_barcode_payload(payload: Any) -> dict[str, Any] | None:
    if isinstance(payload, list):
        payload = payload[0] if payload else None
    if not isinstance(payload, dict) or payload.get("errors"):
        return None
    product = payload.get("product") if isinstance(payload.get("product"), dict) else {}
    code = payload.get("code") or payload.get("productId") or product.get("code") or product.get("productId")
    if not code:
        return None
    name = _first_text(payload.get("name"), payload.get("productShortName"), product.get("name"))
    price = _store_price(payload) or _as_price(payload.get("salesPrice")) or _store_price(product)
    return {"code": str(code), "name": name, "price": price}


async def _barcode_search(ean: str, config: VinmonopoletConfig) -> dict[str, Any] | None:
    url = f"{config.store_base}/vmpws/v2/vmp/products/barCodeSearch/{ean}"
    payload = await _get_json(url, headers=_store_headers(), key_required=False)
    if payload is None:
        return None
    return parse_barcode_payload(payload)


async def _store_product(product_id: str, config: VinmonopoletConfig) -> dict[str, Any] | None:
    url = f"{config.store_base}/vmpws/v3/vmp/products/{product_id}"
    payload = await _get_json(
        url,
        headers=_store_headers(),
        params={"fields": "FULL"},
        key_required=False,
    )
    if not isinstance(payload, dict) or payload.get("errors"):
        return None
    return payload


async def _official_product(product_id: str, config: VinmonopoletConfig) -> dict[str, Any] | None:
    url = f"{config.api_base}/products/v0/details-normal"
    headers = {
        "Ocp-Apim-Subscription-Key": config.api_key or "",
        "Cache-Control": "no-cache",
        "Accept": "application/json",
        "User-Agent": _USER_AGENT,
    }
    payload = await _get_json(
        url,
        headers=headers,
        params={"productId": product_id},
        key_required=True,
    )
    if isinstance(payload, list):
        for item in payload:
            if isinstance(item, dict):
                return item
        return None
    if isinstance(payload, dict) and not payload.get("errors"):
        return payload
    return None


def _store_headers() -> dict[str, str]:
    return {"Accept": "application/json", "User-Agent": _USER_AGENT}


async def _get_json(
    url: str,
    *,
    headers: dict[str, str],
    params: dict[str, str] | None = None,
    key_required: bool = False,
) -> Any:
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers, params=params)
    except httpx.TimeoutException as exc:
        raise VinmonopoletLookupError("Vinmonopolet svarte ikke. Prøv igjen.", 502) from exc
    except httpx.HTTPError as exc:
        raise VinmonopoletLookupError("Fikk ikke kontakt med Vinmonopolet.", 502) from exc

    if response.status_code in (401, 403):
        if key_required:
            raise VinmonopoletLookupError("Vinmonopolet avslo nøkkelen.", 503)
        return None
    if response.status_code == 404:
        return None
    if response.status_code == 429:
        raise VinmonopoletLookupError("Vinmonopolet begrenset oppslaget. Prøv igjen om litt.", 502)
    if response.status_code >= 500:
        raise VinmonopoletLookupError("Vinmonopolet svarte med en feil. Prøv igjen.", 502)
    if response.status_code >= 400:
        return None
    try:
        return response.json()
    except ValueError:
        return None
