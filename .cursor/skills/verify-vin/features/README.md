# Vin verification map

This directory is the maintained source for verifying the user-facing behavior of Vin. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch with `.cursor/skills/verify-vin/scripts/vin-verify launch` and keep the printed `RUN_ID`.
- The web app is `$WEB_BASE` and the API is `$API_BASE` from that run's state file. Do not assume ports 5173 or 8000.
- The database is the empty-then-seeded SQLite file at `$DB_PATH` under `/tmp/vin-verify-$RUN_ID`. It is not `vin.db` in the repo.
- Seeded user: bruker-ID `verify`, password `verify-pass`.
- Seeded wines: `Barolo Riserva`, `Siste sjanse`, and `Ung Riesling`. Window dates that move with the calendar are `SEEDED_APPROACHING_BEFORE`, `SEEDED_NOT_READY_AFTER`, and `SEEDED_NOT_READY_BEFORE` in the state file.
- Run `vin-verify doctor --run "$RUN_ID"` and require `doctor: worth driving`.
- Never drive an instance that was not started by this verification run.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer ARIA roles and accessible names over CSS selectors or DOM position.
- Treat every label in a feature file as literal. The UI is Norwegian.
- Resolve a name to a ref with `browser_snapshot`, then `browser_fill`, `browser_click`, or `browser_select_option`. Take a new snapshot after navigation.
- Lock the browser tab before interacting and unlock it after the proof is stored.
- Restore seeded data after a mutation when a later feature in the same run still needs it. Do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an accessibility snapshot and a screenshot with `Vin · Owen Labs` visible.
- Mutation proof includes a read-only API read of the stored wine, without the access token in the artifact.
- Record the feature id and entry point used with every artifact.
- Report an unreachable path with the attempted control and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with the Cursor IDE browser` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact control and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

## Features

- [Log in](./logg-inn.md) covers registration, login, rejection, and logout.
- [Add a wine](./legg-til-vin.md) covers the add form, validation, and seeing the new wine in the collection.
- [Search the collection](./sok-i-samlingen.md) covers name and producer search, filters, empty results, and reset.
- [Drinking window](./drikkevindu.md) covers the three window tabs.
- [Inventory and empty bottles](./beholdning.md) covers quantity changes, the audit log, and the Tomme list.
