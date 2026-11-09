# Søk i samlingen

Search filters the signed-in collection by wine name or producer, and it can show that nothing matched.

## Sub-features

- `search-match` shows `Barolo Riserva` and hides `Chablis`.
- `search-empty` shows `Ingen viner funnet.`
- `search-clear` restores both seeded wines.

## How to get to it (user POV)

- Choose `Samling` in the header.
- Open `$UI_BASE/` while signed in.

## Driving it with the browser

Preconditions:

- `vin-verify doctor` is ok.
- `vin-verify seed` has created `Barolo Riserva` and `Chablis`, each with quantity 1.
- The browser is signed in as `vin-verify`.

- **Open the collection.** Go to `$UI_BASE/`. The heading `Din samling` is visible, and both `Barolo Riserva` and `Chablis` are listed.
- **Name match.** Type `Barolo` into the input with placeholder `Søk på navn eller produsent`. Wait until the list updates. A button named `Åpne Barolo Riserva` is visible. A button named `Åpne Chablis` is not.
- **Empty state.** Replace the text with `Vulkan`. The text `Ingen viner funnet.` is visible, and neither wine button remains.
- **Clear.** Choose the button `Nullstill`. Both `Åpne Barolo Riserva` and `Åpne Chablis` are visible again.
- **Proof.** On the `Barolo` result, save an ARIA snapshot and a screenshot to `$EVIDENCE_DIR/sok-i-samlingen/`. Save the body of `GET $API_BASE/api/wines/page?search_term=Barolo` with the seed token as `api-page.json`. That JSON contains `Barolo Riserva` and does not contain `Chablis`.

## Gotchas

- The list updates 300ms after typing stops. A snapshot taken in that gap still shows both wines.
- Quantity 0 and an empty quantity are hidden from this list. A seeded wine with quantity 1 is required.
- The search field's accessible name is `Søk på navn eller produsent`, taken from its placeholder. There is no separate label.
- `total_items` in the page JSON can count another user's wines. Judge the names in `items` and the buttons on screen. See `formal-vin-cellar` for that count.
