import asyncio
from unittest.mock import patch

from app.core.config import VinmonopoletConfig
from app.services.vinmonopolet_service import (
    VinmonopoletLookupError,
    lookup_wine_code,
    map_lookup,
    parse_barcode_payload,
    parse_scan,
)


STORE = {
    "code": "21159501",
    "name": "La Dame de Montrose 2023",
    "main_category": {"name": "Rødvin"},
    "main_country": {"name": "Frankrike"},
    "district": {"name": "Bordeaux"},
    "sub_District": {"name": "St. Estèphe"},
    "main_producer": {"name": "Ch. Montrose"},
    "price": {"value": 499.9},
    "volume": {"formattedValue": "75 cl"},
    "alcohol": {"formattedValue": "13,5%"},
    "content": {
        "ingredients": [
            {"code": "067", "name": "Cabernet Franc", "formattedValue": "Cabernet Franc 2%", "type": "blue"},
            {"code": "068", "name": "Cabernet Sauvignon", "formattedValue": "Cabernet Sauvignon 32%", "type": "blue"},
            {"code": "211", "name": "Merlot", "formattedValue": "Merlot 61%", "type": "blue"},
            {"code": "264", "name": "Petit Verdot", "formattedValue": "Petit Verdot 2%", "type": "blue"},
        ]
    },
}


def test_parse_scan_accepts_url_ean_and_varenummer():
    assert parse_scan("https://www.vinmonopolet.no/Land/Frankrike/x/p/21159501") == ("product", "21159501")
    assert parse_scan("7310865004714") == ("ean", "7310865004714")
    assert parse_scan(" 1101 ") == ("product", "1101")
    assert parse_scan("21159501") == ("ambiguous", "21159501")


def test_parse_barcode_payload_reads_code_name_and_price():
    hit = parse_barcode_payload({"code": "123456", "name": "Testvin", "price": {"value": 199.5}})
    assert hit == {"code": "123456", "name": "Testvin", "price": 199.5}
    assert parse_barcode_payload({"errors": [{"type": "UnknownProductError"}]}) is None


def test_map_lookup_fills_the_cellar_fields():
    result = map_lookup("21159501", STORE, {"basic": {"productId": "21159501", "productShortName": "La Dame"}}, None)
    assert result.name == "La Dame de Montrose 2023"
    assert result.type == "Red"
    assert result.producer == "Ch. Montrose"
    assert result.vintage == 2023
    assert result.country == "Frankrike"
    assert result.district == "Bordeaux"
    assert result.subdistrict == "St. Estèphe"
    assert result.purchase_price == 499.9
    assert result.varenummer == "21159501"
    assert result.notes == "75 cl, 13,5%"
    grapes = result.grape_composition or []
    assert [g.grape_variety for g in grapes] == [
        "Cabernet Franc",
        "Cabernet Sauvignon",
        "Merlot",
        "Petit Verdot",
    ]
    assert abs(sum(g.percentage for g in grapes) - 100) <= 0.05


def test_map_lookup_skips_ingredient_lists_that_are_not_grapes():
    store = {
        "name": "Marolo Barolo Chinato",
        "main_category": {"name": "Aromatisert vin"},
        "content": {"ingredients": [{"code": "999", "formattedValue": "Druer, sukker, urter"}]},
    }
    result = map_lookup("13566801", store, None, None)
    assert result.type is None
    assert result.grape_composition is None
    assert result.vintage is None


def test_map_lookup_reads_food_pairings():
    store = {
        **STORE,
        "content": {
            **STORE["content"],
            "isGoodFor": [
                {"code": "B", "name": "Skalldyr"},
                {"code": "C", "name": "Fisk"},
                {"code": "R", "name": "Grønnsaker"},
            ],
        },
    }
    result = map_lookup("17134701", store, None, None)
    assert [(item.code, item.name) for item in result.food_pairings] == [
        ("B", "Skalldyr"),
        ("C", "Fisk"),
        ("R", "Grønnsaker"),
    ]


