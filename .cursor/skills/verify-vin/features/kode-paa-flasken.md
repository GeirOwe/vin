# Kode på flasken

On the add form, a typed product number fills the wine fields from Vinmonopolet. The camera button is on the same form. This harness types the code.

## Sub-features

- `code-fills-form` writes the product fields into the add form.
- `code-leaves-quantity` leaves `Antall` for the person to type.

## How to get to it (user POV)

- Choose `Legg til` in the header.
- Open `$UI_BASE/legg-til`.

## Driving it with the browser

Preconditions:

- `vin-verify doctor` is ok.
- The browser is signed in as `vin-verify`.
- The API process can reach Vinmonopolet and has `VINMONOPOLET_API_KEY`.

- **Open the form.** Go to `$UI_BASE/legg-til`. The heading `Skann kode` is visible.
- **Type the code.** Fill `Kode på flasken` with `21159501`. Choose `Hent fra Vinmonopolet`.
- **See the fields.** `Navn` becomes `La Dame de Montrose 2023`, `Type` becomes `Red`, and the text `Passer til Storfe, Storvilt, Svin` is visible.
- **Quantity stays open.** `Antall` is still empty. Set it to `1` before `Opprett vin`, or Samling hides the new row. Saving is the `legg-til-vin` journey.
- **Proof.** Save a snapshot and a screenshot of the filled form to `$EVIDENCE_DIR/kode-paa-flasken/`.

## Gotchas

- Do not open `Ta bilde av koden` in this harness. The isolated browser has no camera. Typing the code is the path this file drives.
- A name, producer, and vintage already on the form are not enough to find the bottle. The field needs a product number, a barcode, or a Vinmonopolet URL.
