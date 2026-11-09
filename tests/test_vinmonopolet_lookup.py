from app.services.vinmonopolet_service import map_lookup, parse_barcode_payload, parse_scan


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


if __name__ == "__main__":
    test_parse_scan_accepts_url_ean_and_varenummer()
    test_parse_barcode_payload_reads_code_name_and_price()
    test_map_lookup_fills_the_cellar_fields()
    test_map_lookup_skips_ingredient_lists_that_are_not_grapes()
    test_official_grapes_are_used_when_present()
    print("ok")
