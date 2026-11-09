# Legg til vin

A person adds a bottle from the form, and that bottle shows up in the collection.

## Sub-features

- `add-required` creates a wine from name, type, producer, and quantity.
- `add-appears` shows the new wine on Samling.

## How to get to it (user POV)

- Choose `Legg til` in the header.
- Choose `Legg til vin` on the collection hero.
- Open `$UI_BASE/legg-til`.

## Driving it with the browser

Preconditions:

- `vin-verify doctor` is ok.
- The browser is signed in as `vin-verify`.
- Use a name that is not already seeded, such as `Verify Barolo`.

- **Open the form.** Go to `$UI_BASE/legg-til`. The headings `Vindetaljer` and `Pris og antall` are visible.
- **Fill the bottle.** Fill `Navn` with `Verify Barolo`, `Type` with `Red`, `Produsent` with `Gaja`, and `Antall` with `1`.
- **Save.** Choose `Opprett vin`. The text `Opprettet!` appears.
- **See it in the collection.** Go to `$UI_BASE/`. A button named `Åpne Verify Barolo` is visible.
- **Proof.** Save the `Opprettet!` snapshot and a screenshot to `$EVIDENCE_DIR/legg-til-vin/`. Save `GET $API_BASE/api/wines/page?search_term=Verify%20Barolo` as `api-page.json`. The item name is `Verify Barolo` and `quantity` is 1.

## Gotchas

- The details block does not send name, type, and producer until all three are non-empty. Wait for that before judging a failed save.
- `Type` must be the English value `Red`, `White`, `Rose`, `Sparkling`, `Dessert`, or `Fortified`. `Rød` fails create.
- The stored rosé type is the English word `Rose`. Typed `Rosé` fails create, the same way `Rød` does.
- `Antall` must be a whole number greater than 0, or the wine is stored and then hidden from Samling.
- The form does not navigate away after save.
