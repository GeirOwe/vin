---
name: formal-vin-cellar
description: "Check that Samling's page total counts only the signed-in user's wines. Use when a change touches list_wines_page, apply_filters, or the collection search results."
---

# Cellar page total

The page total on Samling counts only the signed-in user's wines that match the same filters as the rows. A wrong total lets another person's cellar change the number you see, and a search can report more hits than the rows on the page.

The check calls the real FastAPI handlers through `TestClient` against a temporary sqlite file. It does not model the function in another language. No model checker is installed, and the question is what `list_wines_page` returns for each quantity and search, not the order of events. A bounded generator is enough and needs no extra package.

## When a change touches this

Read the diff. Run the check when it edits any of these:

- `list_wines_page` in `app/api/endpoints/wines.py`
- `apply_filters` in the same file
- `Wine.user_id` on the `Wine` model in `app/models.py`

Ignore the check for a UI-only change that does not call `GET /api/wines/page`.

## Run

From the repo root, with `.venv` on `PATH` or invoked directly:

```bash
.venv/bin/python .cursor/skills/formal-vin-cellar/check.py
```

The script sets `DATABASE_URL` to a fresh temp sqlite file before it imports the app. It never opens `vin.db`.

Exit codes:

- `0` means both properties passed.
- `1` means `page_total` failed and `row_owner` passed. That is the known finding below, until a change fixes the count. Do not treat a new counterexample shape as the same finding. Read the printed steps.
- `2` means a row from another user appeared in `items`. That is a new bug. Do not explain it away as the known count finding.

The generator covers two users and quantities `null`, `0`, `1`, and `3`, then one search where both users have a name containing `Alphaquartz`. Expected stock is quantity greater than 0. Expected search hits are the caller's wines whose name matches.

## Known finding

`page_total` fails on the current code. `list_wines_page` builds `count_stmt` with `select(func.count(Wine.id))` and `apply_filters`. That statement never adds `Wine.user_id == current_user.id`. The rows in `items` do, because `base_stmt` has that filter.

Counterexample, from the first failing case the check prints:

1. `vera02` creates `Alpha02` with quantity empty.
2. `verb02` creates `Beta02` with quantity 1.
3. `vera02` opens Samling.
4. The row list is empty, because `vera02` has no bottle in stock.
5. `total_items` is 1, because the count includes `verb02`'s bottle.

The same run fails 15 cases. One of them is the search. `verasearch` searches for `Alphaquartz` and sees only that row, while `total_items` also counts `verbsearch`'s `Alphaquartz Neighbour`.

Do not weaken the expected total to make the check pass. Do not change product code unless the person asking for the change wants this fixed.

## Tell a modeling error from a bug

A register or create failure that exits before the properties is a broken run. Fix the script's setup, not the expected numbers.

`row_owner` fails only when `items` contains a name this user did not create. That matches a missing `user_id` filter on `base_stmt`.

`page_total` fails when `total_items` or the row count differs from the caller's own matching stock. The known failure is `total_items` higher than the rows.

## Update the check when the behavior is intentional

If a change is supposed to count differently, rewrite the expected number in `check.py` in the same change and say what the user can now observe. Then run the check. Move the sync commit below only after that run matches the code you just read.

## Coverage

- Code: `list_wines_page` and `apply_filters` in `app/api/endpoints/wines.py`. The rows come from `base_stmt`. The total comes from `count_stmt`.
- Last confirmed against commit `a467004`.
- Confirmed means the script's expected totals still describe those two statements. A later edit to either statement makes this commit stale. Re-read the statements, run the check, and replace `a467004` only when the script still describes the new code.

## What this does not cover

The check does not open the browser, does not cover `GET /api/wines` without `/page`, and does not cover drinking-window status, grape filters, or pagination past the first page. Quantity `null` and `0` are included because Samling hides them. Pass means the generated cases matched. It does not mean every future filter is safe.

## Proof that the check can fail

To see `row_owner` fail, delete `.where(Wine.user_id == current_user.id)` on `base_stmt` inside `list_wines_page`, run the command, and expect exit 2. Restore that line. The check must return to exit 1, the known `page_total` finding, with `row_owner` passing again. Leave the product file as you found it.
