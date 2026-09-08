# Feature: Sign In + Sign Up wired (19d)

**From build-plan:** feature 19d (fourth leaf of item 19, "Real creator
authentication (server-wired)")
**Status:** verified
**Branch:** `feature/sign-in-sign-up-wired`

## Goal

Make the two entry forms talk to the real backend:

- **Sign In** submits `POST /auth/login`, and on the token-pair branch
  persists the pair (`tokenStore.setTokens`), establishes the Redux session
  (`sessionEstablished`), and lands on `/home`.
- **Sign Up** submits `POST /auth/register` with `roleKey: 'creator'` and, on
  success, moves the user to the OTP screen (`/auth/verify-otp`) where 19e
  finishes the flow.

Both forms move from ad-hoc `useState` + regex validation to
**react-hook-form + zod**, and both surface the envelope `code` and per-field
`errors` inline (field errors on the matching input, everything else as one
form-level message).

Out: the OTP verify/resend call (19e), password reset (19f), and the real
second-factor screen (19g - 19d only shows a message when `mfaRequired` comes
back). Every product screen still runs on `data/*.ts` fixtures.

## Backend contracts (implementation authority, read-only)

`../platform-context/api-contracts/auth.md`:

- **`POST /auth/register`** (`RegisterDto`): `roleKey` (`'creator'` here),
  exactly one of `email` / `phone`, `password` (min 8). Response `data: null`,
  201; a creator with `email` gets a numeric OTP mailed. Errors:
  `VALIDATION_FAILED` (password length, `phoneOrEmailRequired`,
  `roleNotAllowed`), `ALREADY_EXISTS` (`emailAlreadyExists` /
  `phoneAlreadyExists`).
- **`POST /auth/login`** (`LoginDto`): `identifier` (email or phone),
  `password` (min 1). Response is polymorphic:
  `{ token, refreshToken, tokenExpires, user }` **or**
  `{ mfaRequired: true, preAuthToken }`. Errors:
  `AUTH_INVALID_CREDENTIALS` (401); `ACCOUNT_SUSPENDED` /
  `ACCOUNT_DEACTIVATED` / `ACCOUNT_PENDING_VERIFICATION` (403);
  `VALIDATION_FAILED`.
- Envelope (`README.md`): `errors` is field-keyed **only** for
  `VALIDATION_FAILED` (`{ field: reason }`); `null` otherwise. Branch on
  `ApiError.code` / `.statusCode`, never `.message`.

The 19b `authApi` already exposes `useLoginMutation` / `useRegisterMutation`
and the `LoginResponse` / `RegisterRequest` types. The 19a interceptor is not
involved (both calls are `skipAuth`).

## In scope

- `package.json` / `package-lock.json` - add `react-hook-form`, `zod`,
  `@hookform/resolvers` (current stable majors; `/implement` records the
  resolved versions). The build-plan names all three for item 19.
- `jest.config.js` - add any of the three to `transformIgnorePatterns` only if
  a suite fails to parse them (same situation RTK hit in 19b).
- `utils/authSchemas.ts` (new) + test - `signInSchema` and `signUpSchema`
  (zod). Pure.
- `utils/authFormErrors.ts` (new) + test - `applyApiError(err, setError,
  fields)`: pushes a `VALIDATION_FAILED` field map onto matching RHF fields and
  maps the known `code`s to a single `root` message. Takes `setError` as an
  argument (no React import).
- `components/elements/ControlledTextField/` (new: `.tsx`, `index.ts`,
  `.test.tsx`) - a `Controller`-bound `TextField` (`control`, `name`, plus the
  `TextField` props); renders `fieldState.error?.message` through
  `TextField`'s existing `error` prop.
- `scenes/auth/SignIn.tsx` - `useForm(zodResolver(signInSchema))` +
  `useLoginMutation`; `ControlledTextField` for the two inputs; on the
  token-pair branch `await setTokens(...)`, `dispatch(sessionEstablished(user))`,
  `router.replace('/home')`; on `mfaRequired` a form-level "not yet supported"
  message; `catch` -> `applyApiError`. Button shows `isLoading`.
- `scenes/auth/SignUp.tsx` - `useForm(zodResolver(signUpSchema))` +
  `useRegisterMutation`; `ControlledTextField` for the five text inputs (the
  `CountryCodeSheet` + `phoneCountry` stay local `useState`); on success
  `router.push({ pathname: '/auth/verify-otp', params: { email } })`; `catch`
  -> `applyApiError`. Button shows `isLoading`.
- A form-level error `<Text>` on each screen bound to
  `formState.errors.root?.message`.

## Out of scope

- `POST /auth/otp/verify` / `otp/request` - the OTP entry, "Resend Code", and
  session creation on the registration branch (19e). 19d leaves the user on the
  existing `VerifyOtp` screen, which still runs its mock path until 19e.
- Password reset screens (19f).
- The real TOTP second-factor screen and `POST /auth/login/2fa/verify` (19g).
  19d detects `mfaRequired` and shows a form-level message; it does not
  navigate or build a screen.
- Sending `fullName` or `phone` to `/auth/register`. `RegisterDto` accepts
  neither and requires exactly one of email/phone. 19d validates both fields
  for UX parity with the current form and sends only
  `{ roleKey: 'creator', email, password }`. Capturing name/phone for the
  profile is a profiles-feature concern (`POST /profiles/onboarding-creator`,
  not built).
- Phone-based login. `LoginDto.identifier` accepts a phone, but this screen's
  field is "Email" and validates as an email. Unchanged.
- Migrating the Profile screen / `app.slice.user` to read
  `auth.slice.account`. After a real login the Profile tab still shows its
  fallbacks until a profiles feature migrates it (the known gap from 19b).
- Social login buttons on `SignInLanding` (no backend contract wired) and the
  dev `<Link href="/home">` there (already neutralized by the 19c guard).
- A `GET /auth/me` refetch after login - `sessionEstablished(res.user)` from
  the login payload is the session account.
- E.164 phone assembly / server-grade phone validation.

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
implement every step in one pass, keep the project compiling and tests green
after each, then one review packet. `/complete` makes the single feature commit
and merges into `feat/server-auth` after approval.

Gates (no `typecheck` script):

- `npx tsc --noEmit` clean
- `npm test` green (Jest; required for the schema and error-mapping logic and
  the `ControlledTextField` component per `coding-standards.md`)
- `npm run lint` clean (0 errors; the pre-existing `app/_layout.tsx`
  exhaustive-deps warning is unrelated and stays)

Screen `onSubmit` behavior (mutation dispatch, navigation, session write) is
screen integration - verified manually in `/check`, not by a brittle test
(`coding-standards.md`). No dev server or live backend is part of the automated
evidence; the `authApi` suites already prove the mutations against a stubbed
adapter.

## Build steps

- [x] **Step 1 - dependencies.** `npm install react-hook-form zod
  @hookform/resolvers`. Record the resolved versions in the commit. If
  `npx tsc --noEmit` or an existing suite breaks on module resolution, add the
  offending package(s) to `jest.config.js` `transformIgnorePatterns` (mirroring
  the 19b RTK entry) and no further.
  *Done when:* `npm ci` / `npm test` still green with zero source changes;
  `npx tsc --noEmit` clean.

- [x] **Step 2 - zod schemas.** `utils/authSchemas.ts`:
  - `signInSchema` = `{ identifier: z.string().trim().email('Enter a valid
    email'), password: z.string().min(1, 'Enter your password') }`.
  - `signUpSchema` = `{ fullName: z.string().trim().min(1, 'Full name is
    required'), email: z.string().trim().email('Enter a valid email'),
    phone: z.string().trim().min(1, 'Phone number is required'),
    password: z.string().min(8, 'Must be at least 8 characters'),
    confirmPassword: z.string() }` with
    `.refine(d => d.password === d.confirmPassword, { path: ['confirmPassword'],
    message: 'Passwords do not match' })`.
  - Export the inferred types (`SignInValues`, `SignUpValues`).
  Add `utils/authSchemas.test.ts`.
  *Done when:* tests cover a valid parse, an invalid email, `password` under 8
  on sign-up, `password` empty on sign-in, and the mismatch refinement;
  `npm test` green; `npx tsc --noEmit` clean.

- [x] **Step 3 - `applyApiError` helper.** `utils/authFormErrors.ts`:

  ```ts
  type SetError = (name: string, err: { message: string }) => void;
  export function applyApiError(err: unknown, setError: SetError, fields: string[]): void;
  ```

  - Not an `ApiError` -> `setError('root', { message: 'Something went wrong.
    Please try again.' })`.
  - `err.code === 'VALIDATION_FAILED'` and `err.errors` is an object -> for each
    key in `err.errors` that is also in `fields`, `setError(key, { message:
    <value> })`; if none matched, `setError('root', { message: err.message })`.
  - `err.code === 'AUTH_INVALID_CREDENTIALS'` -> `setError('root', { message:
    'The email or password is incorrect.' })`.
  - `err.code === 'ALREADY_EXISTS'` and `'email'` in `fields` -> `setError(
    'email', { message: 'An account with this email already exists.' })`.
  - `err.code === 'ACCOUNT_SUSPENDED' | 'ACCOUNT_DEACTIVATED' |
    'ACCOUNT_PENDING_VERIFICATION'` -> `setError('root', { message: <fixed copy
    per code> })`.
  - `err.code === 'NETWORK_ERROR'` -> `setError('root', { message: 'Cannot
    reach the server. Check your connection and try again.' })`.
  - anything else -> `setError('root', { message: err.message })`.

  Add `utils/authFormErrors.test.ts`.
  *Done when:* tests cover the field-map case (matched + unmatched keys), each
  named `code`, the non-`ApiError` case, and the fallthrough; `npm test` green;
  `npx tsc --noEmit` clean.

- [x] **Step 4 - `ControlledTextField`.** `components/elements/ControlledTextField/ControlledTextField.tsx`:

  ```tsx
  interface Props extends Omit<TextFieldProps, 'value' | 'onChangeText' | 'error'> {
    control: Control<any>;
    name: string;
  }
  ```

  Wrap `TextField` in RHF `Controller`; pass `field.value`,
  `field.onChange` (via `onChangeText`), `field.onBlur`, and
  `fieldState.error?.message` -> `error`. `index.ts` re-exports.
  Add `ControlledTextField.test.tsx` (RNTL): renders the label, shows a
  `fieldState` error message, and forwards typed text to the form (assert with
  a tiny host component using `useForm`).
  *Done when:* the component test passes; `npm test` green; `npx tsc --noEmit`
  and `npm run lint` clean.

- [x] **Step 5 - wire `SignIn`.** Replace the `useState` block with
  `useForm<SignInValues>({ resolver: zodResolver(signInSchema),
  defaultValues: { identifier: '', password: '' } })` and
  `const [login, { isLoading }] = useLoginMutation()`. Two `ControlledTextField`s
  (Email -> `identifier`, Password -> `password`). `onSubmit`:

  ```ts
  const res = await login({ identifier, password }).unwrap();
  if ('mfaRequired' in res) {
    setError('root', { message: 'Two-factor sign-in is not available in this version yet.' });
    return;
  }
  await setTokens({ token: res.token, refreshToken: res.refreshToken, tokenExpires: res.tokenExpires });
  dispatch(sessionEstablished(res.user));
  router.replace('/home');
  ```

  `catch (err) { applyApiError(err, setError, ['identifier', 'password']); }`.
  Render `formState.errors.root?.message` above the button; `Button` gets
  `isLoading={isLoading || formState.isSubmitting}` and
  `onPress={handleSubmit(onSubmit)}`. Keep `AuthHeader`, "Forgot password?"
  link, layout, and `testID`s.
  *Done when:* `npx tsc --noEmit` clean; `npm test` green; `npm run lint`
  clean; the manual path below works in `/check`.

- [x] **Step 6 - wire `SignUp`.** Replace the `useState` block with
  `useForm<SignUpValues>({ resolver: zodResolver(signUpSchema),
  defaultValues: { fullName: '', email: '', phone: '', password: '',
  confirmPassword: '' } })` and
  `const [registerCreator, { isLoading }] = useRegisterMutation()`. Keep
  `phoneCountry` / `isPhoneCountryPickerOpen` as local `useState` and the
  `CountryCodeSheet`. Five `ControlledTextField`s. `onSubmit`:

  ```ts
  await registerCreator({ roleKey: 'creator', email: email.trim(), password }).unwrap();
  router.push({ pathname: '/auth/verify-otp', params: { email: email.trim() } });
  ```

  `catch (err) { applyApiError(err, setError, ['email', 'password']); }`. Render
  `formState.errors.root?.message` above the button; `Button` gets `isLoading`
  and `onPress={handleSubmit(onSubmit)}`. Keep the phone `leftAdornment`,
  `Divider`, footer link, and layout.
  *Done when:* `npx tsc --noEmit` clean; `npm test` green; `npm run lint`
  clean; the manual path below works in `/check`.

## Files / areas

| Path | Change |
| --- | --- |
| `package.json`, `package-lock.json` | + `react-hook-form`, `zod`, `@hookform/resolvers` |
| `jest.config.js` | + `transformIgnorePatterns` entries only if a suite fails to parse |
| `utils/authSchemas.ts` + `.test.ts` | new - zod schemas |
| `utils/authFormErrors.ts` + `.test.ts` | new - `applyApiError` |
| `components/elements/ControlledTextField/*` | new - RHF-bound `TextField` |
| `scenes/auth/SignIn.tsx` | RHF + `useLoginMutation` + session write + error map |
| `scenes/auth/SignUp.tsx` | RHF + `useRegisterMutation` + navigate to OTP + error map |

`scenes/auth/VerifyOtp.tsx`, `SignInLanding.tsx`, `ForgotPassword.tsx`,
`ResetPassword.tsx` are untouched. `authApi`, `auth.slice`, `tokenStore`,
`TextField`, `Button` are consumed, not modified.

## Data / contracts

### Requests

| Form | Endpoint | Body sent |
| --- | --- | --- |
| Sign In | `POST /auth/login` | `{ identifier, password }` (`identifier` = the email field, trimmed) |
| Sign Up | `POST /auth/register` | `{ roleKey: 'creator', email: <trimmed>, password }` |

`fullName` and `phone` are validated in the Sign Up form but not transmitted
(the endpoint rejects unknown fields silently and requires exactly one of
email/phone; name has no home until profile onboarding).

### Sign In success

```ts
// res: LoginResponse
if ('mfaRequired' in res) -> form-level message, stop (19g)
else:
  await tokenStore.setTokens({ token, refreshToken, tokenExpires })   // sync mirror + AsyncStorage
  dispatch(sessionEstablished(res.user))                              // auth.slice -> 'authenticated'
  router.replace('/home')                                             // 19c guard also permits it
```

`res.user` is typed `AuthAccount` (the 19b assumption). If a live backend
returns a narrower `user` payload than `GET /auth/me`, `sessionEstablished`
still stores it; a later leaf can trigger `getMe` to fill gaps. Not blocking:
no backend to check against today.

### Error surface

| Condition | Where it shows |
| --- | --- |
| `VALIDATION_FAILED` with `errors[field]` for a form field | that field's inline error (`TextField.error`) |
| `VALIDATION_FAILED` with no matching field | form-level (`root`) |
| `AUTH_INVALID_CREDENTIALS` (401) | form-level: "The email or password is incorrect." |
| `ACCOUNT_SUSPENDED` / `_DEACTIVATED` / `_PENDING_VERIFICATION` (403) | form-level, fixed copy per code |
| `ALREADY_EXISTS` (register) | `email` field: "An account with this email already exists." |
| `NETWORK_ERROR` | form-level: "Cannot reach the server..." |
| `mfaRequired` login branch | form-level: "Two-factor sign-in is not available in this version yet." |
| anything else | form-level: `err.message` |

- Field errors clear on the next edit (RHF default with the zod resolver on
  change/submit). The `root` error is cleared by RHF on the next successful
  submit; also clear it explicitly at the top of `onSubmit`
  (`clearErrors('root')`).
- No error message ever contains a token or the raw password.

### zod schema summary

| Field | Rule |
| --- | --- |
| sign-in `identifier` | trimmed, valid email |
| sign-in `password` | non-empty |
| sign-up `fullName` | trimmed, non-empty |
| sign-up `email` | trimmed, valid email |
| sign-up `phone` | trimmed, non-empty |
| sign-up `password` | min 8 (backend `RegisterDto` minimum; the old mock used 6) |
| sign-up `confirmPassword` | equals `password` (refine, error on `confirmPassword`) |

## Testing

Jest (`jest-expo`) + `@jest/globals` + RNTL for the component. No screen tests
for `SignIn` / `SignUp` (`coding-standards.md`: screen integration is verified
with the dev server). The `authApi` login/register mutations are already
covered by `services/authApi.test.ts`.

- `utils/authSchemas.test.ts` (~6): valid sign-in, valid sign-up, invalid
  email, sign-up password < 8, sign-in password empty, password mismatch.
- `utils/authFormErrors.test.ts` (~8): `VALIDATION_FAILED` field map (matched
  key -> that field, unmatched-only -> root), `AUTH_INVALID_CREDENTIALS` ->
  root, `ALREADY_EXISTS` -> email, a 403 account code -> root, `NETWORK_ERROR`
  -> root, non-`ApiError` -> root, unknown code -> root with `message`.
- `components/elements/ControlledTextField/ControlledTextField.test.tsx` (~3):
  renders the label; a resolver error shows through `TextField`; typing updates
  the form value (host component reads `watch()` / a submit spy).

Predicted: 3 new suites, ~17 cases. Existing suites stay green.

## Notes for the AI

- `zodResolver` is `@hookform/resolvers/zod`. `useForm` is generic over the
  inferred schema type.
- `ControlledTextField`'s `control` prop type: use `Control<any>` with an
  eslint-disable for that one line, or make the component generic - match
  whichever the codebase's existing generics style is; do not spread `any`
  through the props.
- Do not prefill credentials. The old screens seeded `test@example.com` /
  `pass1234` for demo clicks; real auth screens start empty.
- `setTokens` updates its in-memory mirror synchronously, but still `await` it
  so the AsyncStorage write lands before any navigation-triggered relaunch.
- `dispatch` and `sessionEstablished` come from `useAuthSlice()`.
- Keep every existing `testID` (`sign-in-email`, `sign-in-password`,
  `sign-up-phone-country`) so a later browser-test harness can find the fields.
- Branch on `ApiError.code` / `.statusCode`, never `.message` (except as the
  last-resort display string).
- `roleKey: 'creator'` is hard-coded here - the mobile app is creator-only.
- No `console.*`. No em dashes, en dashes, or ellipsis characters
  (`coding-standards.md`).
- `SuccessSheet` in `VerifyOtp` and its `/profile-verification` navigation are
  19e's - do not touch that file.

## Manual try path (for `/check`, not this skill)

1. Sign Up with a valid email + 8-char password -> `POST /auth/register` fires
   (see it 404 against the placeholder `API_URL`, or 201 against a local
   backend) -> on 201, lands on `/auth/verify-otp` with the email shown.
2. Sign Up with a 5-char password -> inline "Must be at least 8 characters", no
   request sent.
3. Sign In with wrong credentials (local backend) -> form-level "The email or
   password is incorrect."; the button spinner clears.
4. Sign In with valid credentials (local backend) -> token pair stored, lands
   on `/home`; relaunch stays signed in (19b `restoreSession`).
5. Airplane mode, submit either form -> form-level "Cannot reach the server..."

## Open questions

None blocking. Recorded decisions: `password` min moves 6 -> 8 (backend
contract); `fullName` / `phone` are validated but not sent (no endpoint field);
`mfaRequired` is surfaced as a message, not a flow (19g); Profile still shows
fallbacks after login until a profiles feature migrates it off `app.slice.user`.
