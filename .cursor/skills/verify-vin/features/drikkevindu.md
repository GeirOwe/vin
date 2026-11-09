# Drikkevindu

The drinking-window screen groups bottles into ready, approaching the deadline, and not ready yet.

## Sub-features

- `window-ready` shows the ready tab.
- `window-approaching` shows the approaching tab.
- `window-not-ready` shows the not-ready tab.

## How to get to it (user POV)

- Choose `Drikkevindu` in the header.
- Choose `Drikkevindu` on the collection hero.
- Open `$UI_BASE/drikkevindu`.

## Driving it with the browser

Preconditions:

- `vin-verify doctor` is ok.
- The browser is signed in as `vin-verify`.
- The seeded wines have no drink-after or drink-before dates. Each tab is therefore an empty state unless this journey first creates a wine with those dates through `legg-til-vin`. If those dates were not created, record the empty state and the missing dates in Gotchas. Do not treat the empty state as proof that a dated wine was classified.

- **Open the screen.** Go to `$UI_BASE/drikkevindu`. The heading is `Drikkevindu`.
- **Ready.** The tab `Klar til å drikke` is selected. Record the list or the empty text.
- **Approaching.** Choose `Nærmer seg frist`. Record the list or the empty text.
- **Not ready.** Choose `Ikke klar`. Record the list or the empty text.
- **Proof.** Save one snapshot per tab under `$EVIDENCE_DIR/drikkevindu/`.

## Gotchas

- A wine with quantity 0 is left out of these tabs.
- A wine with no dates matches none of the three statuses.
- The seeded `Barolo Riserva` and `Chablis` have no dates. They do not prove classification.
