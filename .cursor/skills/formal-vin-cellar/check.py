import json
import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
db_dir = tempfile.mkdtemp(prefix="vin-formal-")
os.environ["DATABASE_URL"] = f"sqlite:///{db_dir}/vin.db"
os.chdir(ROOT)
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from app.main import app


def register(client, bruker_id):
    response = client.post(
        "/api/auth/register",
        json={
            "bruker_id": bruker_id,
            "password": "VerifyVin1",
            "password_confirm": "VerifyVin1",
        },
    )
    if response.status_code != 201:
        raise SystemExit(f"register {bruker_id} failed: {response.status_code} {response.text}")
    return response.json()["access_token"]


def create_wine(client, token, name, quantity):
    body = {"name": name, "type": "Red", "producer": "Check"}
    if quantity is not None:
        body["quantity"] = quantity
    response = client.post(
        "/api/wines",
        headers={"Authorization": f"Bearer {token}"},
        json=body,
    )
    if response.status_code != 201:
        raise SystemExit(f"create {name} failed: {response.status_code} {response.text}")


def page(client, token, search_term=None):
    params = {}
    if search_term:
        params["search_term"] = search_term
    response = client.get(
        "/api/wines/page",
        headers={"Authorization": f"Bearer {token}"},
        params=params,
    )
    if response.status_code != 200:
        raise SystemExit(f"page failed: {response.status_code} {response.text}")
    return response.json()


def in_stock(quantity):
    return quantity is not None and quantity > 0


failures = []
row_leaks = []

with TestClient(app) as client:
    quantities = (None, 0, 1, 3)
    for index, (qty_a, qty_b) in enumerate((a, b) for a in quantities for b in quantities):
        user_a = f"vera{index:02d}"
        user_b = f"verb{index:02d}"
        token_a = register(client, user_a)
        token_b = register(client, user_b)
        name_a = f"Alpha{index:02d}"
        name_b = f"Beta{index:02d}"
        create_wine(client, token_a, name_a, qty_a)
        create_wine(client, token_b, name_b, qty_b)
        body = page(client, token_a)
        names = [item["name"] for item in body["items"]]
        expected = 1 if in_stock(qty_a) else 0
        if name_b in names:
            row_leaks.append(
                f"{user_a} received {name_b}, which belongs to {user_b}"
            )
        if body["total_items"] != expected or len(names) != expected:
            failures.append(
                {
                    "steps": [
                        f"{user_a} creates {name_a} with quantity {qty_a}.",
                        f"{user_b} creates {name_b} with quantity {qty_b}.",
                        f"{user_a} opens Samling, GET /api/wines/page.",
                        f"The rows are {names or 'none'}.",
                        f"total_items is {body['total_items']}. The caller's matching stock is {expected}.",
                    ]
                }
            )

    token_a = register(client, "verasearch")
    token_b = register(client, "verbsearch")
    create_wine(client, token_a, "Alphaquartz", 1)
    create_wine(client, token_a, "Betachalk", 1)
    create_wine(client, token_b, "Alphaquartz Neighbour", 1)
    body = page(client, token_a, "Alphaquartz")
    names = [item["name"] for item in body["items"]]
    if "Alphaquartz Neighbour" in names:
        row_leaks.append("verasearch search returned Alphaquartz Neighbour")
    if body["total_items"] != 1 or names != ["Alphaquartz"]:
        failures.append(
            {
                "steps": [
                    "verasearch creates Alphaquartz and Betachalk, both with quantity 1.",
                    "verbsearch creates Alphaquartz Neighbour with quantity 1.",
                    "verasearch searches Samling for Alphaquartz.",
                    f"The rows are {names}.",
                    f"total_items is {body['total_items']}. The caller's matches are 1.",
                ]
            }
        )

if row_leaks:
    print("property row_owner: fail")
    for leak in row_leaks:
        print(leak)
    print("A row from another cellar appeared in the signed-in user's page.")
    sys.exit(2)

print("property row_owner: pass")
if failures:
    print("property page_total: fail")
    print("known finding: list_wines_page counts wines without Wine.user_id.")
    print("counterexample:")
    for line in failures[0]["steps"]:
        print(line)
    print(f"cases_failed: {len(failures)}")
    sys.exit(1)

print("property page_total: pass")
print(json.dumps({"database": os.environ["DATABASE_URL"], "cases": "quantities none,0,1,3 for two users, plus one search"}))
