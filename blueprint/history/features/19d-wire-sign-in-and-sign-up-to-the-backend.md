# 19d - Wire Sign In + Sign Up to the backend

> Archived by `/complete`. Fourth leaf of build-plan item 19
> ("Real authentication + route guarding").

**Note:** Mobile app is `creator`-only. Registration always sends
`roleKey: 'creator'`. The MFA-code branch of login is coded but unreachable
(creator role has `requires2fa: false`).

**Branch:** `feature/wire-sign-in-and-sign-up-to-the-backend`

**Status:** verified - steps 1-4 complete (`npx tsc --noEmit` clean, `npm run
lint` clean, `npm test` green at 80 suites / 247 tests). Step 5 (manual auth
check against a running backend) was explicitly waived by the user before merge;
`uiEvidence: when-available` and no dev server was run. The scene wiring
(`SignIn.tsx`, `SignUp.tsx`, `SignInLanding.tsx`) rests on the thunk unit tests
+ code review only - confirm at runtime via `/try latest` or during 19c.

**Stacks on:** 19a + 19b (on `feat/creator-auth`). Branched from
`feat/creator-auth`. Imports `services/auth.service` (`login`, `register`,
`getMe`), `services/tokenStore`, and the 19b session slice/thunks.

## Goal

Make Sign In and Sign Up actually authenticate against the backend: real
`POST /auth/login` and `POST /auth/register` (then auto-`login`), a full
`AuthAccount` from `GET /auth/me`, `sessionAuthenticated` dispatched, tokens
and account persisted, and envelope-`code`-driven inline errors. No OTP step
(that flow is 19e). No route guards yet (19c).

