# Matparing

Samling can show the wines that match one food, and it can ask Vinmonopolet for pairings on wines that already have a product number.

## Sub-features

- `food-empty` shows the empty sentence when no in-stock wine has that food.
- `food-match` shows only the wine that has the selected food.
- `food-fetch` reports how many wines were updated, failed, or skipped because they have no product number.

## How to get to it (user POV)

- Choose `Samling` in the header.
- Open `$UI_BASE/` while signed in.

## Driving it with the browser

Preconditions:

- `vin-verify doctor` is ok.
- `vin-verify seed` has run.
- The browser is signed in as `vin-verify`.

- **Empty food.** The group is labelled `Passer til`. Choose `Storvilt` before any wine has that pairing. The text `Ingen viner passer til Storvilt.` is visible. `Åpne Barolo Riserva` and `Åpne Chablis` are absent.
- **Fetch with no product numbers.** Choose `Vin som passer`. The text `Oppdaterte 0 viner. 0 feilet. 2 uten varenummer.` is visible when only the two seeded wines exist.
- **Match.** After `oppdater-fra-vinmonopolet` has stored Storvilt on one wine, choose `Storvilt` again. That wine's `Åpne` button is visible. The other wines are not.
- **Restore.** Choose `Alle`. The full in-stock list returns.
- **Proof.** Save a snapshot and a screenshot of the empty `Storvilt` result to `$EVIDENCE_DIR/matparing/`.

## Gotchas

- Seeded wines have no product number, so `Vin som passer` skips them and does not call Vinmonopolet for them.
- `Nullstill` also clears the food tab.
- The search journey's empty sentence `Ingen viner funnet.` appears only while `Alle` is pressed.
