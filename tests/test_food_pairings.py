"""Saving the same food codes again must not hit the unique constraint."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.endpoints.wines import replace_food_pairings
from app.database import Base
from app.models import User, Wine, WineFoodPairing
from app.schemas import FoodPairing


def test_replace_keeps_existing_codes_and_adds_new_ones():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    user = User(bruker_id="food-test", password_hash="x")
    wine = Wine(name="Chablis", user_id=0, owner=user)
    wine.food_pairings.append(WineFoodPairing(code="E", name="Storfe"))
    wine.food_pairings.append(WineFoodPairing(code="H", name="Storvilt"))
    db.add(wine)
    db.commit()

    replace_food_pairings(
        wine,
        [
            FoodPairing(code="E", name="Storfe og kalv"),
            FoodPairing(code="H", name="Storvilt"),
            FoodPairing(code="Q", name="Svin"),
        ],
    )
    db.commit()
    db.refresh(wine)
    assert [(row.code, row.name) for row in wine.food_pairings] == [
        ("E", "Storfe og kalv"),
        ("H", "Storvilt"),
        ("Q", "Svin"),
    ]

    replace_food_pairings(wine, [FoodPairing(code="Q", name="Svin")])
    db.commit()
    db.refresh(wine)
    assert [(row.code, row.name) for row in wine.food_pairings] == [("Q", "Svin")]
    db.close()


if __name__ == "__main__":
    test_replace_keeps_existing_codes_and_adds_new_ones()
    print("ok")
