# Feature: Password reset wired (19f)

**From build-plan:** feature 19f (sixth leaf of item 19, "Real creator
authentication (server-wired)")
**Status:** verified
**Branch:** `feature/password-reset-wired`

## Goal

Wire the three password-reset screens to the real endpoints:

1. **ForgotPassword** - "Send" calls `POST /auth/otp/request`
   (`purpose: password_reset`), then routes to the OTP screen's reset branch.
2. **VerifyOtp (reset branch)** - "Verify" calls `POST /auth/otp/verify`
   (`purpose: password_reset`) for a `resetToken`, then routes to
   ResetPassword; "Resend Code" calls `POST /auth/otp/request`.
3. **ResetPassword** - "Reset Password" calls `POST /auth/reset-password` with
   the `resetToken`, then shows the existing "Reset Successfully" sheet ->
   Sign In.

Only the reset path. The signup branch of `VerifyOtp` (19e) is untouched
except that `handleResend` becomes purpose-aware. No `slice`, guard, or
`app.slice` change. Product screens stay on `data/*.ts` fixtures. `POST
/auth/reset-password` revokes every session server-side; the user is
unauthenticated throughout this flow anyway, so there is nothing local to
tear down.

## Backend contracts (implementation authority, read-only)

`../platform-context/api-contracts/auth.md`:

- **`POST /auth/otp/request`**: `{ destination, channel: 'email', purpose:
  'password_reset' }` -> `data: null`, always 200 for a well-formed body (no
  account enumeration). Errors: `VALIDATION_FAILED`, `RATE_LIMITED`.
- **`POST /auth/otp/verify`** (`OtpVerifyDto`): `{ destination, purpose:
  'password_reset', code (4-8) }` -> `data: { resetToken }`. Errors:
  `VALIDATION_FAILED` with `errors.code` = `'incorrect'` / `'invalidOrExpired'`;
  `NOT_FOUND` (no account for the destination); `RATE_LIMITED`.
- **`POST /auth/reset-password`** (`ResetPasswordDto`): `{ resetToken,
  newPassword (min 8) }` -> `data: null`. **Revokes every session for the
  account.** Errors: `VALIDATION_FAILED` with `errors.resetToken:
  'invalidToken'` or `errors.newPassword` (too short); `NOT_FOUND` (account for
  the token gone).
- Envelope (`README.md`): `errors` is field-keyed only for `VALIDATION_FAILED`.
  Branch on `ApiError.code` / `.errors[...]`, never `.message`.

Already built and reused: 19b `authApi`
(`useRequestOtpMutation` / `useVerifyOtpMutation` / `useResetPasswordMutation`,
all `skipAuth`); 19e `utils/otpErrors.ts`
(`otpVerifyErrorMessage` / `otpRequestErrorMessage`, both already cover
`incorrect` / `invalidOrExpired` / `NOT_FOUND` / `RATE_LIMITED` /
`NETWORK_ERROR`); 19d `utils/authSchemas.ts`, `utils/authFormErrors.ts`
(`applyApiError`), `components/elements/ControlledTextField`.

## In scope

- `utils/authSchemas.ts` - add `forgotPasswordSchema` (`email`) and
  `resetPasswordSchema` (`newPassword` min 8 + `confirmPassword` match), plus
  the inferred `ForgotPasswordValues` / `ResetPasswordValues` types. Extend the
  test.
- `utils/resetToken.ts` (new) + test - a single-use in-memory holder:
  `setPendingResetToken(t)`, `getPendingResetToken(): string | null`,
  `clearPendingResetToken()`. Keeps the `resetToken` out of navigation params
  (and, on web, out of the URL).
- `services/authApi.test.ts` - add one `resetPassword` case.
- `scenes/auth/ForgotPassword.tsx` - `useForm(zodResolver(forgotPasswordSchema))`
  + `ControlledTextField` + `useRequestOtpMutation`; on success
  `router.push({ pathname: '/auth/verify-otp', params: { email, flow: 'reset' } })`;
  on error `setError('root', { message: otpRequestErrorMessage(err) })`. Button
  `isLoading`. Keep `AuthHeader`, `AuthTitleBlock`, copy, `testID`.
- `scenes/auth/VerifyOtp.tsx` - fill the reset branch of `handleVerify`:
  `verifyOtp({ destination: email, purpose: 'password_reset', code })`, narrow
  with `'resetToken' in res`, `setPendingResetToken(res.resetToken)`,
  `router.replace({ pathname: '/auth/reset-password', params: { email } })`; on
  error `setError(otpVerifyErrorMessage(err))`. Make `handleResend`
  purpose-aware (`isResetFlow ? 'password_reset' : 'registration'`) and drop
  its `isResetFlow` early return. `missingEmail` becomes `!email` (both flows),
  with flow-aware copy.
- `scenes/auth/ResetPassword.tsx` -
  `useForm(zodResolver(resetPasswordSchema))` + two `ControlledTextField` +
  `useResetPasswordMutation`; `const [resetToken] = useState(getPendingResetToken)`;
  on submit `resetPassword({ resetToken, newPassword }).unwrap()` ->
  `clearPendingResetToken()` -> `setIsSuccessOpen(true)`; the `SuccessSheet`
  ("Reset Successfully" -> Sign In) is unchanged. Errors: an invalid/expired
  token (`NOT_FOUND` or `errors.resetToken`) -> a fixed `root` message ("This
  reset link has expired. Start the reset again."), otherwise
  `applyApiError(err, setError, ['newPassword'])`. If `resetToken` is missing
  at mount, show that fixed message and disable the button. Button `isLoading`.
  Keep `AuthHeader`, `AuthTitleBlock`, copy, `testID`s.

## Out of scope

- Login second factor and `POST /auth/login/2fa/verify` (19g).
- The signup branch of `VerifyOtp` (19e) beyond the shared `handleResend`
  purpose switch.
- `OtpInput` / `OTP_LENGTH` (stays 4).
- Phone-channel reset (`channel: 'email'` fixed - the reset email is the only
  destination the UI collects).
- Enforcing "new password must differ from the old one" client-side. The
  screen copy stays; the backend owns that rule if any.
- A resend cooldown timer / countdown (the backend rate-limits; 19f surfaces
  `RATE_LIMITED`).
- Any `slice`, route guard, `app.slice`, or `tokenStore` change. Reset never
  establishes a session; the user signs in fresh afterward.
- Migrating the Profile screen off `app.slice.user` (still the 19b gap).

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
one pass, project compiles and tests green after each step, one review packet.
`/complete` makes the single feature commit and merges into `feat/server-auth`
after approval.

Gates (no `typecheck` script):

- `npx tsc --noEmit` clean
- `npm test` green (Jest; required for the schema, `resetToken`, and added
  `authApi` logic)
- `npm run lint` clean (0 errors; the unrelated `app/_layout.tsx`
  exhaustive-deps warning stays)

The three screens' submit/navigation behavior is screen integration - verified
manually in `/check`, not by a brittle test (`coding-standards.md`). No dev
server in the automated evidence.

## Build steps

- [x] **Step 1 - schemas + `resetToken` holder + tests.**
  - `utils/authSchemas.ts`: add `forgotPasswordSchema = z.object({ email:
    z.string().trim().email('Enter a valid email') })` and
    `resetPasswordSchema = z.object({ newPassword: z.string().min(8, 'Must be
    at least 8 characters'), confirmPassword: z.string() }).refine(d =>
    d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message:
    'Passwords do not match' })`; export `ForgotPasswordValues` /
    `ResetPasswordValues`. Extend `utils/authSchemas.test.ts`.
  - `utils/resetToken.ts`: module-level `let pending: string | null = null`;
    `setPendingResetToken`, `getPendingResetToken`, `clearPendingResetToken`.
    Add `utils/resetToken.test.ts`.
  *Done when:* tests cover the two new schemas (valid, invalid email, password
  < 8, mismatch) and the holder (set-then-get, clear nulls it, get before set
  is null); `npm test` green; `npx tsc --noEmit` clean.

- [x] **Step 2 - `authApi` resetPassword coverage.** In
  `services/authApi.test.ts` add: `resetPassword({ resetToken, newPassword })`
  posts to `/auth/reset-password` with `skipAuth`, no `Authorization` header,
  and resolves `null`.
  *Done when:* the case passes; `npm test` green.

- [x] **Step 3 - wire `ForgotPassword`.** Replace the `useState` block with
  `useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema),
  defaultValues: { email: '' } })` and `const [requestOtp, { isLoading }] =
  useRequestOtpMutation()`. One `ControlledTextField` (`name="email"`,
  `testID="forgot-password-email"`). `onSubmit`:

  ```ts
  clearErrors('root');
  try {
    await requestOtp({ destination: values.email.trim(), channel: 'email', purpose: 'password_reset' }).unwrap();
    router.push({ pathname: '/auth/verify-otp', params: { email: values.email.trim(), flow: 'reset' } });
  } catch (err) {
    setError('root', { message: otpRequestErrorMessage(err) });
  }
  ```

  Render `formState.errors.root?.message`; `Button` gets `isLoading` and
  `onPress={handleSubmit(onSubmit)}`.
  *Done when:* `npx tsc --noEmit` clean; `npm test` green; `npm run lint`
  clean; manual path below works in `/check`.

- [x] **Step 4 - wire `VerifyOtp` reset branch.** In `scenes/auth/VerifyOtp.tsx`:
  - `handleVerify` reset branch (replace the bare `router.replace`):

    ```ts
    if (isResetFlow) {
      if (!email) { setError('Something went wrong. Start the password reset again.'); return; }
      setError(undefined);
      setNotice(undefined);
      try {
        const res = await verifyOtp({ destination: email, purpose: 'password_reset', code }).unwrap();
        if (!('resetToken' in res)) { setError('Something went wrong. Please try again.'); return; }
        setPendingResetToken(res.resetToken);
        router.replace({ pathname: '/auth/reset-password', params: { email } });
      } catch (err) {
        setError(otpVerifyErrorMessage(err));
      }
      return;
    }
    ```

  - `handleResend`: drop the `if (isResetFlow) { setCode(''); return; }` early
    return; compute `const purpose = isResetFlow ? 'password_reset' :
    'registration'` and call `requestOtp({ destination: email, channel:
    'email', purpose })`.
  - `const missingEmail = !email;` and
    `const displayError = missingEmail ? (isResetFlow ? 'Something went wrong.
    Start the password reset again.' : 'Something went wrong. Start sign-up
    again.') : error;`
  - Import `setPendingResetToken` from `@/utils/resetToken`.
  Do not touch `proceedToProfileSetup`, the signup branch of `handleVerify`,
  the `SuccessSheet` block, or the render tree beyond what `missingEmail` /
  `displayError` already drive.
  *Done when:* `npx tsc --noEmit` clean; `npm test` green; `npm run lint`
  clean; the signup flow still behaves as in 19e; manual reset path works in
  `/check`.

- [x] **Step 5 - wire `ResetPassword`.** Replace the `useState` block with
  `useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema),
  defaultValues: { newPassword: '', confirmPassword: '' } })`,
  `const [resetPassword, { isLoading }] = useResetPasswordMutation()`, and
  `const [resetToken] = useState(getPendingResetToken)`. Two
  `ControlledTextField` (`testID`s `reset-password-new` /
  `reset-password-confirm`). `const tokenMissing = !resetToken;`
  `onSubmit`:

  ```ts
  if (!resetToken) return;
  clearErrors('root');
  try {
    await resetPassword({ resetToken, newPassword: values.newPassword }).unwrap();
    clearPendingResetToken();
    setIsSuccessOpen(true);
  } catch (err) {
    if (err instanceof ApiError && (err.code === 'NOT_FOUND' || !!err.errors?.resetToken)) {
      setError('root', { message: 'This reset link has expired. Start the reset again.' });
      return;
    }
    applyApiError(err, setError, ['newPassword']);
  }
  ```

  Render `tokenMissing ? 'This reset link has expired. Start the reset again.'
  : formState.errors.root?.message`; `Button` gets `isLoading` and
  `disabled={tokenMissing}`. `SuccessSheet` block unchanged. Import `ApiError`
  from `@/services`, `applyApiError` from `@/utils/authFormErrors`,
  `getPendingResetToken` / `clearPendingResetToken` from `@/utils/resetToken`.
  *Done when:* `npx tsc --noEmit` clean; `npm test` green; `npm run lint`
  clean; manual reset path works in `/check`.

## Files / areas

| Path | Change |
| --- | --- |
| `utils/authSchemas.ts` + `.test.ts` | + `forgotPasswordSchema`, `resetPasswordSchema` |
| `utils/resetToken.ts` + `.test.ts` | new - single-use in-memory `resetToken` holder |
| `services/authApi.test.ts` | + one `resetPassword` case |
| `scenes/auth/ForgotPassword.tsx` | RHF + `useRequestOtpMutation` -> verify-otp reset |
| `scenes/auth/VerifyOtp.tsx` | reset branch wired; `handleResend` purpose-aware |
| `scenes/auth/ResetPassword.tsx` | RHF + `useResetPasswordMutation` + `resetToken` holder |

`SignIn.tsx`, `SignUp.tsx`, `slices/*`, `app/*`, `OtpInput`, `SuccessSheet`,
`otpErrors.ts`, `authFormErrors.ts` are untouched. `authApi`, `tokenStore`
(none), `ControlledTextField` are consumed, not modified.

## Data / contracts

### Flow

| Screen | Call | Success -> |
| --- | --- | --- |
| ForgotPassword | `requestOtp({ destination: email, channel: 'email', purpose: 'password_reset' })` -> `null` | `/auth/verify-otp?flow=reset&email=` |
| VerifyOtp (reset) verify | `verifyOtp({ destination: email, purpose: 'password_reset', code })` -> `{ resetToken }` | `setPendingResetToken`, `/auth/reset-password?email=` |
| VerifyOtp (reset) resend | `requestOtp({ ..., purpose: 'password_reset' })` -> `null` | clears the code, shows the "new code" notice |
| ResetPassword | `resetPassword({ resetToken, newPassword })` -> `null` | `clearPendingResetToken`, "Reset Successfully" sheet -> `/auth/sign-in` |

### `resetToken` holder (`utils/resetToken.ts`)

```ts
let pending: string | null = null;
export function setPendingResetToken(token: string): void;   // VerifyOtp on verify success
export function getPendingResetToken(): string | null;       // ResetPassword captures at mount
export function clearPendingResetToken(): void;              // ResetPassword after a successful reset
```

- Not a `useState` initializer that clears on read (React strict mode
  double-invokes initializers in dev); `getPendingResetToken` is a pure peek,
  cleared explicitly on success.
- Lives only in memory for the life of the JS context. A cold app restart
  loses it, which is correct: the user would restart the reset flow.
- The `resetToken` never enters navigation params, Redux, `AsyncStorage`, a
  log, or any rendered string.

### zod schemas

| Field | Rule |
| --- | --- |
| forgot `email` | trimmed, valid email |
| reset `newPassword` | min 8 (backend `ResetPasswordDto`; the old mock used 6) |
| reset `confirmPassword` | equals `newPassword` (refine, error on `confirmPassword`) |

### Error surface

| Condition | Screen | Shown as |
| --- | --- | --- |
| `RATE_LIMITED` / `VALIDATION_FAILED` on request | ForgotPassword | form-level (`root`), via `otpRequestErrorMessage` |
| wrong / expired code | VerifyOtp reset | inline `error` (red `OtpInput` boxes), via `otpVerifyErrorMessage` |
| `NOT_FOUND` on verify | VerifyOtp reset | inline `error` |
| `RATE_LIMITED` on verify or resend | VerifyOtp reset | inline `error` |
| invalid / expired `resetToken` (`NOT_FOUND`, `errors.resetToken`) | ResetPassword | form-level: "This reset link has expired. Start the reset again." |
| `newPassword` server validation | ResetPassword | inline on the field (zod catches min-8 first) |
| missing `resetToken` at mount | ResetPassword | the same fixed form-level message, submit disabled |
| `NETWORK_ERROR` anywhere | that screen | its normal error slot, via the reused helpers |

No error message contains the code, a password, or the `resetToken`.

### Trusted values

- `destination` / `email` is the value the user typed into ForgotPassword,
  validated as an email, then carried by the `email` route param (not secret).
- `channel: 'email'` and every `purpose` are literals.
- `resetToken` is server-issued, single-use, short-lived; it travels only
  through the in-memory holder.

## Testing

Jest (`jest-expo`) + `@jest/globals`. No screen tests for the three scenes
(`coding-standards.md`: screen integration is a dev-server check). The
mutations are covered in `services/authApi.test.ts` (`requestOtp` from 19d,
`verifyOtp` from 19e, `resetPassword` added here).

- `utils/authSchemas.test.ts` (+4): `forgotPasswordSchema` valid / invalid
  email; `resetPasswordSchema` password < 8; `resetPasswordSchema` mismatch
  (error path is `confirmPassword`).
- `utils/resetToken.test.ts` (~3): set then get; clear nulls it; get before
  any set is `null`.
- `services/authApi.test.ts` (+1): `resetPassword` -> `null`, correct URL and
  `skipAuth`.

Predicted: 1 new suite (~3), ~5 added cases across two existing suites.
Existing suites stay green (the 19e signup-flow behavior must not regress).

## Notes for the AI

- Reuse `otpVerifyErrorMessage` / `otpRequestErrorMessage` verbatim - they
  already carry the exact copy for every OTP error the reset path can hit. Do
  not add a parallel helper.
- Narrow `OtpVerifyResponse` with `'resetToken' in res`, not a cast.
- `getPendingResetToken` must not clear on read. Only `clearPendingResetToken`
  clears, and only after a `resetPassword` success.
- The signup branch of `VerifyOtp` and `proceedToProfileSetup` must have a
  zero-behavior diff. The only shared change is `handleResend` becoming
  purpose-aware and `missingEmail` dropping its `!isResetFlow` guard.
- `applyApiError` is generic (`<N extends string>`); pass `setError` from
  `useForm` directly, `fields` as `['newPassword']`.
- Do not prefill any field (`defaultValues` are all `''`).
- Password min moves 6 -> 8 on ResetPassword to match `ResetPasswordDto`.
- No `console.*`. No em dashes, en dashes, or ellipsis characters
  (`coding-standards.md`).

## Manual try path (for `/check`, not this skill)

1. Sign In -> "Forgot password?" -> enter the account email -> Send ->
   `POST /auth/otp/request` (200) -> OTP screen (reset), "OTP Verification"
   title.
2. Enter the code from the server log -> Verify -> `POST /auth/otp/verify`
   returns `{ resetToken }` -> "Create New Password" screen.
3. Enter a 5-char password -> inline "Must be at least 8 characters", no
   request.
4. Enter matching 8+ char passwords -> Reset Password ->
   `POST /auth/reset-password` (200) -> "Reset Successfully" sheet -> Log in ->
   Sign In screen.
5. Sign in with the new password -> lands on `/home`. Sign in with the old
   password -> "The email or password is incorrect."
6. Wrong OTP -> "The code you entered is incorrect."; hammer "Resend Code" ->
   "You are requesting codes too fast."
7. Open `/auth/reset-password` directly (no token) -> "This reset link has
   expired. Start the reset again.", button disabled.

## Open questions

None blocking. Recorded decisions: `channel: 'email'` is hard-coded; the
`resetToken` travels through an in-memory holder rather than a nav param (keeps
it out of the web URL); `newPassword` min moves 6 -> 8; an invalid/expired
`resetToken` and a `NOT_FOUND` both map to one "start over" message.
