# Create New Password

| | |
|---|---|
| **Figma nodes** | [`6010:12193`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-12193&m=dev) ("Create new pass"), [`6010:14455`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-14455&m=dev) ("Create new pass done" — success popup) |
| **Route** | `/auth/reset-password` (`app/auth/reset-password.tsx`) |
| **Scene** | `scenes/auth/ResetPassword.tsx` |
| **Components used** | `AuthHeader` (back button only), `AuthTitleBlock`, `TextField`, `Button`, `SuccessSheet` |

## Purpose

Final step of the password-reset flow: the user sets and confirms a new password after their email/OTP has been verified.

## UI elements

- `AuthHeader` — back chevron only.
- `AuthTitleBlock` — "Create New Password" heading + "Your new password must be different from your previously used password." description.
- New Password `TextField` (`secureTextEntry`, eye toggle built in).
- Confirm Password `TextField` (`secureTextEntry`, eye toggle built in).
- "Reset Password" primary button.
- On success, `SuccessSheet` — green tick-square badge, "Reset Succesfully" / "Please re-login to get started", "Log in" button. Same reusable popup shape as the "Account Created Successfully" sheet on `verify-otp.md` (Figma reuses this exact "Popup" component in both places).

## States

Client-side validation only (no backend — see `docs/PRD.md` §2.2/§4.1):

| Field | Rule | Error text |
|---|---|---|
| New Password | ≥ 6 characters | "Must be at least 6 characters" |
| Confirm Password | equals New Password | "Passwords do not match" |

## Navigation

- **Entry:** successful OTP verification on `/auth/verify-otp?flow=reset`, which `router.replace`s here with `email` as a query param (unused by this screen — Figma doesn't echo it, kept only in case a future real API needs it for the reset request).
- **Exit:** back chevron → `router.back()`. Successful submit opens the `SuccessSheet`; its "Log in" button → `router.replace('/auth/sign-in')`.