def test_official_grapes_are_used_when_present():
    official = {
        "basic": {"productShortName": "Kort navn", "vintage": "2019"},
        "classification": {"mainProductTypeName": "Hvitvin"},
        "origins": {"origin": {"country": "Tyskland", "region": "Mosel"}},
        "ingredients": {"grapes": [{"grapeDesc": "Riesling", "grapePct": "100"}]},
        "prices": [{"salesPrice": 189.9}],
    }
    result = map_lookup("981301", {"name": "Fritz Haag 2019"}, official, None)
    assert result.name == "Fritz Haag 2019"
    assert result.type == "White"
    assert result.vintage == 2019
    assert result.country == "Tyskland"
    assert result.purchase_price == 189.9
    assert result.grape_composition is not None
    assert result.grape_composition[0].grape_variety == "Riesling"
    assert result.grape_composition[0].percentage == 100


def _config() -> VinmonopoletConfig:
    return VinmonopoletConfig(
        api_key="secret",
        api_base="https://apis.vinmonopolet.no",
        store_base="https://www.vinmonopolet.no",
    )


class _Response:
    def __init__(self, status_code: int, payload: object = None) -> None:
        self.status_code = status_code
        self._payload = payload

    def json(self) -> object:
        return self._payload


def _route(handler):
    class _Client:
        def __init__(self, *args, **kwargs) -> None:
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc) -> bool:
            return False

        async def get(self, url, headers=None, params=None):
            return handler(url, headers or {}, params or {})

    return patch("app.services.vinmonopolet_service.httpx.AsyncClient", _Client)


def test_storefront_rejection_keeps_the_official_name():
    def handler(url, headers, params):
        if "apis.vinmonopolet.no" in url:
            assert headers["Ocp-Apim-Subscription-Key"] == "secret"
            return _Response(
                200,
                [{"basic": {"productId": "21159501", "productShortName": "La Dame de Montrose"}}],
            )
        assert "Ocp-Apim-Subscription-Key" not in headers
        return _Response(403)

    async def run():
        with _route(handler):
            return await lookup_wine_code("21159501", _config())

    result = asyncio.run(run())
    assert result.name == "La Dame de Montrose"
    assert result.varenummer == "21159501"


def test_official_rejection_still_names_the_key():
    def handler(url, headers, params):
        if "apis.vinmonopolet.no" in url:
            return _Response(401)
        return _Response(200, {"name": "Butikknavn"})

    async def run():
        with _route(handler):
            await lookup_wine_code("1101", _config())

    try:
        asyncio.run(run())
    except VinmonopoletLookupError as exc:
        assert exc.status == 503
        assert "nøkkelen" in str(exc)
    else:
        raise AssertionError("expected key rejection")


def test_barcode_rejection_is_not_a_key_error():
    def handler(url, headers, params):
        return _Response(403)

    async def run():
        with _route(handler):
            await lookup_wine_code("7310865004714", _config())

    try:
        asyncio.run(run())
    except VinmonopoletLookupError as exc:
        assert exc.status == 404
        assert "nøkkelen" not in str(exc)
    else:
        raise AssertionError("expected a missing barcode")


def test_storefront_outage_keeps_the_official_name():
    def handler(url, headers, params):
        if "apis.vinmonopolet.no" in url:
            return _Response(200, [{"basic": {"productShortName": "Offisielt navn"}}])
        return _Response(500)

    async def run():
        with _route(handler):
            return await lookup_wine_code("1101", _config())

    result = asyncio.run(run())
    assert result.name == "Offisielt navn"


def test_storefront_outage_is_reported_when_official_is_empty():
    def handler(url, headers, params):
        if "apis.vinmonopolet.no" in url:
            return _Response(404)
        return _Response(500)

    async def run():
        with _route(handler):
            await lookup_wine_code("1101", _config())

    try:
        asyncio.run(run())
    except VinmonopoletLookupError as exc:
        assert exc.status == 502
    else:
        raise AssertionError("expected the storefront error")


if __name__ == "__main__":
    test_parse_scan_accepts_url_ean_and_varenummer()
    test_parse_barcode_payload_reads_code_name_and_price()
    test_map_lookup_fills_the_cellar_fields()
    test_map_lookup_skips_ingredient_lists_that_are_not_grapes()
    test_map_lookup_reads_food_pairings()
    test_official_grapes_are_used_when_present()
    test_storefront_rejection_keeps_the_official_name()
    test_official_rejection_still_names_the_key()
    test_barcode_rejection_is_not_a_key_error()
    test_storefront_outage_keeps_the_official_name()
    test_storefront_outage_is_reported_when_official_is_empty()
    print("ok")
