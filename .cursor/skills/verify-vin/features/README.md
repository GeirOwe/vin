# Vin verification map

This directory is the maintained source for verifying what a person can do in Vin. Read this index, then follow one feature file.

## Baseline preconditions

- Launch with `.cursor/skills/verify-vin/bin/vin-verify launch` and keep `RUN_DIR`.
- Run `vin-verify doctor` and require the isolated sqlite URL under that `RUN_DIR`.
- Run `vin-verify seed` before a journey that needs `Barolo Riserva` and `Chablis`.
- Log in through `$UI_BASE/innlogging` as `vin-verify` / `VerifyVin1`.
- Never drive an instance this run did not start.

## Driving conventions

- Start from the seeded collection unless the feature file says otherwise.
- Prefer the accessible names in the feature file.
- The search box is identified by the placeholder `Søk på navn eller produsent`.
- Drive the browser with cursor-ide-browser. Lock the tab first.
- Leave files in `$EVIDENCE_DIR` in place during cleanup.

## Proof and skip reporting

- Capture the action and the screen after it.
- UI proof is an ARIA snapshot and a screenshot that shows Vin and the result.
- A change that writes a wine also saves `GET /api/wines/page` JSON for the same user.
- Name the feature id and the entry point in `notes.txt`.
- If a path cannot be reached, record the command and the missing precondition. Do not mark a different path as covering it.

## Features

- [Logg inn](./logg-inn.md) covers the login form and a bad password.
- [Søk i samlingen](./sok-i-samlingen.md) covers name search, an empty result, and reset.
- [Legg til vin](./legg-til-vin.md) covers creating a bottle from the form.
- [Drikkevindu](./drikkevindu.md) covers the three drinking-window tabs.
- [Tomme flasker](./tomme.md) covers the empty-bottle list.
- [Matparing](./matparing.md) covers the food tabs and the batch fetch.
- [Kode på flasken](./kode-paa-flasken.md) covers typing a product number into the add form.
- [Oppdater fra Vinmonopolet](./oppdater-fra-vinmonopolet.md) covers fetching a code onto an existing wine and saving it.
- [Slett vin](./slett-vin.md) covers deleting a wine that still has bottles.
