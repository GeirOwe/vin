# Drinking window

Drinking window groups the signed-in user's bottles into ready now, ending within 30 days, and not yet ready.

## Sub-features

- `window-ready` lists bottles whose window contains today.
- `window-approaching` lists bottles whose end date is today or within the next 30 days.
- `window-not-ready` lists bottles whose start date is still in the future.
- `window-empty-copy` shows the empty sentence for a tab that has no bottles.

## How to get to it (user POV)

- Choose `Drikkevindu` in the header.
- Choose `Drikkevindu` in the collection hero.
- Open `/drikkevindu` while signed in.

## Driving it with the Cursor IDE browser

Preconditions:

- Signed in as `verify`.
- Seeded windows are intact. Read `SEEDED_APPROACHING_BEFORE`, `SEEDED_NOT_READY_AFTER`, and `SEEDED_NOT_READY_BEFORE` from `vin-verify state --run "$RUN_ID"`.
- `Barolo Riserva` runs `2020-01-01` through `2030-12-31`.
- `Siste sjanse` runs `2020-01-01` through `SEEDED_APPROACHING_BEFORE`.
- `Ung Riesling` runs `SEEDED_NOT_READY_AFTER` through `SEEDED_NOT_READY_BEFORE`.

- **Open the page.** Click the header link named `Drikkevindu`. The URL is `$WEB_BASE/drikkevindu`, the level-1 heading reads `Drikkevindu`, and a tablist named `Filtre for drikkevindu` is visible.
- **Ready tab.** The tab `Klar til å drikke` is selected. The list contains `Åpne Barolo Riserva` and `Åpne Siste sjanse`. It does not contain `Åpne Ung Riesling`.
- **Approaching tab.** Click the tab named `Nærmer seg frist`. The list contains `Åpne Siste sjanse` and does not contain `Åpne Barolo Riserva` or `Åpne Ung Riesling`.
- **Not-ready tab.** Click the tab named `Ikke klar`. The list contains `Åpne Ung Riesling` and does not contain the other two.
- **Proof.** Save the not-ready snapshot as `artifacts/$RUN_ID/drikkevindu/results.aria.txt` and a screenshot as `artifacts/$RUN_ID/drikkevindu/results.png`. Both show `Vin · Owen Labs`, the heading `Drikkevindu`, the selected tab `Ikke klar`, and `Ung Riesling`.

## Gotchas

- `Siste sjanse` is in both `Klar til å drikke` and `Nærmer seg frist` because today sits inside its window and its end date is within 30 days. Do not treat the ready tab as exclusive.
- `Barolo Riserva` ends in 2030, so it is ready and not approaching.
- A bottle with quantity zero is excluded from every tab. If an earlier inventory proof drank `Siste sjanse` down to zero, this journey fails for that reason. Say so. Do not change the dates to force a pass.
- The page has no search box. `showSearchAndSort` is off here. Do not reuse the Samling search recipe on this URL.
- Empty copy, if a tab really has no rows, is `Ingen viner er klare til å drikke nå.`, `Ingen viner nærmer seg drikkefrist.`, or `Ingen viner er fortsatt under modning.` The seeded baseline does not hit those sentences.
