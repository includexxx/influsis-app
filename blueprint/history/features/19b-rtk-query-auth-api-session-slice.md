# Feature: RTK Query auth API + session slice (19b)

**From build-plan:** feature 19b (second leaf of item 19, "Real creator
authentication (server-wired)")
**Status:** verified
**Branch:** `feature/rtk-query-auth-api-session-slice`

## Goal

Turn 19a's HTTP plumbing into a usable data layer and a single source of
session truth, so 19c can guard routes and 19d-19g can drive screens:

- an **`axiosBaseQuery`** that adapts `services/http.ts`'s `request()` (envelope
  already unwrapped, failures already `ApiError`) to RTK Query's
  `BaseQueryFn` contract,
- an **`authApi`** (`createApi`) with a typed endpoint for each `/auth/*` route
  that leaves 19c-19g consume: `register`, `login`, `verifyLogin2fa`,
  `requestOtp`, `verifyOtp`, `resetPassword`, `getMe`, `logout`,
- a new **`slices/auth.slice.ts`** holding `status` +
  `account: AuthAccount | null`, with a `restoreSession` thunk that reads the
  token store at launch and calls `GET /auth/me` (the 19a 401 interceptor
  refreshes a stale access token transparently),
- **store wiring**: register the api reducer + middleware and the `auth`
  reducer, and register the 19a unauthorized handler once so a dead refresh
  ends the Redux session,
- **launch rehydrate**: `app/_layout.tsx` dispatches `restoreSession()` instead
  of the fake `getUserAsync()`, and `services/user.service.ts` is deleted.

No screen, navigation, route guard, form, or visual change beyond the one
consequence below. RTK Query hooks are defined here and first used in 19d.

## Backend contracts (implementation authority, read-only for this repo)

- `../platform-context/api-contracts/README.md` - response/error envelope,
  exhaustive error-`code` catalog, `Authorization` header rules.
- `../platform-context/api-contracts/auth.md` - Group A (`register`, `login`,
  `login/2fa/verify`, `otp/request`, `otp/verify`, `reset-password`,
  `refresh`) and Group B (`GET /auth/me`, `POST /auth/logout`).

## Expected visible change

The fake `getUserAsync()` always returned `{ name: 'test user', email:
'testuser@test.com' }`, so the app always launched "logged in" and the Profile
tab showed that name/email. After 19b there is no seeded user and no way to
sign in yet (19d), so the app launches unauthenticated and Profile shows its
existing fallbacks (`user?.name ?? 'Your Profile'`, `user?.email ?? '-'`). This
is correct: there is no real session. `app/index.tsx` still only gates on
`app.slice.checked`, which the rehydrate keeps setting (bridge below), so
routing is unchanged. Real sign-in restores a real name in 19d+.

## In scope

- `types/auth.ts` - add request/response DTOs (no change to the existing
  `AuthTokens` / `AuthAccount` / `AuthRole` / `AuthProfileSummary` /
  `SessionAccountStatus`):
  - `SessionTokenPair` = `AuthTokens & { user: AuthAccount }` (the
    `{ token, refreshToken, tokenExpires, user }` shape returned by `login`,
    `otp/verify` for `registration` / `login`, and `login/2fa/verify`).
  - `RegisterRequest`, `LoginRequest`, `LoginResponse`
    (`SessionTokenPair | { mfaRequired: true; preAuthToken: string }`),
    `Login2faVerifyRequest`, `OtpRequestRequest`, `OtpVerifyRequest`,
    `OtpVerifyResponse` (`SessionTokenPair | { resetToken: string } |
    { confirmed: true }`), `ResetPasswordRequest`, `OtpPurpose`, `OtpChannel`.
  - Re-exported through `types/index.ts` (already re-exports `./auth`).
