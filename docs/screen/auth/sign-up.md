# Sign Up

|                     |                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma node**      | [`6001:38208`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38208&m=dev) — "Sign Up" |
| **Route**           | `/auth/sign-up` (`app/(auth)/auth/sign-up.tsx`)                                                                                             |
| **Scene**           | `scenes/auth/SignUp.tsx`                                                                                                                    |
| **Components used** | `AuthHeader`, `TextField`, `CountryCodeSheet`, `Button`, `Divider`                                                                          |

## Purpose

Account creation form for a `creator` account. Collects a phone and/or an email, posts to `POST /auth/register`, and hands off to OTP verification. When a phone is given the code goes by **SMS**; an email-only sign-up gets the code by email.

## UI elements

- `AuthHeader` — back chevron + "Sign Up" title.
- `TextField`s: Email, Phone, Password (`secureTextEntry`), Confirm Password (`secureTextEntry`). At least one of Email / Phone is required.
- Phone carries a country-code prefix (flag + dial code + chevron) in `TextField`'s existing `leftAdornment` slot — tapping it opens `CountryCodeSheet`, the same searchable picker Edit Profile uses, over the full `@/data/dial-codes` list. Figma draws no such prefix (it shows a plain `+8801521702480` placeholder); the field's own border/height/type are unchanged, and the selected country defaults to `bd` to match that seeded `+880`. The dial code is held in component state apart from `phone`, which now holds only the local digits.
- "Sign Up" primary button.
- "Or" divider, then "Have an account? **Sign In**" footer link.

## States

Client-side validation on submit (`signUpSchema` in `utils/authSchemas.ts`):

| Field            | Rule                                                              | Error text                         |
| ---------------- | ----------------------------------------------------------------- | ---------------------------------- |
| Email            | blank, or a valid email                                           | "Enter a valid email"              |
| Phone            | blank, or digits only (local digits; the dial code is always set) | "Enter digits only"                |
| Email + Phone    | at least one given (both fields flagged when neither is)          | "Enter a phone number or an email" |
| Password         | ≥ 8 characters (backend `RegisterDto` minimum)                    | "Must be at least 8 characters"    |
| Confirm Password | equals Password                                                   | "Passwords do not match"           |

The phone is sent as E.164 — `toE164(dialCode, digits)` in `utils/phone.ts` joins the selected dial code with the national digits (formatting and the trunk `0` stripped) — and rejected on the field if the result is not `+[1-9]\d{7,14}`. Backend errors land through `applyApiError`: a `409 ALREADY_EXISTS` goes on the `phone` or `email` field (whichever the backend names), `422` field errors on their inputs, anything else as a form-level message.

Figma does not show an explicit sign-up error-state variant; the error styling reuses the same red-border/red-message pattern from the Sign In screen's error states (`TextField`'s built-in `error` prop) for consistency.

## Navigation

- **Entry:** "Sign Up" link from `/auth` or `/auth/sign-in`.
- **Exit:** back chevron → `/auth`. Successful submit → `router.push('/auth/verify-otp')` with the backend's `data.verification` spread into params — `destination` (the server-normalized phone/email), `channel` (`sms` | `email`), `sentAt`, `expiresAt` and `expiresInMinutes` (epoch-ms / minutes, as strings) — so the OTP screen can address the resend and count down the code's life (see `verify-otp.md`). "Sign In" link → `/auth/sign-in`.