Backend contracts (from 19a's packet, read-only):
`../backend/docs/Implementations/GROUP_A_PUBLIC_AUTH.md` (register, login),
`GROUP_B_OWN_ACCOUNT.md` (`GET /auth/me`), `_CONVENTIONS.md` (error catalog).

## In scope

- `slices/app.thunks.ts` - add `signIn()` and `signUp()` thunks.
- `slices/index.ts` - export them.
- `utils/authError.ts` (new) - map an `ApiError` to a user-facing message and
  per-field errors.
- `scenes/auth/SignIn.tsx` - call `signIn`, loading state, inline errors,
  navigate to `/home` on success. Remove the seeded default field values.
- `scenes/auth/SignUp.tsx` - call `signUp`, loading state, inline errors,
  navigate to `/profile-verification/date-of-birth` on success. Password
  minimum 6 -> 8. Remove the seeded defaults.
- `scenes/auth/SignInLanding.tsx` - remove the "Skip to Home" `<Link>`.
- Unit tests for `authError`, `signIn`, `signUp`.

## Out of scope

- `VerifyOtp`, `ForgotPassword`, `ResetPassword` - **19e**, blocked on the
  backend registration-OTP + email-delivery fix. The "Forgot password?" link
  on Sign In still routes to the (unchanged, still-stub) `ForgotPassword`
  screen.
- Route `_layout` guards, `app/index.tsx` routing - **19c**.
- Social sign-in buttons (Instagram/Facebook/Google) - no OAuth backend; they
  keep routing to the email Sign In screen.
- Sending `fullName` or `phone` at registration - `POST /auth/register` has no
  name field and takes one identifier; both are captured into the profile in
  feature 21 (see Open questions).
- Handling the emailed verification link / deep links - feature 23.
- `GET /profiles/me`, migrating Profile/EditProfile off the compat `user`
  field - feature 21.
- A real MFA code screen - the branch is dead for a creator-only app.

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
build all steps in one pass, one review packet. `/complete` makes the commit.

Per-step gates: `npx tsc --noEmit`, `npm test` (logic steps ship passing
tests), `npm run lint`. `verification.uiEvidence: "when-available"` - the scene
wiring is verified by the user-run manual check in the last step, not by scene
tests (coding-standards: no scene-integration tests).

## Build steps

- [x] 1. **Error mapping.** Add `utils/authError.ts`:
     `authErrorMessage(err: ApiError): string` (table in Data / contracts) and
     `authErrorFieldErrors(err: ApiError): Record<string, string>` (pulls
     `email` / `password` / `phone` keys out of `err.errors`, humanized). Add
     `utils/authError.test.ts`.
     **Done when:** tests cover every mapped `code` plus the unmapped-default,
     and field extraction for a 409 and a 422; `npm test` green;
     `npx tsc --noEmit` clean.

- [x] 2. **signIn / signUp thunks.** Add to `slices/app.thunks.ts` per the
     algorithms in Data / contracts. Both return a result object (never throw).
     Export from `slices/index.ts`. Extend `slices/app.thunks.test.ts`.
     **Done when:** thunk tests cover `signIn` ok / `mfa` / `AUTH_INVALID_CREDENTIALS`
     and `signUp` ok / `ALREADY_EXISTS`, asserting `sessionAuthenticated`,
     `setTokens`, `setStoredAccount` on the ok paths (`@/services` mocked, real
     store per test); `npm test` green; `npx tsc --noEmit` clean.

- [x] 3. **Wire Sign In.** `scenes/auth/SignIn.tsx`: local `submitting` state,
     `dispatch(signIn({ identifier, password }))`, `isLoading` on the button,
     a form-level error `<Text>` plus field errors from the result, and
     `router.replace('/home')` only on `status: 'ok'`. Keep a light client
     pre-check (email format, both fields non-empty); let the backend own
     password length. Remove the `'test@example.com'` / `'pass1234'` seeds.
     **Done when:** `npx tsc --noEmit` + `npm run lint` clean; `npm test` green;
     behavior confirmed in step 5.

- [x] 4. **Wire Sign Up + landing.** `scenes/auth/SignUp.tsx`: same pattern,
     `dispatch(signUp({ email, phone, password }))`, `MIN_PASSWORD_LENGTH = 8`,
     remove seeds, `router.replace('/profile-verification/date-of-birth')` on
     `status: 'ok'`. `scenes/auth/SignInLanding.tsx`: delete the "Skip to Home"
     `<Link>` and its wrapper.
     **Done when:** `npx tsc --noEmit` + `npm run lint` clean; `npm test` green;
     behavior confirmed in step 5.

- [x] 5. **Manual auth check (user-run).** Ships no code. With `npm run dev`
     against a running backend, confirm: (a) Sign Up a new creator email ->
     lands on `/profile-verification/date-of-birth`, and a relaunch boots
     straight past onboarding (session persisted by 19b); (b) Sign In with
     those credentials -> `/home`; (c) wrong password -> "Incorrect email or
     password." inline, no navigation; (d) re-register the same email ->
     "An account with this email already exists." on the email field; (e) the
     Sign In button shows a spinner while the request is in flight.
     **Done when:** the user reports these, or explicitly waives the check.
     **Outcome:** explicitly waived by the user at `/complete` (no dev server
     run). Confirm at runtime via `/try latest` or during 19c.

## Files / areas

| Path | Change |
| --- | --- |
| `utils/authError.ts` + `.test.ts` | new - `ApiError` -> message / field errors |
| `slices/app.thunks.ts` | add `signIn`, `signUp` |
| `slices/app.thunks.test.ts` | extend |
| `slices/index.ts` | export the two thunks |
| `scenes/auth/SignIn.tsx` | call `signIn`; loading; errors; nav; drop seeds |
| `scenes/auth/SignUp.tsx` | call `signUp`; min-8; loading; errors; nav; drop seeds |
| `scenes/auth/SignInLanding.tsx` | remove "Skip to Home" link |

`components/elements/Button` already has `isLoading` + `ActivityIndicator` - no
change. `scenes/auth/VerifyOtp.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`
untouched.

## Data / contracts

### `signIn(input: { identifier: string; password: string })`

`AppThunk<Promise<AuthResult>>` where
`AuthResult = { status: 'ok' } | { status: 'mfa-unsupported' } | { status:
'error'; message: string; fieldErrors: Record<string, string> }`.

1. `const result = await login(input)` (19a service).
2. `result.status === 'mfa'` -> return `{ status: 'mfa-unsupported' }`.
3. `result.status === 'ok'`:
   - `const account = await getMe(result.tokens.token)` (full `AuthAccount`).
   - `await setTokens(result.tokens)`, `await setStoredAccount(account)`.
   - `dispatch(sessionAuthenticated({ account, tokens: result.tokens }))`.
   - return `{ status: 'ok' }`.
4. Any `ApiError` from `login` or `getMe` -> return
   `{ status: 'error', message: authErrorMessage(err), fieldErrors:
   authErrorFieldErrors(err) }`.
5. A non-`ApiError` throw propagates to the thunk's outer `catch` ->
   `{ status: 'error', message: authErrorMessage(<synthetic UNKNOWN>),
   fieldErrors: {} }`.

The `login -> getMe -> persist -> dispatch` tail is the `fetchAndPersist`
helper, which mirrors `refreshAndFetch` in the same module.

### `signUp(input: { email: string; phone?: string; password: string })`

Same `status` shape as `AuthResult` (`mfa` mapped to an `error` result, not
`mfa-unsupported`).

1. `await register({ roleKey: 'creator', email: input.email.trim(), password:
   input.password })` - **`phone` is not sent** (accepted in the signature for
   feature 21; see Out of scope / Open questions).
2. On 201 success: `const r = await login({ identifier: input.email.trim(),
   password: input.password })`. `r.status` is always `'ok'` here (a
   just-created creator has no 2FA); if it is somehow `'mfa'`, return
   `{ status: 'error', message: 'This account needs two-factor authentication,
   which the app does not support yet.', fieldErrors: {} }`.
3. `getMe` -> `setTokens` -> `setStoredAccount` ->
   `dispatch(sessionAuthenticated(...))` -> `{ status: 'ok' }`.
4. `ApiError` -> `{ status: 'error', message, fieldErrors }`. A `409
   ALREADY_EXISTS` yields `fieldErrors.email`.

### `authErrorMessage(err: ApiError): string`

| `err.code` | message |
| --- | --- |
| `AUTH_INVALID_CREDENTIALS` | Incorrect email or password. |
| `ALREADY_EXISTS` | An account with this email already exists. |
| `ACCOUNT_SUSPENDED` | This account has been suspended. Contact support. |
| `ACCOUNT_DEACTIVATED` | This account has been deactivated. |
| `ACCOUNT_PENDING_VERIFICATION` | This account is not active yet. |
| `RATE_LIMITED` | Too many attempts. Please wait a moment and try again. |
| `NETWORK_ERROR` | Cannot reach the server. Check your connection and try again. |
| `VALIDATION_FAILED` | first value of `err.errors`, else "Please check the form and try again." |
| anything else (incl. `INTERNAL_ERROR`, `UNKNOWN`) | Something went wrong. Please try again. |

### `authErrorFieldErrors(err: ApiError): Record<string, string>`

`err.errors` is `Record<string,string> | null`. Returns a new object keeping
only the `email`, `password`, and `phone` keys: a known backend token
(`emailAlreadyExists` -> "An account with this email already exists.",
`phoneAlreadyExists` -> "An account with this phone number already exists.",
`phoneOrEmailRequired` -> "Enter an email address.") maps to a sentence; any
other value (e.g. "must be longer than or equal to 8 characters") passes
through unchanged. `null` -> `{}`.

### Backend request shapes (do not re-derive)

- `POST /auth/login` body `{ identifier, password }`. 200 token-pair or 200
  `{ mfaRequired, preAuthToken }`; 401 `AUTH_INVALID_CREDENTIALS`; 403
  `ACCOUNT_*`; 422; 429.
- `POST /auth/register` body `{ roleKey: 'creator', email, password }`.
  201 `data: null`; 409 `ALREADY_EXISTS` (`errors.email` / `errors.phone`);
  422 `VALIDATION_FAILED` (password `>= 8`, `roleNotAllowed`,
  `phoneOrEmailRequired`).
- `GET /auth/me` -> `AuthAccount` (19b type).

## Testing

Jest + `@jest/globals`; `jest.mock('@/services/auth.service')` /
`jest.mock('@/services/tokenStore')`; real `configureStore` per thunk test.

- `utils/authError.test.ts` (new) - `authErrorMessage` for each mapped row, the
  `VALIDATION_FAILED` first-error and no-errors fallback, an unmapped code, and
  an unknown server code; `authErrorFieldErrors` for `{ email:
  'emailAlreadyExists' }`, a class-validator password string, a non-auth key
  that must be dropped, and `null`. 15 cases.
- `slices/app.thunks.test.ts` (extended) - `signIn`: ok (asserts `login` args,
  `getMe` with the access token, `setTokens` / `setStoredAccount` /
  `sessionAuthenticated`, returns `{ status: 'ok' }`), `mfa` ->
  `{ status: 'mfa-unsupported' }` with no session change, `login` throws
  `AUTH_INVALID_CREDENTIALS` -> `{ status: 'error' }` with the mapped message.
  `signUp`: register ok then login ok -> authenticated (asserts email trim);
  `register` throws `ALREADY_EXISTS` -> `{ status: 'error' }` with
  `fieldErrors.email`, `login` not called. 6 cases.

Scenes are not unit-tested. Net: 2 new suites + `app.thunks` extension, +20
cases (80 suites / 247 tests total).

## Notes for the AI

- Branch from `feat/creator-auth`; reuse 19a/19b, do not re-implement them.
- The thunks own the `login -> getMe -> persist -> dispatch` sequence, mirroring
  `bootstrapSession`. Scenes only dispatch and render the result.
- `login` returns `LoginAccount` (reduced); the slice needs `AuthAccount`, so
  `getMe` is always called after a successful `login`. Never pass `LoginAccount`
  to `sessionAuthenticated`.
- Branch on `ApiError.code`, never `message`.
- Do not `router.replace` before the thunk resolves `{ status: 'ok' }`.
- Keep the existing client-side field validation for instant feedback, but the
  backend is the authority - always surface its error too.
- No `console.log`. Match 19a/19b module style.
- Removing the seeded field defaults means the manual tester types real
  credentials; that is intended.

## Open questions

None block 19d. Carried forward:

1. **`fullName` at sign-up** is collected but unsent (`register` has no name
   field). It was already dropped in the mock flow. Feature 21 must capture it
   into the profile (`PATCH /profiles/me` / onboarding), or the sign-up form
   should stop collecting it.
2. **`phone` at sign-up** is collected and validated but unsent (`register`
   takes one identifier; email is used). `signUp` accepts `phone` in its
   signature but drops it. Feature 21 decides whether the form keeps requiring
   it and where it is persisted.
3. **Email verification.** `register` emails a verification link; the app does
   not handle it (deep links are feature 23). A `creator` stays `unverified`
   -> `pending` only if the link is opened, but both states can use the app,
   so 19d does not block on it. 19e's resend story and any in-app "verify your
   email" banner are separate.
