# Search the collection

Search lets a signed-in user narrow Samling by name or producer, filter by type, grape, or district, and clear those choices back to the full list.

## Sub-features

- `search-match` shows a name match and hides the other seeded wines.
- `search-producer` matches a producer that is not the wine's name.
- `search-empty` shows the empty state for a query with no matches.
- `search-filter-type` limits the list to one wine type.
- `search-clear` restores the seeded wines.

## How to get to it (user POV)

- Sign in and stay on Samling, which is the site root `/`.
- Choose `Samling` in the header from any other signed-in page.
- The search field is the textbox on that page. There is no separate search screen.

## Driving it with the Cursor IDE browser

Preconditions:

- Signed in as `verify` at `$WEB_BASE/`.
- The seeded wines are unchanged: `Barolo Riserva` (Gaja, Red, Piemonte, Nebbiolo), `Siste sjanse` (Clos des Papes, Red, Rhone, Grenache), and `Ung Riesling` (Dr. Loosen, White, Mosel, Riesling).
- `vin-verify doctor --run "$RUN_ID"` prints `doctor: worth driving`.

- **See the baseline.** On `/`, the heading `Din samling` is visible and the list contains buttons named `Åpne Barolo Riserva`, `Åpne Siste sjanse`, and `Åpne Ung Riesling`.
- **Match a name.** Fill the textbox named `Søk på navn eller produsent` with `riesling`. Snapshot again after the list updates. The only wine button is `Åpne Ung Riesling`. `Åpne Barolo Riserva` and `Åpne Siste sjanse` are gone.
- **Match a producer.** Replace the textbox value with `gaja`. The only wine button is `Åpne Barolo Riserva`.
- **Empty query.** Replace the textbox value with `volcano`. The list has no `Åpne` buttons and the text `Ingen viner funnet.` is visible.
- **Filter by type.** Click `Nullstill`, then choose `Rød` in the combobox named `Filtrer på type` (option value `Red`). The list contains `Åpne Barolo Riserva` and `Åpne Siste sjanse`, and does not contain `Åpne Ung Riesling`.
- **Clear.** Click the button named `Nullstill`. The search textbox is empty, `Filtrer på type` shows `Alle typer`, and all three seeded wine buttons are back.
- **Second view.** `GET $API_BASE/api/wines/page?search_term=riesling&page=1&page_size=20` with the `verify` bearer token returns `total_items` 1 and the name `Ung Riesling`. Save that summary, not the token, as `artifacts/$RUN_ID/sok-i-samlingen/api-page.json`.
- **Proof.** While the `riesling` result is on screen, save the accessibility snapshot as `artifacts/$RUN_ID/sok-i-samlingen/results.aria.txt` and a screenshot as `artifacts/$RUN_ID/sok-i-samlingen/results.png`. Both show `Vin · Owen Labs`, the query `riesling`, and `Ung Riesling`.

## Gotchas

- The search textbox has no `<label>`. Its accessible name is the placeholder `Søk på navn eller produsent`.
- Results update 300ms after the last change. A snapshot taken in the same turn as the fill still shows the previous list. Snapshot again and require the wine buttons to match the query.
- Search covers wine name and producer only. It does not search grape, district, or vintage. `nebbiolo` does not return `Barolo Riserva`. Use the combobox named `Filtrer på drue` for that, and the match is the full variety name (`Nebbiolo`, `Grenache`, `Riesling`).
- `Nullstill` also resets sort to `Navn` / `Stigende` and clears type, grape, and district. It is not a search-only clear.
- The sort control's accessible name includes the word `Sorter` plus the option labels. The order combobox's accessible name is its current option, `Stigende` or `Synkende`.
- Wines with quantity zero or null are already absent from Samling. A failed search proof is not the same as the Tomme page.
- Default sort is `Drikke før` ascending, so `Siste sjanse` is first before any search.
