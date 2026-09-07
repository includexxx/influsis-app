# 19e - Wire password reset

> Archived by `/complete`. Fifth leaf of build-plan item 19 ("Real
> authentication + route guarding"). Split from the old "OTP verification +
> password reset" item; registration OTP became **19f** (still blocked).

**Note:** Reached only by an unauthenticated user - the "Forgot password?" link
on Sign In. 19c's `(auth)` guard redirects an authenticated visitor to `/home`,
so these screens never run with a live session. The backend revokes every
session on a successful reset, so the flow always ends at Sign In.

**Branch:** `feature/wire-password-reset`

**Status:** verified - steps 1-4 complete (`npx tsc --noEmit` clean, `npm run
lint` clean, `npm test` green at 81 suites / 262 tests). Step 5 (manual
password-reset check against a backend that emails OTPs) was explicitly waived
by the user before merge; `uiEvidence: when-available` and no dev server was
run. The three scene wirings rest on the `otpErrorMessage` unit tests + code
review only - confirm at runtime via `/try latest`.

**Stacks on:** 19a-19d, all merged on `feat/creator-auth`. Branched from
`feat/creator-auth`. Reuses `services/auth.service` (`requestOtp`, `verifyOtp`,
`resetPassword` - all written in 19a) and `utils/authError`.

## Goal

Make the three-screen password-reset flow actually reset the password against
the backend:

1. **Forgot Password** - enter email -> `POST /auth/otp/request`
   (`channel: 'email'`, `purpose: 'password_reset'`) -> go to Verify OTP.
2. **Verify OTP** (reset branch) - enter the emailed 4-digit code ->
   `POST /auth/otp/verify` -> receive a `resetToken` -> go to Reset Password.
   "Resend Code" re-requests the OTP.
3. **Reset Password** - enter a new password (min 8) ->
   `POST /auth/reset-password` with the `resetToken` -> success sheet -> Sign
   In (all sessions were revoked server-side).

Envelope `code` / `errors` drive inline errors on every step. No session state
is touched - password reset is not a Redux concern.

Backend contract (read-only): `../platform-context/api-contracts/auth.md`
sections `POST /auth/otp/request`, `POST /auth/otp/verify`,
`POST /auth/reset-password`.

## In scope

- `utils/authError.ts` - add `otpErrorMessage(err: ApiError): string` for the
  OTP / reset-token error tokens; reuse `authErrorMessage` as the fallback.
- `utils/authError.test.ts` - cover `otpErrorMessage`.
- `scenes/auth/ForgotPassword.tsx` - call `requestOtp`, loading + inline error,
  navigate on success, remove the `'test@example.com'` seed.
- `scenes/auth/VerifyOtp.tsx` - **reset branch only**: call `verifyOtp`,
  loading + inline error, pass `resetToken` forward, wire "Resend Code" to
  `requestOtp`. The `signup` branch is left exactly as-is (dead until 19f) with
  a comment saying so.
- `scenes/auth/ResetPassword.tsx` - read the `resetToken` param, call
  `resetPassword`, `MIN_PASSWORD_LENGTH` 6 -> 8, loading + inline error, keep
  the existing success sheet -> `/auth/sign-in`.

## Out of scope

- **19f** - registration OTP and the `VerifyOtp` `signup` branch. Blocked on
  cross-repo Open Question #2 and backend registration-OTP issuance. Do not
  touch that branch beyond a clarifying comment.
- Any `slices/*` change. `resetPassword` returns `void`; the backend revokes
  sessions; a logged-out user has no session to update. `signIn` (19d) already
  handles the re-login.
- SMS / `channel: 'sms'` - the creator app authenticates by email; the contract
  notes SMS has no provider wired up anyway.
- An OTP expiry countdown or resend-cooldown timer - not in Figma, not built
  today; "Resend Code" just re-requests with no client-side throttle (the
  backend rate-limits per destination).
- Hardening how `resetToken` travels - it rides a router param the same way
  `email` does between these screens. It is single-use and short-lived; see
  Notes for the accepted residual risk.
- Changing `OTP_LENGTH` (stays 4; the backend accepts 4-8) or the `OtpInput`
  component.
- Route guards, deep links, `docs/screen/*` currency (19b/19c precedent).

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
build all steps in one pass, one review packet. `/complete` makes the commit.

Per-step gates: `npx tsc --noEmit`, `npm test` (step 1 ships passing tests),
`npm run lint`. `verification.uiEvidence: "when-available"` - the scene wiring
is verified by the user-run manual check in the last step, not by
scene-integration tests (coding-standards: no scene-integration tests).

## Build steps

- [x] 1. **OTP error mapping.** In `utils/authError.ts` add
     `otpErrorMessage(err: ApiError): string`:
     - `err.errors?.code === 'invalidOrExpired'` -> "This code has expired or is
       not valid. Request a new one."
     - `err.errors?.code === 'incorrect'` -> "That code is not correct."
     - `err.errors?.resetToken === 'invalidToken'` -> "This password reset has
       expired. Start over."
     - `err.code === 'NOT_FOUND'` -> the same string as `invalidOrExpired` (no
       account enumeration).
     - anything else -> `authErrorMessage(err)` (covers `RATE_LIMITED`,
       `NETWORK_ERROR`, `VALIDATION_FAILED` first-error, default).
     Extend `utils/authError.test.ts`.
     **Done when:** tests cover each branch above plus the `RATE_LIMITED` and
     unknown-code fall-throughs; `npm test` green; `npx tsc --noEmit` clean.

- [x] 2. **Wire Forgot Password.** `scenes/auth/ForgotPassword.tsx`: local
     `submitting` state, keep the client email-format pre-check, then
     `await requestOtp({ destination: email.trim(), channel: 'email', purpose:
     'password_reset' })`. On success `router.push({ pathname:
     '/auth/verify-otp', params: { email: email.trim(), flow: 'reset' } })`
     (unchanged target). On `ApiError` show a form-level `<Text>` error via
     `authErrorMessage`; a non-`ApiError` shows the generic message. `isLoading`
     on the button. Remove the `'test@example.com'` seed.
     **Done when:** `npx tsc --noEmit` + `npm run lint` clean; `npm test` green;
     behavior confirmed in step 5.

- [x] 3. **Wire Verify OTP (reset branch).** `scenes/auth/VerifyOtp.tsx`,
     `isResetFlow` path only:
     - `handleVerify` (when `isComplete`): `submitting` state, `const result =
       await verifyOtp({ destination: email, purpose: 'password_reset', code })`.
     - On `result.kind === 'reset'`: `router.replace({ pathname:
       '/auth/reset-password', params: { resetToken: result.resetToken } })`.
       (`result.kind` is always `'reset'` for this purpose; any other kind shows
       the generic error and does not navigate.)
     - On `ApiError`: inline error via `otpErrorMessage`; clear the entered code.
     - `handleResend`: `await requestOtp({ destination: email, channel: 'email',
       purpose: 'password_reset' })`, then clear the code; show its own inline
       error on failure. Disable "Resend Code" while that request is in flight.
     - `OtpInput` gets `error={!!error}`; the `Verify` button gets
       `isLoading={submitting}`.
     - Leave the entire `!isResetFlow` (signup) branch untouched; add a
       `// 19f: ... unreachable today` comment above it.
     **Done when:** `npx tsc --noEmit` + `npm run lint` clean; `npm test` green;
     the signup branch diff is comment-only; behavior confirmed in step 5.

- [x] 4. **Wire Reset Password.** `scenes/auth/ResetPassword.tsx`:
     - `const { resetToken } = useLocalSearchParams<{ resetToken?: string }>();`
     - `MIN_PASSWORD_LENGTH = 8`; keep the length + match client pre-checks.
     - If `resetToken` is missing (screen reached out of order), show a
       form-level error "Start the reset from the Forgot Password screen." and
       disable submit.
     - On submit: `submitting` state, `await resetPassword({ resetToken,
       newPassword: password })`. On success open the existing `SuccessSheet`
       (unchanged copy, button -> `router.replace('/auth/sign-in')`).
     - On `ApiError`: inline error via `otpErrorMessage` (handles
       `resetToken: invalidToken` and the too-short `newPassword` string);
       non-`ApiError` -> generic. `isLoading` on the button.
     - Stop passing `email` into this screen from step 3.
     **Done when:** `npx tsc --noEmit` + `npm run lint` clean; `npm test` green;
     behavior confirmed in step 5.

- [x] 5. **Manual reset check (user-run).** Ships no code. With `npm run dev`
     against a backend that delivers email OTPs, for a real creator account:
     (a) Forgot Password with that email -> Verify OTP screen; the code arrives
     by email.
     (b) Wrong code -> "That code is not correct." inline, no navigation.
     (c) "Resend Code" -> a new code arrives; the field clears.
     (d) Correct code -> Reset Password screen.
     (e) New password (>= 8) -> success sheet -> Sign In; signing in with the
     **new** password works and with the old one fails.
     (f) Forgot Password with an email that has no account -> still advances to
     Verify OTP (no enumeration), and an arbitrary code there fails cleanly.
     **Done when:** the user reports these, or explicitly waives the check.
     **Outcome:** explicitly waived by the user at `/complete` (no dev server
     run). Confirm at runtime via `/try latest`.

## Files / areas

| Path | Change |
| --- | --- |
| `utils/authError.ts` + `.test.ts` | add `otpErrorMessage` + tests |
| `scenes/auth/ForgotPassword.tsx` | call `requestOtp`; loading; error; drop seed |
| `scenes/auth/VerifyOtp.tsx` | reset branch: `verifyOtp` + resend; signup branch comment only |
| `scenes/auth/ResetPassword.tsx` | read `resetToken`; call `resetPassword`; min-8; loading; error |

No change to `slices/*`, `services/*` (19a already has the three functions),
`components/elements/OtpInput`, or `app/*`.

## Data / contracts

### `requestOtp(input: { destination; channel; purpose })` (19a)

`Promise<void>`. For this flow: `{ destination: <email>, channel: 'email',
purpose: 'password_reset' }`. Backend always returns 200 for a well-formed
request even if no account exists (no enumeration). Throws `ApiError` on
`VALIDATION_FAILED` (bad channel/purpose/destination) or `RATE_LIMITED`.

### `verifyOtp(input: { destination; purpose; code })` (19a)

`Promise<VerifyOtpResult>`. For `purpose: 'password_reset'` resolves
`{ kind: 'reset'; resetToken: string }`. Throws `ApiError`:
`VALIDATION_FAILED` with `errors.code` = `'invalidOrExpired'` (no active code)
or `'incorrect'` (wrong code); `NOT_FOUND` (no account for the destination);
`RATE_LIMITED` (too many wrong attempts).

### `resetPassword(input: { resetToken; newPassword })` (19a)

`Promise<void>`. Throws `ApiError`: `VALIDATION_FAILED` with
`errors.resetToken` = `'invalidToken'`, or a too-short `errors.newPassword`
string; `NOT_FOUND` (account gone). **On success the backend revokes every
session for the account** - the user must sign in again (the success sheet copy
"Please re-login to get started" already says this).

### `otpErrorMessage(err: ApiError): string`

| condition | message |
| --- | --- |
| `err.errors?.code === 'invalidOrExpired'` | This code has expired or is not valid. Request a new one. |
| `err.errors?.code === 'incorrect'` | That code is not correct. |
| `err.errors?.resetToken === 'invalidToken'` | This password reset has expired. Start over. |
| `err.code === 'NOT_FOUND'` | This code has expired or is not valid. Request a new one. |
| anything else | `authErrorMessage(err)` |

### Navigation params

- Forgot Password -> Verify OTP: `{ email, flow: 'reset' }` (unchanged).
- Verify OTP -> Reset Password: `{ resetToken }` (**was `{ email }`**).
- Reset Password success -> `/auth/sign-in` (unchanged).

Forgot Password uses `router.push` so the user can go back and correct the
email; Verify OTP and the success sheet use `router.replace` past a consumed
step.

## Testing

Jest + `@jest/globals`. Only `utils/authError.ts` gained tests - the scenes are
a 3-screen navigation flow (coding-standards: not unit-tested; verified by the
step 5 manual check, which was waived).

- `utils/authError.test.ts` (extended) - `otpErrorMessage` for
  `{ code: 'invalidOrExpired' }`, `{ code: 'incorrect' }`,
  `{ resetToken: 'invalidToken' }`, a bare `NOT_FOUND`, a `RATE_LIMITED`
  (delegates to `authErrorMessage`), and an unmapped code (default). 6 cases.

Net: `utils/authError.test.ts` grew 6 cases; no new suite. 81 suites / 256
tests -> 81 suites / 262 tests.

## Notes for the AI

- Branch from `feat/creator-auth`; 19a-19d are merged there. The three service
  functions already exist - do not re-implement or move them.
- Scenes call the `services/auth.service` functions directly (the sanctioned
  path; coding-standards only forbids calling `request()` / an API straight
  from a component). No thunk, no slice - nothing here changes session state.
- Branch on `ApiError.code` and `ApiError.errors`, never `message`.
- `err.errors` is `Record<string, string> | null` (see `services/http.ts`).
  Read `err.errors?.code` / `err.errors?.resetToken` defensively.
- `resetToken` travels as a router param, like `email` does today. Accepted
  residual risk: on the web target it is visible in navigation history state.
  It is single-use, expires quickly server-side, and only an unauthenticated
  user reaches these screens (19c). Not worth a slice or secure-store for a
  transient value; revisit only if the flow gains a step.
- Match the 19d scene error pattern: a form-level `<Text style={{ color:
  colors.error }}>` for the message, `TextField` / `OtpInput` `error` prop for
  the field, cleared on the next edit.
- Keep the existing client-side validation for instant feedback; the backend is
  the authority and its error is always surfaced too.
- No `console.log`. Match 19d module style.
- The `VerifyOtp` `signup` branch, `SuccessSheet` copy, and `AuthTitleBlock`
  copy are all unchanged.

## Open questions

None block 19e. Related, tracked elsewhere:

1. **Registration OTP (19f).** Whether sign-up becomes OTP-gated is cross-repo
   Open Question #2 in `../platform-context/open-questions.md` and is not
   resolved. 19e leaves the `VerifyOtp` signup branch untouched; 19f owns it
   once Product records the decision (promote to an ADR if it changes the
   flow) and the backend confirms registration-OTP issuance.
2. **`channel=email` delivery** is confirmed working per the product owner for
   the test environment, but `../platform-context/api-contracts/auth.md` still
   only documents the `channel=sms` server-log behavior. The backend team
   should update that contract note; not a 19e blocker.
