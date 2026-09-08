# Feature: Login second factor (19g)

**From build-plan:** feature 19g (seventh and last leaf of item 19, "Real
creator authentication (server-wired)")
**Status:** verified
**Branch:** `feature/login-second-factor`

## Goal

Complete the login flow's other branch. When `POST /auth/login` returns
`{ mfaRequired: true, preAuthToken }` instead of a token pair, 19g routes the
user to a new **Two-Factor Verification** screen that takes a 6-digit TOTP
code, calls `POST /auth/login/2fa/verify`, and on success establishes the
session and lands on `/home` - exactly as a normal login does.

19d already detects `mfaRequired` and shows a "not available yet" message;
19g replaces that with the real screen. This is the final leaf of item 19.

## Backend contracts (implementation authority, read-only)

`../platform-context/api-contracts/auth.md`:

- **`POST /auth/login`** returns `LoginResponseDto`, polymorphic:
  `{ token, refreshToken, tokenExpires, user }` **or**
  `{ mfaRequired: true, preAuthToken }` when a second factor is enrolled
  (`credential.twoFactorEnabledAt` set). `preAuthToken` is opaque, **5-minute
  lifetime**, and travels in the body of the next call, not the
  `Authorization` header.
- **`POST /auth/login/2fa/verify`** (`Login2faVerifyDto`): `{ preAuthToken,
  code }`, `code` is **exactly 6** characters (TOTP). Response `data`:
  `LoginResponseDto` - **always the token-pair shape here**
  (`{ token, refreshToken, tokenExpires, user }`); stamps
  `sessions.two_factor_verified_at`. **Auth: Public** (`skipAuth: true`).
  Errors:
  - `AUTH_MFA_INVALID_CODE` (401) - wrong TOTP code.
  - `AUTH_TOKEN_INVALID` (401) - pre-auth token invalid or expired (5 min).
  - `AUTH_MFA_REQUIRED` (401) - 2FA not actually enabled for the account.
  - `ACCOUNT_SUSPENDED` / `ACCOUNT_DEACTIVATED` (403) - status re-checked.
  - `NOT_FOUND` - the account behind the pre-auth token is gone.
  - `RATE_LIMITED` (429) - too many verify attempts.
  - `VALIDATION_FAILED` - body validation.
- Envelope (`README.md`): branch on `ApiError.code` / `.statusCode`, never
  `.message`.

19b's `authApi` already exposes `useVerifyLogin2faMutation` and the
`Login2faVerifyRequest` / `LoginResponse` / `SessionTokenPair` types. The 19a
interceptor is not involved (`skipAuth`).

## Reachability

The 2FA screen is only reached when the backend's login returns `mfaRequired`,
which only happens for an account that **enrolled** a second factor. The mobile
app has **no 2FA enrollment UI** (Group C `/auth/2fa/setup` etc. are not
built), so a fresh creator never sees this path. It still must be handled: the
contract requires it, and a creator can enrol elsewhere (web, staff tooling).
This feature is not manually reproducible from the mobile app alone - `/check`
needs a backend account with `twoFactorEnabledAt` set.

## In scope

- `utils/authSchemas.ts` - add `twoFactorSchema = z.object({ code:
  z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code') })` and
  `TwoFactorValues`. Extend the test.
- `utils/twoFactorErrors.ts` (new) + test - `twoFactorVerifyErrorMessage(err):
  string` mapping every `Login2faVerifyDto` error code to copy. Pure.
- `utils/preAuthToken.ts` (new) + test - a single-use in-memory holder
  (`setPendingPreAuthToken` / `getPendingPreAuthToken` /
  `clearPendingPreAuthToken`), same shape as 19f's `resetToken.ts`. Keeps the
  opaque `preAuthToken` out of navigation params and, on web, the URL.
- `services/authApi.test.ts` - add one `verifyLogin2fa` case.
- `scenes/auth/SignIn.tsx` - replace the `'mfaRequired' in res` block: on that
  branch `setPendingPreAuthToken(res.preAuthToken)` and
  `router.push('/auth/verify-2fa')`. The token-pair branch and error mapping
  are unchanged.
- `scenes/auth/VerifyTwoFactor.tsx` (new) - `useForm(zodResolver(twoFactorSchema))`
  + one `ControlledTextField` (`keyboardType="number-pad"`, `maxLength={6}`,
  `testID="verify-2fa-code"`) + `useVerifyLogin2faMutation`;
  `const [preAuthToken] = useState(getPendingPreAuthToken)`. `onSubmit`:
  `await verifyLogin2fa({ preAuthToken, code }).unwrap()` ->
  `await setTokens({ token, refreshToken, tokenExpires })` ->
  `dispatch(sessionEstablished(res.user))` -> `clearPendingPreAuthToken()` ->
  `router.replace('/home')`. Errors: `AUTH_MFA_INVALID_CODE` -> the `code`
  field; everything else -> a form-level (`root`) message via
  `twoFactorVerifyErrorMessage`. Missing `preAuthToken` at mount -> a fixed
  form-level "Your sign-in session expired. Go back and sign in again." with
  the button disabled. Layout follows `VerifyOtp` (`AuthHeader` +
  `AuthTitleBlock` + the field + `Button` with `isLoading`).
- `scenes/auth/index.ts` - export `VerifyTwoFactor`.
- `app/(auth)/auth/verify-2fa.tsx` (new) - `export { VerifyTwoFactor as
  default } from '@/scenes/auth';`.

## Out of scope

- 2FA **enrollment** / management (`POST /auth/2fa/setup` / `enable` /
  `disable`, Group C). Not built, not part of item 19.
- Step-up 2FA for sensitive actions (`POST /auth/2fa/step-up`).
- "Remember this device" / trusted-device skip, backup codes, biometric
  factors.
- Re-issuing an expired `preAuthToken`. If it expires (5 min), the user goes
  back to Sign In and signs in again; the error copy says so.
- A 6-box `OtpInput`. Its boxes are a fixed 86px wide (fine for the 4-digit
  email OTP, overflow at 6); 19g uses a single numeric `TextField` for the
  TOTP code and does not touch `OtpInput`.
- Any `slice`, route guard, `app.slice`, or `tokenStore` change. The
  session-establish path is identical to a normal login (and `/home` is where
  the 19c `(auth)/auth` guard sends an authenticated user anyway).
- A Figma design for this screen - none exists; it reuses the auth-screen
  component family.
- Migrating the Profile screen off `app.slice.user` (still the 19b gap).

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
one pass, project compiles and tests green after each step, one review packet.
`/complete` makes the single feature commit and merges into `feat/server-auth`
after approval.

Gates (no `typecheck` script):

- `npx tsc --noEmit` clean
- `npm test` green (Jest; required for the schema, error-mapper, `preAuthToken`
  holder, and added `authApi` logic)
- `npm run lint` clean (0 errors; the unrelated `app/_layout.tsx`
  exhaustive-deps warning stays)

`SignIn` and `VerifyTwoFactor` submit/navigation behavior is screen
integration - verified in `/check` against a backend account with 2FA enabled,
not by a brittle test (`coding-standards.md`). No dev server in the automated
evidence.

## Build steps

- [x] **Step 1 - schema + error mapper + `preAuthToken` holder + tests.**
  - `utils/authSchemas.ts`: add `twoFactorSchema` and `TwoFactorValues`.
    Extend `utils/authSchemas.test.ts` (valid 6-digit, too short, non-numeric).
  - `utils/twoFactorErrors.ts`: `twoFactorVerifyErrorMessage(err)` - not an
    `ApiError` -> generic; `AUTH_MFA_INVALID_CODE` -> "That code is
    incorrect."; `AUTH_TOKEN_INVALID` / `NOT_FOUND` -> "Your sign-in session
    expired. Go back and sign in again."; `AUTH_MFA_REQUIRED` -> "Two-factor
    sign-in is not set up for this account."; `ACCOUNT_SUSPENDED` ->
    "This account has been suspended."; `ACCOUNT_DEACTIVATED` -> "This account
    has been deactivated."; `RATE_LIMITED` -> "Too many attempts. Wait a minute
    and try again."; `NETWORK_ERROR` -> "Cannot reach the server. Check your
    connection and try again."; else -> `err.message` or generic. Add
    `utils/twoFactorErrors.test.ts`.
  - `utils/preAuthToken.ts`: module-level `let pending: string | null = null`;
    `setPendingPreAuthToken` / `getPendingPreAuthToken` (peek, no clear) /
    `clearPendingPreAuthToken`. Add `utils/preAuthToken.test.ts`.
  *Done when:* tests cover the schema (3), every branch of the mapper (~9), and
  the holder (set-then-get, clear, get-before-set); `npm test` green;
  `npx tsc --noEmit` clean.

- [x] **Step 2 - `authApi` verifyLogin2fa coverage.** In
  `services/authApi.test.ts` add: `verifyLogin2fa({ preAuthToken, code })`
  posts to `/auth/login/2fa/verify` with `skipAuth`, no `Authorization`
  header, and unwraps the token-pair `data`.
  *Done when:* the case passes; `npm test` green.

- [x] **Step 3 - `SignIn` mfa branch.** In `scenes/auth/SignIn.tsx` replace:

    ```ts
    if ('mfaRequired' in res) {
      setError('root', { message: 'Two-factor sign-in is not available in this version yet.' });
      return;
    }
    ```

  with:

    ```ts
    if ('mfaRequired' in res) {
      setPendingPreAuthToken(res.preAuthToken);
      router.push('/auth/verify-2fa');
      return;
    }
    ```

  Import `setPendingPreAuthToken` from `@/utils/preAuthToken`. Nothing else in
  the file changes.
  *Done when:* `npx tsc --noEmit` clean; `npm test` green; `npm run lint`
  clean.

- [x] **Step 4 - `VerifyTwoFactor` screen + route.**
  - `scenes/auth/VerifyTwoFactor.tsx` per In scope. Use `useAuthSlice` for
    `dispatch` + `sessionEstablished`; `setTokens` from `@/services`;
    `useVerifyLogin2faMutation` from `@/services`. Render a `root` error
    `<Text>` and, when `preAuthToken` is missing at mount, the fixed expired
    message with `disabled` on the button.
  - `scenes/auth/index.ts`: `export { default as VerifyTwoFactor } from
    './VerifyTwoFactor';`.
  - `app/(auth)/auth/verify-2fa.tsx`: `export { VerifyTwoFactor as default }
    from '@/scenes/auth';`.
  *Done when:* `npx tsc --noEmit` clean; `npm test` green; `npm run lint`
  clean; `git grep -l verify-2fa` shows the route file and the scene; the
  manual path below works in `/check` against a 2FA-enabled account.

## Files / areas

| Path | Change |
| --- | --- |
| `utils/authSchemas.ts` + `.test.ts` | + `twoFactorSchema` |
| `utils/twoFactorErrors.ts` + `.test.ts` | new - `twoFactorVerifyErrorMessage` |
| `utils/preAuthToken.ts` + `.test.ts` | new - single-use in-memory holder |
| `services/authApi.test.ts` | + one `verifyLogin2fa` case |
| `scenes/auth/SignIn.tsx` | mfa branch -> stash token + route to `/auth/verify-2fa` |
| `scenes/auth/VerifyTwoFactor.tsx` | new - TOTP screen |
| `scenes/auth/index.ts` | export `VerifyTwoFactor` |
| `app/(auth)/auth/verify-2fa.tsx` | new - route re-export |

`SignUp.tsx`, `VerifyOtp.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`,
`slices/*`, `app/*` (except the new route file), `OtpInput`, `authApi`,
`auth.slice`, `tokenStore` are consumed, not modified.

## Data / contracts

### Flow

| Screen | Call | Success -> |
| --- | --- | --- |
| SignIn (mfa branch) | `POST /auth/login` returns `{ mfaRequired, preAuthToken }` | `setPendingPreAuthToken`, `router.push('/auth/verify-2fa')` |
| VerifyTwoFactor | `verifyLogin2fa({ preAuthToken, code })` -> `SessionTokenPair` | `setTokens` + `sessionEstablished(user)` + `clearPendingPreAuthToken` + `router.replace('/home')` |

`res` from `verifyLogin2fa` is always the token-pair shape (no union to
narrow), per `auth.md`.

### `preAuthToken` holder (`utils/preAuthToken.ts`)

```ts
let pending: string | null = null;
export function setPendingPreAuthToken(token: string): void;   // SignIn on mfaRequired
export function getPendingPreAuthToken(): string | null;       // VerifyTwoFactor captures at mount (peek, no clear)
export function clearPendingPreAuthToken(): void;              // VerifyTwoFactor after a successful verify
```

- Same rationale and shape as 19f's `resetToken.ts` (not refactored into a
  shared factory - `resetToken.ts` already shipped standalone; a second
  15-line module is clearer than reworking merged code).
