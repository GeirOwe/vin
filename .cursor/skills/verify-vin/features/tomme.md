# Tomme flasker

Tomme lists bottles whose quantity is 0 or has no quantity stored. The seeded bottles have quantity 1, so they must not appear here.

## Sub-features

- `empty-excludes-stock` hides `Barolo Riserva` and `Chablis`.
- `empty-message` shows the empty-state sentence when every bottle still has stock.

## How to get to it (user POV)

- Choose `Tomme` in the header.
- Open `$UI_BASE/tomme`.

## Driving it with the browser

Preconditions:

- `vin-verify doctor` is ok.
- `vin-verify seed` has run.
- The browser is signed in as `vin-verify`.

- **Open the list.** Go to `$UI_BASE/tomme`. The heading is `Tomme flasker`.
- **Stock stays out.** The buttons `Åpne Barolo Riserva` and `Åpne Chablis` are absent.
- **Empty sentence.** The text `Ingen tomme viner. Alle viner i samlingen har antall over null.` is visible.
- **Proof.** Save a snapshot and a screenshot to `$EVIDENCE_DIR/tomme/`.

## Gotchas

- Creating a quantity of 0 from Legg til is rejected by the form. This journey does not invent a zero-quantity bottle. Without one, the empty sentence is the proof, and a journey that needed a listed empty bottle reports that the seed has none.