- `services/authApi.ts` (new) - `axiosBaseQuery`, `authApi` from `createApi`
  (`reducerPath: 'authApi'`, `reactHooksModule`), the eight endpoints above,
  and the generated hooks. Auth-public endpoints pass `skipAuth: true` to the
  base query; `getMe` and `logout` do not. `tagTypes: ['Me']`; `getMe`
  provides `Me`, and `verifyOtp` (email/phone verification) does not need to
  invalidate here (no `Me` consumer until 19d).
- `services/index.ts` - add `export * from './authApi'`; remove
  `export * from './user.service'`.
- `slices/auth.slice.ts` (new) - state `{ status: 'restoring' |
  'authenticated' | 'unauthenticated'; account: AuthAccount | null }`,
  reducers `sessionEstablished(account)`, `sessionEnded()`,
  `accountUpdated(account)`, the `restoreSession` async thunk, a `useAuthSlice`
  hook (matching `useAppSlice` shape), and `export default slice.reducer`.
- `slices/index.ts` - `export { useAuthSlice } from './auth.slice'`.
- `utils/store.ts` - add `auth` and `[authApi.reducerPath]` reducers, concat
  `authApi.middleware` in both env branches, and after `store` is created call
  `setUnauthorizedHandler(() => { store.dispatch(sessionEnded());
  store.dispatch(authApi.util.resetApiState()); })`.
- `app/_layout.tsx` - replace the `getUserAsync()` block with
  `await dispatch(restoreSession())`, then bridge
  `dispatch(setLoggedIn(<authenticated?>))` so `app.slice.checked` still flips;
  drop the `getUserAsync` / `User` imports that become unused.
- `services/user.service.ts` - delete.
- Co-located Jest tests: `services/authApi.test.ts`,
  `slices/auth.slice.test.ts`.

## Out of scope

- Route guarding, the `authGate` helper, `(auth)` / `(main)` / `(details)`
  layout guards, and session-based `app/index.tsx` routing (19c). 19b only
  keeps the existing `checked` bridge alive.
- Any change to `slices/app.slice.ts`. Its `checked` / `loggedIn` / `user`
  fields and `useAppSlice` stay exactly as they are; 19c retires the auth
  parts once real guards read `auth.slice`.
- Wiring `SignIn`, `SignUp`, `VerifyOtp`, `ForgotPassword`, `ResetPassword`,
  or the Profile logout row to these endpoints (19d-19g). No RTK Query hook is
  called from a component in this feature.
- react-hook-form / zod (19d).
- Endpoints no 19x leaf consumes: `PATCH /auth/change-password`,
  `DELETE /auth/me`, `GET/DELETE /sessions*`, `GET /handles/:handle/availability`,
  social login. Add each with the feature that needs it.
- `POST /auth/refresh` as an RTK Query endpoint. Refresh stays entirely inside
  the 19a response interceptor; exposing it as a callable endpoint would invite
  a second refresh path and break single-flight.
- `setupListeners` / `refetchOnFocus` / `refetchOnReconnect` - not needed for
  auth; revisit if a later feature wants focus refetch.
- Persisting RTK Query cache or the `auth` slice to AsyncStorage. The token
  store is the only durable auth state; `account` is re-fetched every launch by
  `restoreSession`.
