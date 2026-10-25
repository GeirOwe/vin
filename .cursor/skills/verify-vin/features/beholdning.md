# Inventory and empty bottles

Inventory lets a signed-in user change how many bottles are left, see that change in the log, and find a finished wine on Tomme instead of Samling.

## Sub-features

- `stock-increase` adds one bottle and shows the new count on the detail page.
- `stock-persists` shows the same count after leaving and reopening the wine.
- `stock-log` records the change in the beholdningslogg.
- `stock-empty` moves a wine to Tomme when its quantity reaches zero.

## How to get to it (user POV)

- On Samling, choose the wine row (`Åpne` plus the wine name).
- On the detail page, use the controls under the heading `Beholdning`.
- Choose `Tomme` in the header, or open `/tomme`, to see wines with quantity zero.

## Driving it with the Cursor IDE browser

Preconditions:

- Signed in as `verify`.
- `Barolo Riserva` still has quantity 6. If it does not, this journey fails. Report the quantity you found.
- `vin-verify doctor` was worth driving before this mutation. After the quantity change, doctor no longer sees the original seeded list. Capture proof before relying on doctor again.

- **Open the wine.** On `/`, click the button named `Åpne Barolo Riserva`. The heading reads `Barolo Riserva` and `Beholdning` shows `6`.
- **Add one.** In that section, click the button named `+`, then the button named `Save`. The count becomes `7`. The log table shows a row whose new quantity is `7`.
- **Leave and return.** Click the link named `← Tilbake til samlingen`, then click `Åpne Barolo Riserva` again. `Beholdning` still shows `7`.
- **Second view.** `GET $API_BASE/api/wines/{id}` returns `quantity` 7. Save that field as `artifacts/$RUN_ID/beholdning/api-wine.json`.
- **Empty a different wine.** Open `Åpne Siste sjanse` (quantity 1). Click `-`, then `Save`. The count becomes `0`.
- **Samling hides it.** Click `Samling`. There is no button named `Åpne Siste sjanse`. `Åpne Barolo Riserva` is still there.
- **Tomme shows it.** Click the header link named `Tomme`. The heading reads `Tomme flasker` and `Åpne Siste sjanse` is in the list.
- **Proof.** Save the Tomme snapshot as `artifacts/$RUN_ID/beholdning/results.aria.txt` and a screenshot as `artifacts/$RUN_ID/beholdning/results.png`. Both show `Vin · Owen Labs`, `Tomme flasker`, and `Siste sjanse`.

## Gotchas

- The quantity stepper's save button is named `Save`, not `Lagre`. `Lagre` belongs to the edit forms for Om, Drikkevindu, Druer, and Vurdering.
- `+` and `-` only change the pending number. The stored quantity changes when `Save` is clicked. The `Save` button stays disabled until the pending number differs.
- The number input in that row has no accessible name. Prefer `+` and `-` over typing into it.
- `Drikk flaske` under the same section subtracts one immediately and does not use `Save`. This recipe uses the stepper so the log row is unambiguous.
- Samling and the drinking-window tabs omit quantity zero. Tomme is the page that lists them. Its empty sentence, when nothing is empty, is `Ingen tomme viner. Alle viner i samlingen har antall over null.`
- Zeroing `Siste sjanse` removes it from the ready and approaching tabs. A later drinking-window proof in the same run must account for that, or the run must launch a fresh instance.
