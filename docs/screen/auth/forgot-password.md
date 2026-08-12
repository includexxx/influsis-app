# Forgot Password

| | |
|---|---|
| **Figma node** | [`6010:11684`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-11684&m=dev) — "Forget" |
| **Route** | `/auth/forgot-password` (`app/auth/forgot-password.tsx`) |
| **Scene** | `scenes/auth/ForgotPassword.tsx` |
| **Components used** | `AuthHeader` (back button only), `AuthTitleBlock`, `TextField`, `Button` |

## Purpose

Collects the account email to kick off the password-reset flow, then hands off to OTP verification.

## UI elements

- `AuthHeader` — back chevron only (no title; the heading lives in `AuthTitleBlock` below, matching the Figma layout).
- `AuthTitleBlock` — "Forget Password" heading + "Enter your email account to reset your password." description. (Figma's copy has a typo, "yourpassword" run together as one word — corrected here since this is screen copy, not a visual design element.)
- Email `TextField`.
- "Send" primary button.

## States

Client-side validation only (no backend — see `docs/PRD.md` §2.2/§4.1):

| Field | Rule | Error text |
|---|---|---|
| Email | matches `EMAIL_REGEX` | "Invalid email" |

## Navigation

- **Entry:** "Forgot password?" link on `/auth/sign-in`.
- **Exit:** back chevron → `router.back()`. Successful submit → `router.push('/auth/verify-otp')` with `email` and `flow=reset` query params, routing into the same OTP screen used by sign-up (see [`verify-otp.md`](./verify-otp.md)).