- In-memory for the life of the JS context. A cold restart loses it, which is
  correct: the `preAuthToken` has a 5-minute server lifetime anyway, and the
  user re-signs-in.
- The `preAuthToken` never enters a nav param, Redux, `AsyncStorage`, a log, or
  any rendered string.

### `twoFactorSchema`

| Field | Rule |
| --- | --- |
| `code` | trimmed, matches `/^\d{6}$/` (exactly 6 digits - backend `Login2faVerifyDto` length) |

### Error surface (VerifyTwoFactor)

| Condition | Shown as |
| --- | --- |
| `AUTH_MFA_INVALID_CODE` | inline on the `code` field: "That code is incorrect." |
| `AUTH_TOKEN_INVALID` / `NOT_FOUND` | form-level: "Your sign-in session expired. Go back and sign in again." |
| `AUTH_MFA_REQUIRED` | form-level: "Two-factor sign-in is not set up for this account." |
| `ACCOUNT_SUSPENDED` / `ACCOUNT_DEACTIVATED` (403) | form-level, fixed copy per code |
| `RATE_LIMITED` | form-level: "Too many attempts. Wait a minute and try again." |
| `NETWORK_ERROR` | form-level: the standard network copy |
| missing `preAuthToken` at mount | the same "session expired" form-level message, button disabled |
| anything else | form-level: `err.message` or generic |

