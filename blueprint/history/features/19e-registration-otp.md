# Feature: Registration OTP (19e)

**From build-plan:** feature 19e (fifth leaf of item 19, "Real creator
authentication (server-wired)")
**Status:** verified
**Branch:** `feature/registration-otp`

## Goal

Finish the sign-up flow: the `VerifyOtp` screen's **signup branch** verifies
the emailed code against `POST /auth/otp/verify` (`purpose: registration`),
which returns a token pair and creates the session. "Resend Code" calls
`POST /auth/otp/request`. On success the user proceeds into the existing
profile-verification wizard as an authenticated creator.

Only the signup branch (`flow` unset). The reset branch (`flow === 'reset'`)
stays on its mock path for 19f. No other screen changes; product screens stay
on `data/*.ts` fixtures.

## Backend contracts (implementation authority, read-only)

`../platform-context/api-contracts/auth.md`:

- **`POST /auth/otp/verify`** (`OtpVerifyDto`): `destination` (the email),
  `purpose: 'registration'`, `code` (4-8 chars). Response `data` for
  `registration`: `{ token, refreshToken, tokenExpires (epoch ms), user }` -
  a session is created, `status` moves `unverified -> pending`, the
  destination is stamped verified. Errors: `VALIDATION_FAILED` with
  `errors.code` = `'incorrect'` (wrong code) or `'invalidOrExpired'` (no active
  code); `NOT_FOUND` (no account for the destination); `RATE_LIMITED` (too many
  wrong attempts on this code).
- **`POST /auth/otp/request`** (`OtpRequestDto`): `destination`,
  `channel: 'email'`, `purpose: 'registration'`. Response `data: null`, always
  200 for a well-formed body (no account enumeration). Rate-limited per
  destination. Errors: `VALIDATION_FAILED`, `RATE_LIMITED`.
- Envelope (`README.md`): `errors` is field-keyed only for `VALIDATION_FAILED`.
  Branch on `ApiError.code` / `.errors.code`, never `.message`.

19b's `authApi` already exposes `useVerifyOtpMutation` / `useRequestOtpMutation`
and the `OtpVerifyRequest` / `OtpVerifyResponse` / `OtpRequestRequest` types.
Both calls are `skipAuth` (the 19a interceptor is not involved).

## The session-timing decision

`/auth/verify-otp` lives in the `(auth)/auth` route area. The 19c guard
redirects an **authenticated** user out of `(auth)/auth` to `/home`. So the
session must not be established while the user is still on this screen, or the
guard bounces them past profile-verification.

19e therefore establishes the session at the moment of leaving the screen: the
verify call succeeds, the token pair is held in a ref, the `SuccessSheet`
shows (user still unauthenticated), and only when the user proceeds from the
sheet does `setTokens` + `sessionEstablished` fire, in the same tick as
`router.replace('/profile-verification/date-of-birth')`. By the next render the
route is in `(auth)/profile-verification`, which the guard permits for an
authenticated user.

## In scope

- `scenes/auth/VerifyOtp.tsx` (signup branch only):
  - `useVerifyOtpMutation` / `useRequestOtpMutation` from `@/services`;
    `useAuthSlice` for `dispatch` + `sessionEstablished`; `setTokens` from
    `@/services`.
  - `handleVerify` signup branch: `await verifyOtp({ destination: email,
    purpose: 'registration', code }).unwrap()`; narrow the union with
    `'token' in res`; store `res` in a `useRef`; `setIsSuccessOpen(true)`. On
    error set a local `error` string via `otpVerifyErrorMessage`.
  - `SuccessSheet` `onButtonPress` **and** `onClose` both run one
    `proceedToProfileSetup()`: `await setTokens({ token, refreshToken,
    tokenExpires })` from the ref, `dispatch(sessionEstablished(user))`,
    `router.replace('/profile-verification/date-of-birth')`.
  - `handleResend`: `if (isResetFlow) { setCode(''); return; }` (unchanged for
    19f), else `await requestOtp({ destination: email, channel: 'email',
    purpose: 'registration' }).unwrap()`, then `setCode('')` and a transient
    `notice` ("A new code is on its way."). On error set `error` via
    `otpRequestErrorMessage`.
  - A local `error` (string | undefined) and `notice` (string | undefined),
    rendered between `OtpInput` and the resend line; `error` also drives
    `OtpInput`'s `error` prop (red boxes) and is cleared on the next code
    change; `notice` is cleared when `error` is set or the code changes.
  - Verify button `disabled` while `verifyOtp` is loading (in addition to the
    existing `!isComplete`); resend link is inert while `requestOtp` is
    loading.
  - Missing `email` on the signup branch: show a fixed `error`
    ("Something went wrong. Start sign-up again.") and keep Verify disabled.
- `utils/otpErrors.ts` (new) + test - `otpVerifyErrorMessage(err): string` and
  `otpRequestErrorMessage(err): string`. Pure.
- `services/authApi.test.ts` - add one `verifyOtp` case (posts to
  `/auth/otp/verify` with `skipAuth`, unwraps the token-pair `data`).

## Out of scope

- The reset branch (`flow === 'reset'`) of `handleVerify` and `handleResend`,
  and `ForgotPassword` / `ResetPassword` (19f).
- The `POST /auth/otp/request` that the initial sign-up triggers - the backend
  sends the first code as a side effect of `POST /auth/register` (19d). 19e's
  only `requestOtp` call is the manual "Resend Code".
- Phone-channel OTP. 19d's sign-up sends `email` only, so `channel: 'email'`
  and `destination: email` are fixed. A phone-registration path is a later
  concern.
- Changing `OTP_LENGTH` (stays 4, the backend default) or the `OtpInput`
  component.
- Auto-submitting when the 4th digit is entered; the explicit Verify button
  stays.
- A resend cooldown timer / countdown. The backend rate-limits; 19e surfaces
  `RATE_LIMITED` as a message.
- The business email-verification-link flow (`POST /profiles/me/verify-email`).
  The mobile app is creator-only.
- Any change to `profile-verification/*` screens, the session slice, route
  guards, or `app.slice`.
- Migrating the Profile screen off `app.slice.user` (still the 19b gap).

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
one pass, project compiles and tests green after each step, one review packet.
`/complete` makes the single feature commit and merges into `feat/server-auth`
after approval.

Gates (no `typecheck` script):

- `npx tsc --noEmit` clean
- `npm test` green (Jest; required for the `otpErrors` logic and the added
  `authApi` case)
- `npm run lint` clean (0 errors; the unrelated `app/_layout.tsx`
  exhaustive-deps warning stays)

`VerifyOtp`'s screen behavior (mutation dispatch, navigation, session write) is
screen integration - verified manually in `/check`, not by a brittle test
(`coding-standards.md`). No dev server in the automated evidence.

## Build steps

- [x] **Step 1 - `otpErrors` helper + tests.** `utils/otpErrors.ts`:

  ```ts
  export function otpVerifyErrorMessage(err: unknown): string;
  export function otpRequestErrorMessage(err: unknown): string;
  ```

  `otpVerifyErrorMessage`: not an `ApiError` -> generic; `code ===
  'VALIDATION_FAILED'` and `errors?.code === 'incorrect'` -> "The code you
  entered is incorrect."; `errors?.code === 'invalidOrExpired'` -> "That code
  has expired. Request a new one."; `code === 'NOT_FOUND'` -> "We could not
  find an account for that email."; `code === 'RATE_LIMITED'` -> "Too many
  attempts. Wait a minute and try again."; `code === 'NETWORK_ERROR'` ->
  "Cannot reach the server. Check your connection and try again."; else ->
  `err.message` or generic.
  `otpRequestErrorMessage`: `RATE_LIMITED` -> "You are requesting codes too
  fast. Wait a minute."; `NETWORK_ERROR` -> the same network copy; not an
  `ApiError` or anything else -> generic.
  Add `utils/otpErrors.test.ts`.
  *Done when:* tests cover each branch of both functions (~9 cases);
  `npm test` green; `npx tsc --noEmit` clean.

- [x] **Step 2 - `authApi` verifyOtp coverage.** In `services/authApi.test.ts`
  add: `verifyOtp` with `{ destination, purpose: 'registration', code }`
  resolves the token-pair `data`, posts to `/auth/otp/verify`, and sends
  `skipAuth` with no `Authorization` header.
  *Done when:* the new case passes; `npm test` green.

- [x] **Step 3 - wire the signup branch of `VerifyOtp`.** Apply the In-scope
  changes to `scenes/auth/VerifyOtp.tsx`. Keep the `isResetFlow` branch of
  `handleVerify` and `handleResend`, the title/description computation, the
  `AuthHeader`, `AuthTitleBlock`, and `OtpInput` exactly as they are. The
  `useRef` holds `SessionTokenPair | null`. `proceedToProfileSetup` is the
  single handler for both `SuccessSheet` `onButtonPress` and `onClose`.
  *Done when:* `npx tsc --noEmit` clean; `npm test` green; `npm run lint`
  clean; the manual path below works in `/check`.

## Files / areas

| Path | Change |
| --- | --- |
| `utils/otpErrors.ts` + `.test.ts` | new - two pure error-to-message mappers |
| `services/authApi.test.ts` | + one `verifyOtp` case |
| `scenes/auth/VerifyOtp.tsx` | signup branch wired to `verifyOtp` / `requestOtp` + session on proceed |

`ForgotPassword.tsx`, `ResetPassword.tsx`, `SignIn.tsx`, `SignUp.tsx`,
`slices/*`, `app/*`, `components/elements/OtpInput`, `SuccessSheet` are
untouched. `authApi`, `auth.slice`, `tokenStore` are consumed, not modified.

## Data / contracts

### Verify (signup branch)

| Step | Detail |
| --- | --- |
| Request | `verifyOtp({ destination: email, purpose: 'registration', code })` |
| Success `data` | `SessionTokenPair` (`{ token, refreshToken, tokenExpires, user }`) - narrow with `'token' in res` |
| Held in | a `useRef<SessionTokenPair \| null>` until the user proceeds |
| Session write | on `SuccessSheet` proceed only: `await setTokens({ token, refreshToken, tokenExpires })` then `dispatch(sessionEstablished(res.user))` then `router.replace('/profile-verification/date-of-birth')` |

If `res` is not a token pair (`!('token' in res)`), treat it as an unexpected
response: set the generic `error`, do not open the sheet.

### Resend

`requestOtp({ destination: email, channel: 'email', purpose: 'registration' })`
-> `data: null`. On resolve: `setCode('')`, `setNotice('A new code is on its
way.')`, clear `error`. The backend returns 200 even if the address has no
account (no enumeration), so a resolved call always shows the same notice.

### Error / notice surface

| Condition | Shown as |
| --- | --- |
| wrong code (`VALIDATION_FAILED` / `errors.code: 'incorrect'`) | inline `error`, red `OtpInput` boxes |
| expired code (`errors.code: 'invalidOrExpired'`) | inline `error` |
| `NOT_FOUND` | inline `error` |
| `RATE_LIMITED` (verify or resend) | inline `error` |
| `NETWORK_ERROR` | inline `error` |
| missing `email` param (signup branch) | fixed inline `error`, Verify stays disabled |
| resend succeeded | inline `notice` (not an error) |

`error` clears on the next `OtpInput` change; `notice` clears when `error` is
set or the code changes. Neither ever contains a token or the raw code.

### Trusted values

- `destination` is the `email` route param, itself set by 19d's Sign Up from
  the validated form. No user free-text reaches the request beyond the code
  digits and that email.
- `channel: 'email'` and `purpose: 'registration'` are literals.
- The token pair is written only to `tokenStore`; it is never rendered, logged,
  or placed in navigation params.

## Testing

Jest (`jest-expo`) + `@jest/globals`. No screen test for `VerifyOtp`
(`coding-standards.md`: screen integration is a dev-server check). The
mutations themselves are covered in `services/authApi.test.ts` (with the Step 2
addition).

- `utils/otpErrors.test.ts` (~9): `otpVerifyErrorMessage` for `incorrect`,
  `invalidOrExpired`, `NOT_FOUND`, `RATE_LIMITED`, `NETWORK_ERROR`,
  non-`ApiError`, unknown-code-with-message; `otpRequestErrorMessage` for
  `RATE_LIMITED`, `NETWORK_ERROR`, non-`ApiError`.
- `services/authApi.test.ts` (+1): `verifyOtp` token-pair round trip.

Predicted: 1 new suite (~9 cases) + 1 added case. Existing suites stay green.

## Notes for the AI

- Do not touch the `isResetFlow` code paths. 19f wires them; 19e's diff on the
  reset branch must be zero.
- Narrow `OtpVerifyResponse` with `'token' in res`, not a cast. The
  `registration` purpose always returns the token-pair member, but the
  compiler sees the union.
- Establish the session inside the `SuccessSheet` proceed handler, never in
  `handleVerify`. Establishing it earlier makes the 19c `(auth)/auth` guard
  redirect to `/home` before the user reaches profile-verification.
- `setTokens` updates its mirror synchronously but still `await` it before
  `router.replace` so the persisted write lands.
- Keep every existing element and the `email` param name so nothing else in
  the flow breaks.
- No `console.*`. No em dashes, en dashes, or ellipsis characters
  (`coding-standards.md`).
- `dispatch` and `sessionEstablished` come from `useAuthSlice()`.

## Manual try path (for `/check`, not this skill)

1. Sign Up (valid email + 8-char password) against a local backend -> land on
   `/auth/verify-otp` with the email shown -> enter the code from the server
   log -> Verify -> `SuccessSheet` "Account Created Successfully" -> proceed ->
   land on `/profile-verification/date-of-birth`, now authenticated; kill and
   relaunch -> `restoreSession` keeps you signed in (lands in the app or the
   wizard, not on `/onboarding`).
2. Enter a wrong code -> "The code you entered is incorrect.", boxes turn red,
   no navigation.
3. Wait past the code TTL, enter the old code -> "That code has expired.
   Request a new one."
4. Tap "Resend Code" -> "A new code is on its way."; a fresh code in the server
   log verifies.
5. Hammer "Resend Code" -> "You are requesting codes too fast. Wait a minute."

## Open questions

None blocking. Recorded decisions: `channel: 'email'` is hard-coded (sign-up is
email-only); the session is established on `SuccessSheet` proceed rather than on
verify (to stay clear of the 19c `(auth)/auth` guard); `SuccessSheet`'s pan-down
`onClose` proceeds like the button (an account was created, there is no cancel).