- Pointing `API_URL` at a real environment (feature 22). With the current
  placeholder `apiUrl`, `restoreSession` resolves to `unauthenticated` and
  tests never hit the network.

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`
(from `blueprint/config.json`): implement every step in one pass, keeping the
project compiling and tests green after each, then present one review packet.
No per-step approval pause, no checkpoint commits. `/complete` makes the single
feature commit and merges into `feat/server-auth` after approval.

Gates (same as 19a, no `typecheck` script exists):

- `npx tsc --noEmit` clean
- `npm test` green (Jest; a required gate for the logic in every step here)
- `npm run lint` clean (0 errors; the pre-existing `app/_layout.tsx`
  exhaustive-deps warning is expected and may grow one more missing dep entry,
  which is acceptable and consistent with the file's existing suppression)

No dev server and no live backend call are part of this feature's evidence.
Every test drives the stubbed `httpClient.defaults.adapter`, exactly as
`services/http.test.ts` already does.

## Build steps

- [x] **Step 1 - Auth DTOs.** Add the request/response types listed under
  "In scope" to `types/auth.ts`. `LoginResponse` and `OtpVerifyResponse` are
  discriminated unions; add a narrow helper only if a test needs one (prefer
  `'mfaRequired' in res`). No runtime code, no new file.
  *Done when:* `npx tsc --noEmit` clean; `npm test` still green;
  `git grep -l "SessionTokenPair\|LoginResponse"` shows matches only in
  `types/`.

- [x] **Step 2 - `authApi`.** Add `services/authApi.ts`:
  - `axiosBaseQuery(): BaseQueryFn<{ url: string; method?: Method; data?:
    unknown; params?: unknown; skipAuth?: boolean }, unknown, ApiError>` -
    calls `request()` from `./http` in a `try`, returns `{ data }` on success,
    `{ error }` on a thrown `ApiError` (re-wrap any non-`ApiError` throw as an
    `ApiError` with `code: 'UNKNOWN'`, `statusCode: 0`).
  - `authApi = createApi({ reducerPath: 'authApi', baseQuery: axiosBaseQuery(),
    tagTypes: ['Me'], endpoints: builder => ({ ... }) })` importing
    `createApi` / `reactHooksModule` from `@reduxjs/toolkit/query/react`.
  - Mutations `register`, `login`, `verifyLogin2fa`, `requestOtp`,
    `verifyOtp`, `resetPassword`, `logout`; query `getMe` (`providesTags:
    ['Me']`). Public ones set `skipAuth: true` in the query arg. `register`
    hard-codes nothing - `roleKey` comes from the caller (19d passes
    `'creator'`).
  - Export `authApi` and its generated hooks; `services/index.ts` re-exports.
  Add `services/authApi.test.ts` driving endpoints through
  `httpClient.defaults.adapter` (jest fn) inside a throwaway store created with
  `configureStore({ reducer: { [authApi.reducerPath]: authApi.reducer },
  middleware: gDM => gDM().concat(authApi.middleware) })`.
  *Done when:* tests cover (a) `login` POSTs `/auth/login` with `skipAuth` and
  resolves the token-pair `data`, (b) the `login` MFA branch surfaces
  `{ mfaRequired, preAuthToken }` as `data`, (c) `getMe` GETs `/auth/me` with
  no `skipAuth` (adapter sees no forced skip) and returns the `AuthAccount`,
  (d) a `success:false` body yields a `result.error` that is an `ApiError`
  carrying the server `code`; `npm test` green; `npx tsc --noEmit` and
  `npm run lint` clean.

- [x] **Step 3 - `auth.slice`.** Add `slices/auth.slice.ts`:
  - `initialState = { status: 'restoring', account: null }`.
  - `sessionEstablished(PayloadAction<AuthAccount>)` -> `authenticated` +
    account; `sessionEnded()` -> `unauthenticated` + `null`;
    `accountUpdated(PayloadAction<AuthAccount>)` -> account only.
  - `restoreSession` = `createAsyncThunk('auth/restoreSession', async (_, { dispatch }))`:
    read `getTokens()` from `./`-`services/tokenStore` via `@/services`; if no
    `refreshToken`, return `null`. Otherwise
    `await dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })).unwrap()`
    and return the `AuthAccount`. On a thrown `ApiError` with `statusCode` 401
    or 403, `await clearTokens()`; on any failure return `null` (never throw).
  - `extraReducers`: `restoreSession.fulfilled` with an account ->
    `sessionEstablished` semantics; with `null` -> `sessionEnded` semantics;
    `restoreSession.rejected` -> `sessionEnded` semantics (defensive; the thunk
    is written not to reject).
  - `useAuthSlice()` returns `{ dispatch, ...state, ...slice.actions }` like
    `useAppSlice`. `export default slice.reducer`.
  - `slices/index.ts` re-exports `useAuthSlice`.
  Add `slices/auth.slice.test.ts`: reducer transitions for the three actions,
  plus `restoreSession` across a real throwaway store (`auth` reducer +
  `authApi`) with the adapter stub and a `jest.mock('@/services')` seam or a
  spy on `tokenStore`.
  *Done when:* tests cover (a) `sessionEstablished` / `sessionEnded` /
  `accountUpdated` transitions, (b) `restoreSession` with no stored tokens ->
  `unauthenticated`, `account` null, and no adapter call, (c) `restoreSession`
  with tokens + a `/auth/me` success -> `authenticated` with the account,
  (d) `restoreSession` with tokens + a `/auth/me` 401 -> `unauthenticated` and
  `clearTokens` called; `npm test` green; `npx tsc --noEmit` and
  `npm run lint` clean.

- [x] **Step 4 - store wiring.** In `utils/store.ts`: add `auth` (default
  import from `@/slices/auth.slice`) and `[authApi.reducerPath]: authApi.reducer`
  to `reducer`; change `middleware` so both env branches include
  `authApi.middleware` (build the base with
  `getDefaultMiddleware().concat(authApi.middleware)`, then `.concat(logger)`
  only outside dev); after `const store = configureStore(...)`, call
  `setUnauthorizedHandler(() => { store.dispatch(sessionEnded());
  store.dispatch(authApi.util.resetApiState()); })` (import `sessionEnded` from
  the slice's exported actions, `setUnauthorizedHandler` from `@/services`).
  Keep `State` / `Dispatch` exports.
  *Done when:* `npx tsc --noEmit` clean; `npm test` green (existing slice tests
  and the new ones still pass with the enlarged store type); `npm run lint`
  clean; `git grep "authApi.middleware" utils/store.ts` matches.

- [x] **Step 5 - launch rehydrate.** In `app/_layout.tsx`: remove the
  `getUserAsync` import and the `import { User } from '@/types'` if it is then
  unused; inside the effect, keep `await Promise.all([loadImages(),
  loadFonts()])`, then `const account = await dispatch(restoreSession()).unwrap()`
  (the thunk never rejects) and `dispatch(setLoggedIn(!!account))`; keep the
  `catch` only for the asset-load failure path, which should still call
  `dispatch(restoreSession())` and `dispatch(setLoggedIn(!!account))` before
  `SplashScreen.hideAsync()` in `finally`. Delete `services/user.service.ts`
  and its `export * from './user.service'` line (done in Step 2). Confirm no
  other file imports `getUserAsync`.
  *Done when:* `git grep -l getUserAsync` returns nothing; `npx tsc --noEmit`
  clean; `npm test` green; `npm run lint` clean; a manual `npm run dev:web`
  launch (evidence gathered in `/check`, not here) reaches the app with the
  splash dismissed and no redbox.

## Files / areas

| Path | Change |
| --- | --- |
| `types/auth.ts` | add request/response DTOs and the two response unions |
| `types/index.ts` | unchanged (already re-exports `./auth`) |
| `services/authApi.ts` | new - `axiosBaseQuery` + `authApi` + hooks |
| `services/index.ts` | add `./authApi`, remove `./user.service` |
| `services/user.service.ts` | deleted |
| `slices/auth.slice.ts` | new - session slice + `restoreSession` thunk + `useAuthSlice` |
| `slices/index.ts` | export `useAuthSlice` |
| `utils/store.ts` | api reducer + middleware, `auth` reducer, unauthorized handler |
| `app/_layout.tsx` | `restoreSession()` replaces `getUserAsync()`, `setLoggedIn` bridge kept |
| `slices/app.slice.ts` | untouched |
| `app/index.tsx` | untouched (19c) |
| `services/authApi.test.ts`, `slices/auth.slice.test.ts` | new |

`services/http.ts` and `services/tokenStore.ts` are imported, not modified.

## Data / contracts

### New types in `types/auth.ts`

```ts
type OtpPurpose = 'registration' | 'login' | 'password_reset' | 'phone_change' | 'email_change';
type OtpChannel = 'sms' | 'email';

