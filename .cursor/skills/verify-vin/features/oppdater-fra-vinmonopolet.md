# Oppdater fra Vinmonopolet

An existing wine can take a product number, show the fetched fields, and keep them only after `Lagre`. Saving the same food codes again keeps the wine.

## Sub-features

- `refresh-needs-code` asks for a product number or barcode when the field is empty.
- `refresh-review-save` fills the wine and stores it when the person saves.
- `refresh-same-codes` saves the same food codes a second time.

## How to get to it (user POV)

- From Samling, choose `Åpne` on a wine.
- Open `$UI_BASE/wines/{id}` while signed in.

## Driving it with the browser

Preconditions:

- `vin-verify doctor` is ok.
- `vin-verify seed` has run. `Chablis` has no product number.
- The browser is signed in as `vin-verify`.
- The API process can reach Vinmonopolet and has `VINMONOPOLET_API_KEY`.

- **Open the wine.** Go to the Chablis detail page. The heading `Vinmonopolet` is visible.
- **Empty code.** Choose `Hent fra Vinmonopolet` with the field empty. The text `Skriv varenummeret eller strekkoden fra flasken.` is visible, and the heading stays `Chablis`.
- **Fetch.** Fill `Varenummer eller strekkode` with `21159501`. Choose `Hent fra Vinmonopolet`. The text `Feltene er fylt fra Vinmonopolet. Passer til Storfe, Storvilt, Svin. Se over og lagre.` is visible, and `Passer til` says `Ikke lagret ennå.`
- **Save.** Choose `Lagre` in the `Om` section. The heading becomes `La Dame de Montrose 2023`.
- **Save the same codes again.** Choose `Hent fra Vinmonopolet` once more, then `Lagre`. The heading stays `La Dame de Montrose 2023` and `Passer til` still lists `Storfe, Storvilt, Svin`.
- **Proof.** Save a snapshot and a screenshot after the second save to `$EVIDENCE_DIR/oppdater-fra-vinmonopolet/`.

## Gotchas

- The save that keeps the fetched fields is `Lagre` in the `Om` section.
- A wine name and producer are not enough for this fetch. The field needs a product number or a barcode.
