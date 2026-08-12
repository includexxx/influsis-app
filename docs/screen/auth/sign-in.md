# Sign In

| | |
|---|---|
| **Figma nodes** | [`6010:15413`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-15413&m=dev) (default, keyboard open), [`6001:38130`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38130&m=dev) (clean/no-keyboard), [`6010:7292`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-7292&m=dev) (invalid email), [`6054:6237`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6054-6237&m=dev) (wrong password) |
| **Route** | `/auth/sign-in` (`app/(auth)/auth/sign-in.tsx`) |
| **Scene** | `scenes/auth/SignIn.tsx` |
| **Components used** | `AuthHeader`, `TextField`, `Button` |

## Purpose

Email/password sign-in form. The four Figma nodes are all the same screen in different validation states, not separate screens.

## UI elements

- `AuthHeader` — back chevron + "Sign In" title.
- Email `TextField`.
- Password `TextField` (`secureTextEntry`, with the eye toggle built into `TextField`).
- "Forgot password?" text, right-aligned under the password field → `router.push('/auth/forgot-password')` (see [`forgot-password.md`](./forgot-password.md)).
- "Sign in" primary button.

## States

| State | Trigger | Figma node |
|---|---|---|
| Default | initial / valid input | `6001:38130` |
| Invalid email | submitted email fails `EMAIL_REGEX` | `6010:7292` |
| Wrong password | valid email, password shorter than `MIN_PASSWORD_LENGTH` (6) | `6054:6237` |

**Scope note:** there is no real auth API yet (`docs/PRD.md` §2.2/§4.1). `MIN_PASSWORD_LENGTH` is a deliberately simple client-side stand-in so the "wrong password" error state from Figma is reachable and demonstrable, not a real credential check. Replace this validation with a real API call once the backend exists.

On successful validation, the screen just replaces the route with `/home` (the main app's Tabs group, see `docs/screen/main/README.md`) — no `onboarded`/completion flag is persisted (an earlier version of this flow did persist one via `DataPersistKeys`, but that made the flow un-repeatable across reloads during development, so it was removed; every fresh launch or reload starts back at `/onboarding`). Reintroduce persistence here once there's a real signed-in session to gate on.

## Navigation

- **Entry:** "Continue with Email" (or any provider stub) from `/auth`; "Sign In" link from `/auth/sign-up`; "Log in" button on the reset-password `SuccessSheet` (`/auth/reset-password`).
- **Exit:** back chevron → `router.back()`. Successful submit → replaces route with `/home`. "Forgot password?" → `/auth/forgot-password`.
