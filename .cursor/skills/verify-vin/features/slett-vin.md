# Slett vin

A person can delete a wine from its page. Bottles still in stock do not block the delete. The confirm names how many bottles go with it.

## Sub-features

- `delete-confirm` shows the wine name and the bottle count.
- `delete-removes` returns to Samling without that wine.

## How to get to it (user POV)

- From Samling, choose `Åpne` on a wine.
- Open `$UI_BASE/wines/{id}` while signed in.

## Driving it with the browser

Preconditions:

- `vin-verify doctor` is ok.
- The browser is signed in as `vin-verify`.
- `legg-til-vin` has created `Verify Barolo` with quantity 1. Do not delete a seeded wine if a later journey still needs it.

- **Open the wine.** Choose `Åpne Verify Barolo`.
- **Ask.** Choose `Slett vin`. The text `Slette Verify Barolo? 1 flaske slettes med vinen.` is visible.
- **Confirm.** Choose `Slett`. The browser returns to `$UI_BASE/`. `Åpne Verify Barolo` is absent.
- **Proof.** Save a snapshot and a screenshot of Samling after the delete to `$EVIDENCE_DIR/slett-vin/`.

## Gotchas

- Quantity greater than 1 uses the same button. The confirm then says `{n} flasker slettes med vinen.`
- `Avbryt` leaves the wine in place.
