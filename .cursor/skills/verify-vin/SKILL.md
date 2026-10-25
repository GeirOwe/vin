---
name: verify-vin
description: Drive the Vin wine-collection web app (React UI on Vite, FastAPI API) in an isolated local instance. Use when proving login, collection search, adding a wine, drinking-window filters, empty bottles, or inventory changes.
---

# Verify Vin

Vin's user-facing surface is the React app. The FastAPI process is the API that UI calls. There is no CLI and no Playwright suite. Drive the UI with the Cursor IDE browser. Use `vin-verify` to start, inspect, and stop an isolated instance. Use curl only as the doctor check and as a second view of rows the UI already wrote.

Never start verification against the checkout's `vin.db`, port 8000, or port 5173. Those belong to a normal dev session. A second `vin-verify launch` gets its own ports and SQLite file and can run beside the first. Do not drive an instance this run did not start.

## Launch

From the repo root:

```bash
.cursor/skills/verify-vin/scripts/vin-verify launch
```

The helper requires `.venv/bin/python` (dependencies from `requirements.txt`) and `frontend/node_modules/.bin/vite`. It picks two free ports, creates `/tmp/vin-verify-$RUN_ID/vin.db`, and starts:

- `uvicorn app.main:app --host 127.0.0.1 --port $API_PORT` with `DATABASE_URL=sqlite:///$DB_PATH`, `CORS_ORIGINS` set to the web origin, and `ENVIRONMENT=verification`. Existing environment variables win over `.env`, so this `DATABASE_URL` is the one the API uses.
- `vite --host 127.0.0.1 --port $WEB_PORT --strictPort` with `BROWSER=none` and `VITE_API_BASE` set to the API origin. `BROWSER=none` keeps Vite from opening the system browser (`frontend/vite.config.ts` has `server.open: true`).

Ready means both of these, not only an open socket:

- API log `/tmp/vin-verify-$RUN_ID/api.log` contains `Application startup complete`, and `GET $API_BASE/health` returns `"status": "ok"` with `database.status` `ok`. Schema creation finishes before that log line.
- Web log contains `Local:` and `GET $WEB_BASE/` returns HTML whose title is `Vin · Owen Labs`.

Launch then registers bruker-ID `verify` with password `verify-pass` and inserts three wines through `POST /api/wines`:

| Wine | Role | Quantity | Window |
| --- | --- | --- | --- |
| Barolo Riserva, producer Gaja, type Red, vintage 2018, district Piemonte, grape Nebbiolo | ready to drink | 6 | `2020-01-01` through `2030-12-31` |
| Siste sjanse, producer Clos des Papes, type Red, vintage 2016, district Rhone, grape Grenache | inside the window and inside 16 days of its end | 1 | `2020-01-01` through `SEEDED_APPROACHING_BEFORE` |
| Ung Riesling, producer Dr. Loosen, type White, vintage 2024, district Mosel, grape Riesling | not yet ready | 3 | `SEEDED_NOT_READY_AFTER` through `SEEDED_NOT_READY_BEFORE` |

Those three dates are computed at launch (today+16, today+400, today+800) and stored in the state file. Read them from there. Do not hardcode them.

Launch prints `RUN_ID`, `WEB_BASE`, `API_BASE`, `STATE`, and `EVIDENCE`. Source the state file with `vin-verify state --run $RUN_ID`.

## Doctor

Run this before driving, and again whenever the page looks like the wrong app:

```bash
.cursor/skills/verify-vin/scripts/vin-verify doctor --run "$RUN_ID"
```

It is read-only. Worth driving means all of the following:

- The recorded API and web pids are alive.
- Their command lines are this run's `uvicorn` and `vite` on the recorded ports.
- `lsof` shows those pids listening on those ports.
- The SQLite file is `$DATA_DIR/vin.db` and is not the repo `vin.db`.
- `GET /health` is ok, including the database, and `GET /` reports service `VIN API` version `1.0.0`.
- The web shell title is `Vin · Owen Labs`.
- `POST /api/auth/login` for `verify` succeeds, and `GET /api/wines/page` lists exactly `Barolo Riserva`, `Siste sjanse`, and `Ung Riesling`.

