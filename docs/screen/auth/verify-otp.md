# OTP Verification

|                                        |                                                                                                                                                                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma nodes (sign-up flow)**         | [`6010:11916`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-11916&m=dev) (empty), [`6010:11997`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-11997&m=dev) (filled, numeric keypad) |
| **Figma nodes (reset-password flow)**  | [`6010:11880`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-11880&m=dev) (empty), [`6001:38283`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38283&m=dev) (filled)                 |
| **Figma node (account-created popup)** | [`6495:5693`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6495-5693&m=dev) — "Forget OTP Submit" (name is a Figma mislabel; this is the sign-up completion popup, see below)                                                                   |
| **Route**                              | `/auth/verify-otp` (`app/(auth)/auth/verify-otp.tsx`)                                                                                                                                                                                                                                             |
| **Scene**                              | `scenes/auth/VerifyOtp.tsx`                                                                                                                                                                                                                                                                       |
| **Components used**                    | `AuthHeader` (back button only), `AuthTitleBlock`, `OtpInput`, `Button`, `SuccessSheet`                                                                                                                                                                                                           |

## Purpose

4-digit verification code entry, delivered by **SMS** (phone sign-up) or **email**. **This single screen is reused for two flows**, distinguished by a `flow` query param — Figma has two near-identical frames for it (only the heading/description copy and the post-verify destination differ), so rather than duplicate the screen, `VerifyOtp` branches on `flow` instead. This directly reuses the same OTP component/route the sign-up flow already had, per the pattern of not building a second OTP screen from scratch for password reset.

| `flow` param                   | Entry point                                                     | Heading             | Description                                                                                                                           | On verify                                               |
| ------------------------------ | --------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `signup` (default, or omitted) | `/auth/sign-up`, or `/auth/sign-in` for an `unverified` account | "Verification Code" | `sms`: "We sent a 4-digit code by SMS to `destination`…"; `email`: "Check your mail (`destination`) to get your verification code..." | Opens the "Account Created Successfully" `SuccessSheet` |
| `reset`                        | `/auth/forgot-password`                                         | "OTP Verification"  | "Please check your email to reset your password"                                                                                      | `router.replace('/auth/reset-password')`                |

## UI elements

- `AuthHeader` — back chevron only (no title — the heading is in `AuthTitleBlock`, matching Figma).
- `AuthTitleBlock` — heading + description per the flow table above.
- `OtpInput` — 4 individual digit boxes, auto-advancing focus, backspace moves back a box.
- "Code expires in **m:ss**" — counts down to the `expiresAt` param (`useCountdown`, `utils/countdown.ts`); at zero it becomes "Your code has expired. Request a new one." in the error colour and the Verify button disables. Rendered only when the entry passed timestamps, so the reset flow looks as before.
- "Don't receive the verification code? **Resend Code**" — `POST /auth/otp/request` with the screen's `destination` + `channel`. Disabled for 30 s after any send ("Resend Code in 0:29", counted from `sentAt`); a successful resend clears the boxes, restarts both countdowns (`expiresInMinutes` from the params, default 5) and rewrites the params via `router.setParams`. Both timers run against absolute timestamps, so backgrounding the app and coming back shows the true remaining time.
- "Verify" primary button.
- **Sign-up flow only:** on successful verify, a `SuccessSheet` opens over this screen — green tick-square badge, "Account Created Successfully" / "Enjoy your Experience", "Next" button (Figma node `6495:5693`). This is the screen that appears once registration completes.

## States

- **Empty** — initial state, all four boxes blank.
- **Filled** — all four digits entered; Figma shows the device's numeric keypad here (native OS chrome, not implemented — `OtpInput` sets `keyboardType="number-pad"` so the real device/simulator keyboard matches).
- **Error** — the boxes turn red with a message under them: wrong code, expired/used code, no account, rate-limited (`utils/otpErrors.ts`), or `503` when the SMS gateway could not send (only Bangladeshi mobiles are routable). Submitting with fewer than 4 digits, or after the code expired, is a no-op.

## Navigation

- **Entry:** from `/auth/sign-up` (no `flow` param, defaults to `signup`) with `destination`, `channel`, `sentAt`, `expiresAt`, `expiresInMinutes`; from `/auth/sign-in` with the same params when an `unverified` account signs in (a fresh code is requested first); or from `/auth/forgot-password` (`flow=reset`) passing the legacy `email` param and no timestamps. The screen reads `destination ?? email`.
- **Exit:** back chevron → `router.back()`.
  - `signup` flow: Verify → `POST /auth/otp/verify` (`purpose: registration`) → opens `SuccessSheet` → "Next" → tokens stored + `sessionEstablished` → `router.replace('/creator-onboarding')`. Tokens are deliberately committed only on "Next": the `(auth)` layout gate redirects an authenticated session to `/home`.
  - `reset` flow: Verify → `router.replace('/auth/reset-password')` with `email` carried forward.
