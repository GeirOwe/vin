# Logg inn

A person opens Vin, enters a bruker-ID and a password, and lands in their own collection.

## Sub-features

- `login-form` signs in from `/innlogging` and shows the collection.
- `login-bad-password` stays on the form and shows an error.

## How to get to it (user POV)

- Open `$UI_BASE/innlogging`.
- From a signed-out page, choose `Logg inn` in the header.

## Driving it with the browser

Preconditions:

- `vin-verify doctor` is ok.
- `vin-verify seed` has created `vin-verify`.

- **Form entry.** Open `$UI_BASE/innlogging`. The heading is `Logg inn`.
- **Sign in.** Fill `Bruker-ID` with `vin-verify` and `Passord` with `VerifyVin1`. Choose the button `Logg inn`. The next screen shows the heading `Vin` and the link `Samling`.
- **Bad password.** Open `/innlogging` again after `Logg ut`. Fill `Bruker-ID` with `vin-verify` and `Passord` with `feil-passord`. Choose `Logg inn`. The heading stays `Logg inn` and an error is visible.
- **Proof.** Save an ARIA snapshot and a screenshot of the signed-in collection to `$EVIDENCE_DIR/logg-inn/`.

## Gotchas

- A bad password and an unknown bruker-ID use the same error text.
- The header link `Logg inn` is absent after a successful sign-in. `Logg ut` is the way back to the form.
- Do not type the password into a note or a screenshot filename.
