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

4-digit email verification code entry. **This single screen is reused for two flows**, distinguished by a `flow` query param — Figma has two near-identical frames for it (only the heading/description copy and the post-verify destination differ), so rather than duplicate the screen, `VerifyOtp` branches on `flow` instead. This directly reuses the same OTP component/route the sign-up flow already had, per the pattern of not building a second OTP screen from scratch for password reset.

| `flow` param                   | Entry point             | Heading             | Description                                                  | On verify                                               |
| ------------------------------ | ----------------------- | ------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| `signup` (default, or omitted) | `/auth/sign-up`         | "Verification Code" | "Check your mail (`email`) to get your verification code..." | Opens the "Account Created Successfully" `SuccessSheet` |
| `reset`                        | `/auth/forgot-password` | "OTP Verification"  | "Please check your email to reset your password"             | `router.replace('/auth/reset-password')`                |

## UI elements

- `AuthHeader` — back chevron only (no title — the heading is in `AuthTitleBlock`, matching Figma).
- `AuthTitleBlock` — heading + description per the flow table above.
- `OtpInput` — 4 individual digit boxes, auto-advancing focus, backspace moves back a box.
- "Don't receive the verification code? **Resend Code**" — stubbed; currently just clears the entered code (no real resend/cooldown timer, no backend to resend from).
- "Verify" primary button.
- **Sign-up flow only:** on successful verify, a `SuccessSheet` opens over this screen — green tick-square badge, "Account Created Successfully" / "Enjoy your Experience", "Next" button (Figma node `6495:5693`). This is the screen that appears once registration completes.

## States

- **Empty** — initial state, all four boxes blank.
- **Filled** — all four digits entered; Figma shows the device's numeric keypad here (native OS chrome, not implemented — `OtpInput` sets `keyboardType="number-pad"` so the real device/simulator keyboard matches).
- Figma has no explicit "incorrect code" error variant; since there's no backend to validate against, submitting a fully-entered 4-digit code is treated as success. Submitting with fewer than 4 digits is a no-op (button press does nothing until complete).

## Navigation

- **Entry:** from `/auth/sign-up` (no `flow` param, defaults to `signup`) or `/auth/forgot-password` (`flow=reset`), both passing `email` as a query param.
- **Exit:** back chevron → `router.back()`.
  - `signup` flow: Verify → opens `SuccessSheet` → "Next" → `router.replace('/profile-verification/date-of-birth')` (see `docs/screen/profile-verification/README.md`; nothing is persisted — see `sign-in.md`'s "Scope note" — a reload starts back at `/onboarding`).
  - `reset` flow: Verify → `router.replace('/auth/reset-password')` with `email` carried forward.