interface SessionTokenPair extends AuthTokens {
  user: AuthAccount;
}

interface RegisterRequest {
  roleKey: 'creator' | 'business'; // mobile passes 'creator' only (19d)
  email?: string;
  phone?: string;                  // E.164; exactly one of email/phone
  password: string;                // min 8, enforced server-side
}

interface LoginRequest {
  identifier: string;              // email or phone
  password: string;
}

type LoginResponse =
  | SessionTokenPair
  | { mfaRequired: true; preAuthToken: string };

interface Login2faVerifyRequest {
  preAuthToken: string;
  code: string;                    // 6-digit TOTP
}

interface OtpRequestRequest {
  destination: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
}

interface OtpVerifyRequest {
  destination: string;
  purpose: OtpPurpose;
  code: string;                    // length 4-8
}

type OtpVerifyResponse =
  | SessionTokenPair               // purpose 'registration' | 'login'
  | { resetToken: string }         // purpose 'password_reset'
  | { confirmed: true };           // purpose 'phone_change' | 'email_change'

interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;             // min 8
}
```

- `register` and `resetPassword` responses are `null` (`data: null`); type the
  RTK Query endpoint result as `null`.
- `logout` response is `null`.
- `POST /auth/refresh` (`RefreshResponseDto` = `{ token, refreshToken,
  tokenExpires }`) is already handled inside `services/http.ts` from 19a and is
  not re-declared here.

### `user` payload assumption

`auth.md` names the `user` field on `login` / `otp/verify` / `login/2fa/verify`
responses but does not print its full shape; it is the `MeResponseDto`
(`GET /auth/me`) shape, which is already modelled as `AuthAccount`. 19b types
`user` as `AuthAccount`. The consuming leaf (19d for `login`, 19e for
`otp/verify`) confirms against a live response and narrows if the backend
returns a subset. Not blocking: types only, no backend to verify against now.

### `axiosBaseQuery` contract

| Aspect | Decision |
| --- | --- |
| Args | `{ url, method?, data?, params?, skipAuth? }` - a subset of `AxiosRequestConfig`; `method` defaults to axios's own default (`GET`) |
| Success | `{ data: <unwrapped payload> }` - `request()` already returned `body.data` |
| Failure | `{ error: ApiError }` - pass the `ApiError` through untouched so components branch on `.code` / `.statusCode`; RTK Query stores it as the `error` field |
| Non-`ApiError` throw | wrapped as `new ApiError({ code: 'UNKNOWN', statusCode: 0, message: ... })` - should not happen (the interceptor normalizes everything) but the base query must not leak a raw error |
| Retry / refresh | none here - the 19a response interceptor owns bearer-token attach and the one-shot 401 refresh; the base query is a thin adapter |

### `auth.slice` state machine

| status | meaning | set by |
| --- | --- | --- |
| `restoring` | initial; `restoreSession` in flight at launch | initial state |
| `authenticated` | `account` is a real `/auth/me` result | `sessionEstablished`, `restoreSession.fulfilled(account)` |
| `unauthenticated` | no session, or restore/refresh failed | `sessionEnded`, `restoreSession.fulfilled(null)`, `restoreSession.rejected`, the 19a unauthorized handler |

- `account` is `null` in `restoring` and `unauthenticated`, non-null in
  `authenticated`.
- No token values ever enter this slice or the RTK Query cache. Tokens live
  only in `services/tokenStore.ts` (19a).
- `restoreSession` clears the token store only on a definitive `401` / `403`
  from `/auth/me` (mirrors 19a's `doRefresh`); a transport error leaves tokens
  in place so a later launch can retry.

### Trusted values / redaction

- `roleKey` on `register` is caller-supplied; the mobile app only ever sends
  `'creator'` (19d). The backend rejects a disallowed `roleKey` with
  `VALIDATION_FAILED` (`roleNotAllowed`); no client-side enforcement is added.
- No `console.*` anywhere in this feature (`coding-standards.md`).
- The RTK Query `authApi` state is not persisted, so a token pair embedded in a
  cached `login` / `verifyOtp` result never lands on disk. 19d hands the token
  pair straight to `tokenStore.setTokens` and does not keep it in component
  state.

## Testing

Jest (`jest-expo`) + `@jest/globals`. AsyncStorage globally mocked in
`jest.setup.js`. No React Native Testing Library (no components). No screen or
navigation tests (`coding-standards.md` - full-screen integration is out).
Every case drives `httpClient.defaults.adapter` with a jest fn returning a
synthetic `AxiosResponse` (envelope-wrapped) or rejecting with an `AxiosError`,
the identical harness `services/http.test.ts` uses.

- `services/authApi.test.ts` (~6 cases): `login` -> `/auth/login`, `skipAuth`,
  token-pair `data`; `login` MFA branch -> `{ mfaRequired, preAuthToken }`;
  `getMe` -> `/auth/me`, bearer path (no forced skip), `AuthAccount` `data`;
  `register` -> `null` `data`; a `success:false` body -> `result.error instanceof
  ApiError` with the exact `code`; `requestOtp` -> `/auth/otp/request` with the
  body echoed.
- `slices/auth.slice.test.ts` (~7 cases): the three reducer transitions;
  `restoreSession` with no tokens (-> `unauthenticated`, no adapter call);
  with tokens + `/auth/me` 200 (-> `authenticated`, account set); with tokens +
  `/auth/me` 401 (-> `unauthenticated`, `clearTokens` called); with tokens +
  a network error (-> `unauthenticated`, `clearTokens` NOT called).

Predicted: 2 new suites, ~13 cases. All existing suites stay green (the
enlarged store type must not break `slices/*.slice.test.ts` or the 70+
component suites).

## Notes for the AI

- **Terse module style.** Match `services/http.ts` and the existing slices: no
  banner comments, no JSDoc restating a signature. Comment only the non-obvious
  (why refresh is not an endpoint, why `account` is not persisted).
- **No `any`.** `axiosBaseQuery`'s error channel is `ApiError`; the success
  payload is generic per endpoint. Use `unknown` + `in` narrowing for the
  polymorphic `login` / `otp/verify` responses.
- **RTK Query import path** is `@reduxjs/toolkit/query/react` (verified
  resolvable, RTK 2.11). Do not add a dependency - RTK Query ships inside
  `@reduxjs/toolkit`.
- **Do not touch `slices/app.slice.ts` or `app/index.tsx`.** The `setLoggedIn`
  bridge in `_layout.tsx` is the only concession to the old auth state; 19c
  removes it when real guards read `auth.slice`.
- **Do not expose `/auth/refresh`** as an RTK Query endpoint or call it from
  the slice. It belongs to the 19a interceptor and must stay single-flight.
- **`restoreSession` must never throw.** `_layout.tsx` calls `.unwrap()`; the
  thunk returns `null` on every failure path so `.unwrap()` resolves.
- **Middleware both branches.** `utils/store.ts` currently only concats
  `redux-logger` outside dev. `authApi.middleware` must be present in dev too
  or every RTK Query call warns and cache lifetimes break.
- Branch on `ApiError.code` / `.statusCode`, never `.message`.
- No em dashes, en dashes, or ellipsis characters in code, comments, or docs
  (`coding-standards.md`).
- The mobile app is **creator-only**. 19b is role-agnostic (it moves session
  state and typed endpoints); `roleKey: 'creator'` is hard-coded by 19d on
  `register`.