- The `code` field error clears on the next edit (RHF default). The `root`
  error clears on the next submit; also `clearErrors('root')` at the top of
  `onSubmit`.
- No error message contains a token, the TOTP code, or the password.

### Trusted values

- `preAuthToken` is server-issued, opaque, single-use, 5-minute; it travels
  only through the in-memory holder.
- `code` is the 6 digits the user typed, schema-checked before the request.
- The token pair from `verifyLogin2fa` is written only to `tokenStore`.

## Testing

Jest (`jest-expo`) + `@jest/globals`. No screen tests for `SignIn` /
`VerifyTwoFactor` (`coding-standards.md`: screen integration, and this one
needs a 2FA-enabled backend account). The mutation is covered in
`services/authApi.test.ts`.

- `utils/authSchemas.test.ts` (+3): `twoFactorSchema` accepts `'123456'`,
  rejects `'12345'`, rejects `'12345a'`.
- `utils/twoFactorErrors.test.ts` (~9): one assertion per mapper branch,
  including non-`ApiError` and the unknown-code fallthrough.
- `utils/preAuthToken.test.ts` (~3): set then get (twice - peek does not
  clear); clear nulls it; get before set is `null`.
- `services/authApi.test.ts` (+1): `verifyLogin2fa` token-pair round trip,
  URL, `skipAuth`.

