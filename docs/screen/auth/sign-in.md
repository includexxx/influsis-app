# Sign In

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Figma nodes**     | [`6010:15413`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-15413&m=dev) (default, keyboard open), [`6001:38130`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38130&m=dev) (clean/no-keyboard), [`6010:7292`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-7292&m=dev) (invalid email), [`6054:6237`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6054-6237&m=dev) (wrong password) |
| **Route**           | `/auth/sign-in` (`app/(auth)/auth/sign-in.tsx`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Scene**           | `scenes/auth/SignIn.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Components used** | `AuthHeader`, `TextField`, `Button`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

## Purpose

Email-or-phone / password sign-in form (`POST /auth/login`). The four Figma nodes are all the same screen in different validation states, not separate screens.

## UI elements

- `AuthHeader` — back chevron + "Sign In" title.
- "Email or Phone" `TextField`. A phone is normalized to E.164 before sending (`normalizeIdentifier` in `utils/phone.ts`: `017…` → `+88017…` with the `+880` default; `+…`, `00…` and `880…` prefixes are recognised) because the backend only treats an E.164 string as a phone.
- Password `TextField` (`secureTextEntry`, with the eye toggle built into `TextField`).
- "Forgot password?" text, right-aligned under the password field → `router.push('/auth/forgot-password')` (see [`forgot-password.md`](./forgot-password.md)).
- "Sign in" primary button.

## States

| State          | Trigger                                                     | Figma node   |
| -------------- | ----------------------------------------------------------- | ------------ |
| Default        | initial / valid input                                       | `6001:38130` |
| Invalid email  | identifier is neither an email nor a phone (`signInSchema`) | `6010:7292`  |
| Wrong password | backend `401 AUTH_INVALID_CREDENTIALS` → form-level alert   | `6054:6237`  |

After a successful `POST /auth/login`:

- `{ mfaRequired, preAuthToken }` → `/auth/verify-2fa` (token held in memory, see `utils/preAuthToken.ts`).
- `user.status === 'unverified'` (registered, never entered the code) → a fresh registration code is requested (`POST /auth/otp/request` to the account's phone, else email) and the screen pushes `/auth/verify-otp` with `destination`, `channel`, `sentAt`, `expiresAt`, `expiresInMinutes`. **No tokens are stored** — the `(auth)` gate would bounce an authenticated session to `/home` before the code is entered.
- otherwise tokens are stored, `sessionEstablished(user)` runs, and the route is replaced with `/creator-onboarding` (`!user.isOnboardingComplete`) or `/home`.

## Navigation

- **Entry:** "Continue with Email" (or any provider stub) from `/auth`; "Sign In" link from `/auth/sign-up`; "Log in" button on the reset-password `SuccessSheet` (`/auth/reset-password`).
- **Exit:** back chevron → `/auth`. Successful submit → see the branches above. "Forgot password?" → `/auth/forgot-password`.
