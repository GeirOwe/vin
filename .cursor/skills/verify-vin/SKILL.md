---
name: verify-vin
description: "Drive the Vin cellar app in an isolated browser session and prove a user-facing change. Use when a change touches the React UI, login, the wine collection, add wine, drinking window, or empty bottles, and the proof has to be what a user sees."
---

# Verify Vin

Vin is a local web app. The user touches the React UI at the verify UI port. The FastAPI API is the data store behind that UI. Drive the UI. Use the API only to seed the isolated database and to read back a row the UI wrote.

Never point this run at the developer's `vin.db` or at a server you did not start. Two verify runs must not share a database. `vin-verify launch` refuses to start when the pointer in `.cursor/skills/verify-vin/run/current` still has a live API pid.

## Launch

From the repo root:

```bash
chmod +x .cursor/skills/verify-vin/bin/vin-verify
.cursor/skills/verify-vin/bin/vin-verify launch
```

The helper picks a free API port from 8017 and a free UI port from 5179. It starts `.venv/bin/uvicorn app.main:app` with `DATABASE_URL=sqlite:///$RUN_DIR/vin.db` and `CORS_ORIGINS` set to that UI origin. It starts Vite through `.cursor/skills/verify-vin/bin/serve-ui.mjs` with `open: false` and `VITE_API_BASE` set to that API. Ready means `GET $API_BASE/health` returns `"database": {"status": "ok"}` and `GET $UI_BASE/` returns a page. A listening port alone is not ready.

Keep the printed `RUN_DIR`. Later commands take it as an argument when the pointer is wrong.

Requires the README setup already done: `.venv` with dependencies, and `frontend/node_modules`.

## Doctor

Run this before driving, and again when a click does nothing.

```bash
.cursor/skills/verify-vin/bin/vin-verify doctor "$RUN_DIR"
```

Doctor passes only when both recorded pids are alive, the database URL is the sqlite file inside that run directory, health reports database ok, and the UI answers. Anything else means stop. Do not drive a different port.

## Drive

The harness is the cursor-ide-browser tools. Lock the tab before clicks. Unlock when the proof is captured.

1. `browser_navigate` to `$UI_BASE/innlogging`.
2. `browser_lock` with action `lock`.
3. `browser_snapshot` and use the refs it returns.
4. Fill and click by accessible name. The login labels are `Bruker-ID` and `Passord`. The submit button is `Logg inn`.
5. After a mutation, snapshot again and save a screenshot. Also read the resulting row back from the API or from the next screen.

Seeded login, written by `vin-verify seed` into the isolated database only:

- Bruker-ID `vin-verify`
- Passord `VerifyVin1`

Search waits 300ms after the last key before the list updates. Wait for the heading row or `Ingen viner funnet.`, not a fixed sleep.

The search box accessible name is `Søk på navn eller produsent`. That name comes from the placeholder. There is no separate label.

Wine type sent to the API must be `Red`, `White`, `Rose`, `Sparkling`, `Dessert`, or `Fortified`. The placeholder shows Norwegian words. Those words fail create.

## Evidence

Write proof under `$EVIDENCE_DIR/<feature-id>/`, the directory launch prints. Capture the action and the state after it.

- UI proof is an ARIA snapshot plus a screenshot that shows the Vin heading and the result text. `browser_take_screenshot` may write the file under its own temp directory. Copy that file to `$EVIDENCE_DIR/<feature-id>/results.png`.
- A create or search proof also saves the JSON from `GET $API_BASE/api/wines/page` for the same user. The token is `$RUN_DIR/token` after seed. Do not print the token.
- Record the feature id and the entry point in a `notes.txt` next to the files.

Mocks are not used. The isolated sqlite file is the real database for this run.

## Cleanup

```bash
.cursor/skills/verify-vin/bin/vin-verify cleanup "$RUN_DIR"
```

Cleanup kills the API pid and the UI pid recorded for that run, then deletes `$RUN_DIR`. It does not delete `$EVIDENCE_DIR`. After cleanup, the snapshot and screenshot must still be on disk. If a run fails halfway, run cleanup before trying again so the ports and the pointer are released.

## Helpers

`.cursor/skills/verify-vin/bin/vin-verify` is the launcher, doctor, seed, and cleanup. Invoke it as shown above.

`.cursor/skills/verify-vin/bin/serve-ui.mjs` is what launch uses to start Vite without opening the operator's browser. Do not run it on its own.

Seed:

```bash
.cursor/skills/verify-vin/bin/vin-verify seed "$RUN_DIR"
```

Seed registers `vin-verify` and inserts `Barolo Riserva` by Gaja and `Chablis` by William Fevre, each with quantity 1.

## Feature map

Read `.cursor/skills/verify-vin/features/README.md` before choosing a journey. A proof of one entry point does not cover the other entry points listed in that feature file.
