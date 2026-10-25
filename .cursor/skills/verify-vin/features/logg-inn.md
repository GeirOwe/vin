# Log in

Login lets a person open their own Vin with a bruker-ID and password, create an account, and sign back out. Anonymous visitors are sent to the login page.

## Sub-features

- `login-form` signs in the seeded user and lands on the collection.
- `login-reject` shows an error for a wrong password and stays on the login page.
- `register-account` creates a new bruker-ID and lands on an empty collection.
- `logout` returns to the login page and hides the collection.

## How to get to it (user POV)

- Open the site root. A signed-out visitor is redirected to Logg inn.
- Choose `Logg inn` in the header when signed out.
- Choose `Opprett konto` in the header, or the `Opprett konto` link under the login form.
- Choose `Logg ut` in the header when signed in.

## Driving it with the Cursor IDE browser

Preconditions:

- `vin-verify doctor --run "$RUN_ID"` prints `doctor: worth driving`.
- The browser has no `vin_access_token` for `$WEB_BASE`. Use a fresh tab on this verification origin.

- **Open login.** Navigate to `$WEB_BASE/`. The URL becomes `$WEB_BASE/innlogging`, the document title is `Vin · Owen Labs`, and a level-1 heading reads `Logg inn`.
- **Sign in.** Fill the textbox named `Bruker-ID` with `verify` and the textbox named `Passord` with `verify-pass`. Click the button named `Logg inn`. The URL becomes `$WEB_BASE/`, the heading `Din samling` is visible, and the header shows `Logg ut` plus the text `verify`.
- **Reject a bad password.** Sign out first, then fill `Bruker-ID` with `verify` and `Passord` with `wrong-pass`. Click the button named `Logg inn`. The URL stays on `/innlogging` and the text `Ugyldig bruker-ID eller passord.` appears.
- **Register.** Navigate to `$WEB_BASE/registrer`. Fill `Bruker-ID` with `verify-extra`, `Passord` with `verify-pass`, and `Bekreft passord` with `verify-pass`. Click the button named `Opprett konto`. The URL becomes `$WEB_BASE/` and the collection shows `Ingen viner funnet.` The header shows `verify-extra`.
- **Log out.** Click the button named `Logg ut`. The URL becomes `$WEB_BASE/innlogging` and the header shows `Logg inn` and `Opprett konto` instead of `Samling`.
- **Proof.** Save an accessibility snapshot to `artifacts/$RUN_ID/logg-inn/results.aria.txt` and a screenshot to `artifacts/$RUN_ID/logg-inn/results.png` while the signed-in collection for `verify` is visible. The artifacts show `Vin · Owen Labs`, `Din samling`, and `Barolo Riserva`.

## Gotchas

- `Logg inn` and `Opprett konto` each appear twice. The header controls are links. The form controls are buttons. Clicking the header `Logg inn` link while already on the login page does not submit.
- Bruker-ID must match `^[A-Za-z0-9._-]{3,80}$`. Passwords must be at least 8 characters. Mismatched confirmation shows a validation error and does not create the user.
- Registering `verify` again shows `Denne bruker-ID-en er allerede i bruk.`
- A successful registration logs that user in. Their collection is empty. Sign out and sign back in as `verify` before a later feature that needs the seeded wines.
- The button label `Logger inn…` or `Oppretter…` is the in-flight state. Wait until the URL changes or an error is shown.