Predicted: 2 new suites (~12 cases), ~4 added cases across two existing suites.
Existing suites stay green.

## Notes for the AI

- `res` from `verifyLogin2fa` is `SessionTokenPair` outright - do not add a
  `'token' in res` guard, `auth.md` says this route always returns the pair.
- `getPendingPreAuthToken` must not clear on read (React strict mode
  double-invokes `useState` initializers in dev). Only `clearPendingPreAuthToken`
  clears, and only after a successful verify.
- The `SignIn` diff is exactly the three-line mfa branch swap plus one import.
  The token-pair branch, `applyApiError` catch, layout, and `testID`s are
  untouched.
- `VerifyTwoFactor` establishes the session and navigates to `/home` - the
  same as a normal login. No profile-verification detour (that is 19e's, for
  fresh registration only).
- `dispatch` and `sessionEstablished` come from `useAuthSlice()`.
- Reuse the `VerifyOtp` screen structure for visual consistency; a single
  `ControlledTextField` replaces the `OtpInput`.
- Branch on `ApiError.code`, never `.message` (except as the last-resort
  display string).
- No `console.*`. No em dashes, en dashes, or ellipsis characters
  (`coding-standards.md`).

## Manual try path (for `/check`, not this skill)

Requires a backend account with a second factor enrolled (via the web app or a
direct `POST /auth/2fa/setup` + `POST /auth/2fa/enable` against the API).

1. Sign In with that account's email + password -> `POST /auth/login` returns
   `{ mfaRequired, preAuthToken }` -> land on the Two-Factor Verification
   screen.
2. Enter the current 6-digit code from the authenticator app -> Verify ->
   `POST /auth/login/2fa/verify` returns the token pair -> land on `/home`;
   relaunch stays signed in.
3. Enter a wrong 6-digit code -> "That code is incorrect." on the field, no
   navigation.
4. Wait 5+ minutes, then verify -> "Your sign-in session expired. Go back and
   sign in again."; the back button returns to Sign In.
5. Open `/auth/verify-2fa` directly (no `preAuthToken`) -> the same expired
   message, button disabled.

## Open questions

None blocking. Recorded decisions: the TOTP code uses a single numeric
`TextField` (a 6-box `OtpInput` overflows); the `preAuthToken` travels through
an in-memory holder (mirrors 19f's `resetToken`); `AUTH_MFA_INVALID_CODE` shows
on the `code` field, every other error is form-level; no Figma design exists so
the screen reuses the auth-screen component family.
