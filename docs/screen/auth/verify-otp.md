# OTP Verification

| | |
|---|---|
| **Figma nodes** | [`6010:11916`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-11916&m=dev) (empty), [`6010:11997`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-11997&m=dev) (filled, numeric keypad) |
| **Route** | `/auth/verify-otp` (`app/auth/verify-otp.tsx`) |
| **Scene** | `scenes/auth/VerifyOtp.tsx` |
| **Components used** | `AuthHeader` (back button only, no title — see below), `OtpInput`, `Button` |

## Purpose

4-digit email verification code entry, completing the sign-up flow.

## UI elements

- Back chevron (no title text next to it in Figma — the "Verification Code" heading sits in its own centered block below, so `AuthHeader` is used with `title` omitted).
- "Verification Code" heading + description. If an `email` param was passed from Sign Up, it's interpolated into the description ("Check your mail (`email`) to get your verification code...").
- `OtpInput` — 4 individual digit boxes, auto-advancing focus, backspace moves back a box.
- "Don't receive the verification code? **Resend Code**" — stubbed; currently just clears the entered code (no real resend/cooldown timer, no backend to resend from).
- "Verify" primary button.

## States

- **Empty** (`6010:11916`) — initial state, all four boxes blank.
- **Filled** (`6010:11997`) — all four digits entered; Figma shows the device's numeric keypad here (native OS chrome, not implemented — `OtpInput` sets `keyboardType="number-pad"` so the real device/simulator keyboard matches).
- Figma has no explicit "incorrect code" error variant; since there's no backend to validate against, submitting a fully-entered 4-digit code is treated as success. Submitting with fewer than 4 digits is a no-op (button press does nothing until complete).

## Navigation

- **Entry:** from `/auth/sign-up` on successful submit, with `email` as a query param.
- **Exit:** back chevron → `router.back()`. Successful verify → replaces the route with `/welcome` (same completion path as `sign-in.md` — see that doc's "Scope note": nothing is persisted, so a reload starts back at `/onboarding`).
