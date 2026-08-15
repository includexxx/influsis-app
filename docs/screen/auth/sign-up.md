# Sign Up

|                     |                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma node**      | [`6001:38208`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38208&m=dev) — "Sign Up" |
| **Route**           | `/auth/sign-up` (`app/(auth)/auth/sign-up.tsx`)                                                                                             |
| **Scene**           | `scenes/auth/SignUp.tsx`                                                                                                                    |
| **Components used** | `AuthHeader`, `TextField`, `Button`, `Divider`                                                                                              |

## Purpose

Account creation form, collecting the fields needed to hand off to OTP verification.

## UI elements

- `AuthHeader` — back chevron + "Sign Up" title.
- `TextField`s: Full Name, Email, Phone, Password (`secureTextEntry`), Confirm Password (`secureTextEntry`).
- "Sign Up" primary button.
- "Or" divider, then "Have an account? **Sign In**" footer link.

## States

Client-side validation on submit (no backend — see `docs/PRD.md` §2.2/§4.1):

| Field            | Rule                  | Error text                      |
| ---------------- | --------------------- | ------------------------------- |
| Full Name        | non-empty             | "Full name is required"         |
| Email            | matches `EMAIL_REGEX` | "Invalid email"                 |
| Phone            | non-empty             | "Phone number is required"      |
| Password         | ≥ 6 characters        | "Must be at least 6 characters" |
| Confirm Password | equals Password       | "Passwords do not match"        |

Figma does not show an explicit sign-up error-state variant; the error styling reuses the same red-border/red-message pattern from the Sign In screen's error states (`TextField`'s built-in `error` prop) for consistency.

## Navigation

- **Entry:** "Sign Up" link from `/auth` or `/auth/sign-in`.
- **Exit:** back chevron → `router.back()`. Successful submit → `router.push('/auth/verify-otp')` with the entered email passed as a query param (so the OTP screen can echo it back — see `verify-otp.md`). "Sign In" link → `/auth/sign-in`.
