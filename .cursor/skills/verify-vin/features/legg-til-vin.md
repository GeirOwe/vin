# Add a wine

Add a wine lets a signed-in user save a bottle from the form and find it afterwards in the collection.

## Sub-features

- `add-open` opens the empty form from each entry point.
- `add-save` stores a name, English type enum, producer, and a quantity above zero.
- `add-visible` shows the new wine on Samling and on its detail page.
- `add-invalid` keeps the user on the form when the payload is not valid.

## How to get to it (user POV)

- Choose `Legg til` in the header.
- Choose `Legg til vin` on the collection hero.
- Open `/legg-til` directly while signed in. Signed-out visitors are redirected to `/innlogging`.

## Driving it with the Cursor IDE browser

Preconditions:

- Signed in as `verify` at `$WEB_BASE/`.
- No wine is named `Verifiseringsvin`.
- `vin-verify doctor` was worth driving at the start of the run. Doctor will fail after this mutation because the wine list is no longer exactly the three seeded names. That is expected. Do not "fix" it by deleting the new wine before capturing proof.

- **Open the form.** Click the link named `Legg til vin`. The URL is `$WEB_BASE/legg-til` and a heading reads `Vindetaljer`.
- **Enter the wine.** Fill the textbox named `Navn` with `Verifiseringsvin`, the textbox named `Type` with `Red`, the textbox named `Produsent` with `Owen Labs`, and the textbox named `Antall` with `2`. Leave grape rows empty.
- **Wait for the form to commit.** Snapshot again after the inputs show those values. The parent payload updates 150ms after the last valid edit, and only once name, type, and producer are all non-empty. Then click the button named `Opprett vin`.
- **See the success state.** The button returns from `Lagrer…` to `Opprett vin` and the text `Opprettet!` appears. Stay on `/legg-til`.
- **Find it in the collection.** Click the link named `Samling`. A button named `Åpne Verifiseringsvin` is in the list and shows `2 flasker`.
- **Open the detail.** Click `Åpne Verifiseringsvin`. The URL matches `/wines/` plus an id, the level-1 heading reads `Verifiseringsvin`, and `Beholdning` shows `2`.
- **Confirm the stored row.** `GET $API_BASE/api/wines/{id}` with the `verify` bearer token returns `name` `Verifiseringsvin`, `type` `Red`, `producer` `Owen Labs`, and `quantity` `2`. Save those fields, not the token, under `artifacts/$RUN_ID/legg-til-vin/api-wine.json`.
- **Proof.** Save the collection snapshot as `artifacts/$RUN_ID/legg-til-vin/results.aria.txt` and a screenshot as `artifacts/$RUN_ID/legg-til-vin/results.png`. Both show `Vin · Owen Labs` and `Verifiseringsvin`.

## Gotchas

- `Type` is a free-text field, but the API accepts only `Red`, `White`, `Rose`, `Sparkling`, `Dessert`, or `Fortified`. The placeholder `f.eks. Rød, Hvit, Rosé` is not a legal value. `Rød` fails the request.
- Quantity is optional in the schema and required for the collection. The Samling list hides wines whose quantity is null or zero. `Antall` rejects `0`. Use `2`.
- Clicking `Opprett vin` before the 150ms debounce sends an empty or partial payload. The inputs still look filled. Wait, then click once. `Opprettet!` alone is not proof. Reopen the wine from Samling.
- Do not click `Ta bilde`, `Last opp bilde`, or `Fyll skjema fra etikett`. The last one calls the external label API.
- If you add a grape, its percentages must sum to 100. Leaving the grape section empty is the path this recipe uses.
- `Opprett vin` does not navigate away. The collection is a separate step.