The last line is `doctor: worth driving`. Anything else means stop. Do not point the browser at a different port to compensate.

## Drive

Harness: the Cursor IDE browser (`browser_navigate`, `browser_lock`, `browser_snapshot`, `browser_fill`, `browser_click`, `browser_select_option`, `browser_take_screenshot`).

1. Read `.cursor/skills/verify-vin/features/README.md` and the feature file for the behavior you are proving.
2. `browser_navigate` to `$WEB_BASE` plus the path in the feature file. Leave `position` unset.
3. `browser_lock` with `action: "lock"` before interacting. Unlock when the proof is captured.
4. `browser_snapshot` before every action. Act on the ref whose role and accessible name match the feature file. Refs go stale after navigation. There are duplicate names (`Logg inn` is both a nav link and the submit button). Use the role the feature file names.
5. After a search or form edit, snapshot again and wait until the expected text appears. Collection search debounces 300ms. The add-wine form debounces 150ms and only then copies fields into the payload.

Login for a seeded journey:

- Open `$WEB_BASE/innlogging`. An anonymous visit to `/` redirects here.
- Fill the textbox named `Bruker-ID` with `verify`.
- Fill the textbox named `Passord` with `verify-pass`.
- Click the button named `Logg inn`. The label flips to `Logger inn…`, then the URL becomes `$WEB_BASE/` and the nav shows `Samling`, `Drikkevindu`, `Tomme`, `Legg til`, and `Logg ut`.

A fresh browser profile does not share `localStorage` with the user's normal browser. The token key is `vin_access_token` on this origin only.

## Evidence

Write proof under `.cursor/skills/verify-vin/artifacts/$RUN_ID/<feature-id>/`. Cleanup does not delete that directory. The directory is gitignored, so leave the proof there and do not commit it.

For each proved feature, record the feature id, the entry point, and both the action and the resulting state:

- An accessibility snapshot saved as `results.aria.txt`. Include the document title `Vin · Owen Labs`, the control you used, and the resulting names.
- A screenshot saved as `results.png` that shows the Vin header and the resulting state. `browser_take_screenshot` stores the file under Cursor's temp screenshot directory and returns that path. Copy the returned file into the evidence directory. A screenshot left only in the temp directory is not proof.
- For a mutation, a second view of the stored row: `POST /api/auth/login`, then `GET /api/wines/{id}` or `GET /api/wines/page?...`. Save the response fields you asserted (names, quantity, dates). Do not write the access token into the artifact.

Exercise the UI path. The seed request inside `vin-verify launch` is fixture setup, not a substitute for the journey. Do not prove a feature by calling only the API.

Do not click `Fyll skjema fra etikett`. That sends the label image to the external xAI API. Do not click `Hent forslag`. That calls `EXTERNAL_WINE_API_BASE_URL`. Leave both unused.

## Cleanup

```bash
.cursor/skills/verify-vin/scripts/vin-verify cleanup --run "$RUN_ID"
```

This kills the recorded uvicorn pid only if its command contains `uvicorn`, and the recorded vite pid only if its command contains `vite`. It then deletes `/tmp/vin-verify-$RUN_ID`. It does not delete `.cursor/skills/verify-vin/artifacts/$RUN_ID`. After cleanup, confirm the evidence files are still in that directory.

If launch fails halfway, the script's exit handler kills whatever pids it started and removes the data directory. Run cleanup yourself if you interrupted a run and a later doctor says the pid is dead but the port is still taken.

## Helpers

```bash
.cursor/skills/verify-vin/scripts/vin-verify launch
.cursor/skills/verify-vin/scripts/vin-verify doctor --run "$RUN_ID"
.cursor/skills/verify-vin/scripts/vin-verify state --run "$RUN_ID"
.cursor/skills/verify-vin/scripts/vin-verify cleanup --run "$RUN_ID"
```

`state` prints the shell-sourceable file for that run, including ports, the database path, seeded names, and the computed drinking-window dates.
