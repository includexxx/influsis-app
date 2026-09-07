# 19a - Auth API client + token store

> Archived by `/complete`. First leaf of build-plan item 19
> ("Real authentication + route guarding").

**Note:** Mobile APP is only for role `creator` registration, onboard and login flows. The `business` role is not yet supported in the mobile app, but the API client and token store are agnostic to role.

**Branch:** `feature/auth-api-client-and-token-store`

**Status:** verified - all build steps complete, `npx tsc --noEmit` clean,
`npm test` green (77 suites / 200 tests), lint clean. Ready for `/complete`.

## Goal

Stand up the client-side plumbing every later auth step needs: a typed HTTP
wrapper that speaks the backend's `/api/v1` response envelope, an AsyncStorage
token store, and `services/auth.service.ts` with a typed function per Group A/B
auth endpoint. This step adds modules only. No screen, navigation, redux, or
app-bootstrap behavior changes, and the app keeps building and running on the
existing mock fixtures.

Backend contract source (implementation authority, read-only for this repo):

- `../backend/docs/Implementations/_CONVENTIONS.md` - envelope, guard stack,
  error catalog, base path
- `../backend/docs/Implementations/GROUP_A_PUBLIC_AUTH.md` - register, otp
  request/verify, login (+ MFA branch), login 2FA, reset-password, refresh
- `../backend/docs/Implementations/GROUP_B_OWN_ACCOUNT.md` - `GET /auth/me`,
  `POST /auth/logout`

## In scope

- `types/api.ts` - response envelope, error shape, `PageMeta`, and the
  machine-readable error-`code` union clients branch on.
- `types/user.ts` - additive auth types (`AuthAccount`, `AuthRole`,
  `AuthTokens`, `AuthProfileSummary`). The existing mock `User` interface is
  left untouched.
- `services/http.ts` - `request<T>()` fetch wrapper: base URL, JSON headers,
  optional bearer token, envelope unwrap, typed `ApiError` on `success: false`
  or transport failure.
- `services/tokenStore.ts` - `getTokens` / `setTokens` / `clearTokens`, backed
  by AsyncStorage under a new `DataPersistKeys.TOKENS` key.
- `services/auth.service.ts` - one typed function per auth endpoint listed in
  Data / contracts.
- `services/index.ts` - export the new modules (keep the existing
  `user.service` export).
- `hooks/useDataPersist.ts` - add the `TOKENS` enum member only.
- Co-located Jest unit tests for `http`, `tokenStore`, and `auth.service`.

## Out of scope

- Any change to `slices/app.slice.ts`, `app/_layout.tsx` bootstrap,
  `app/index.tsx`, or route `_layout` files (19b, 19c).
- Token refresh scheduling, 401-triggered auto-logout, and the refresh
  interceptor (19b - it needs session state to force a logout).
- Wiring any auth screen or the Profile logout row to these services (19d).
- Removing or rewriting `services/user.service.ts` / `getUserAsync` (19b).
- `expo-secure-store` (decided: AsyncStorage via the existing persistence
  layer).
- Calling `/profiles/onboarding-creator|business` from the profile-verification
  wizard (later; see Open questions).
- List/pagination helpers and per-resource product services (feature 20).
- Pointing `API_URL` at a real environment (feature 22).

## Build loop

`workflow.stepReview: "feature"` and `workflow.checkpointCommits: "disabled"`
(from `blueprint/config.json`): implement all build steps in one pass, then
present a single review packet. No per-step approval pause, no checkpoint
commits. `/complete` creates the one feature commit after review.

Type gate: there is no `typecheck` npm script, so each step's type check is
`npx tsc --noEmit`. Logic gate: `npm test` (Jest, already a required gate for
logic steps). Both must be green before the review packet and before
`/complete`.

## Build steps

- [x] 1. **API types.** Add `types/api.ts` (`ApiEnvelope<T>`, `ApiListEnvelope<T>`,
     `ApiErrorBody`, `PageMeta`, and `ApiErrorCode` as a string-literal union of the
     documented codes plus the synthetic `NETWORK_ERROR` / `UNKNOWN`). Add the
     additive auth types to `types/user.ts`. Re-export both from `types/index.ts`.
     Nothing imports them from app code yet.
     **Done when:** `npx tsc --noEmit` is clean, `npm test` is still green (181
     tests), and `git grep` shows the new types are only referenced from
     `types/`.

- [x] 2. **HTTP wrapper.** Add `services/http.ts` exporting `request<T>(path,
options)` and the `ApiError` class. Base URL is `` `${config.apiUrl}/api/v1` ``
     with any duplicate slash between the two collapsed. Sets `Content-Type:
application/json`; adds `Authorization: Bearer <token>` when
     `options.token` is passed. Parses the JSON body: on `success: true` returns
     `body.data as T`; on `success: false` throws `new ApiError(body)`; on a
     non-JSON body or a thrown/rejected fetch throws `ApiError` with code
     `NETWORK_ERROR` (fetch rejected) or `UNKNOWN` (2xx-range but unparseable).
     Add `services/http.test.ts`.
     **Done when:** tests cover (a) success unwrap returns `data`, (b)
     `success:false` throws `ApiError` carrying the exact `code`/`statusCode`/
     `errors`, (c) a rejected `fetch` throws `ApiError` code `NETWORK_ERROR`, (d)
     the `Authorization` header is present only when a token is passed; `npm test`
     green; `npx tsc --noEmit` clean.

- [x] 3. **Token store.** Add `TOKENS = 'TOKENS'` to `DataPersistKeys` in
     `hooks/useDataPersist.ts`. Add `services/tokenStore.ts` with
     `getTokens(): Promise<AuthTokens | null>`, `setTokens(t: AuthTokens):
Promise<void>`, `clearTokens(): Promise<void>`, wrapping
     `AsyncStorage` directly (sanctioned for a service module; components still go
     through `useDataPersist`). JSON-serialize the whole `AuthTokens` object under
     the one key. A malformed stored value resolves to `null`, it does not throw.
     Add `services/tokenStore.test.ts` with `jest.mock('@react-native-async-storage/
async-storage')` (project's standard mock).
     **Done when:** tests cover set-then-get round trip, `clearTokens` removes the
     key, and a corrupt stored string yields `null`; `npm test` green.

- [x] 4. **Auth service.** Add `services/auth.service.ts` with the functions in
     Data / contracts, each calling `request<T>()` and returning the mapped
     result type (not the raw envelope). `login` and `verifyOtp` return
     discriminated unions. Export everything from `services/index.ts`. Do not
     touch `user.service.ts`. Add `services/auth.service.test.ts` (mock
     `./http`).
     **Done when:** tests cover `login` -> `status: 'ok'` vs `status: 'mfa'`
     mapping, `verifyOtp` purpose-keyed result mapping, `refresh` returns the new
     `AuthTokens`, and an `ApiError` from `request` propagates unchanged; `npm
test` green; `npx tsc --noEmit` clean.

## Files / areas

| Path                                    | Change                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `types/api.ts`                          | new - envelope, error body, `PageMeta`, `ApiErrorCode`                                  |
| `types/user.ts`                         | extend - add `AuthAccount`, `AuthRole`, `AuthTokens`, `AuthProfileSummary`; keep `User` |
| `types/index.ts`                        | add `export * from './api'`                                                             |
| `services/http.ts` + `.test.ts`         | new - `request<T>()`, `ApiError`                                                        |
| `services/tokenStore.ts` + `.test.ts`   | new - AsyncStorage token persistence                                                    |
| `services/auth.service.ts` + `.test.ts` | new - typed endpoint functions                                                          |
| `services/index.ts`                     | add the three new re-exports                                                            |
| `hooks/useDataPersist.ts`               | add `DataPersistKeys.TOKENS` only                                                       |

`utils/config.ts` is read, not changed - `config.apiUrl` is still the
`https://example.com` placeholder; tests mock the network so they do not depend
on a reachable backend.

## Data / contracts

**Base path:** every call is `` `${config.apiUrl}/api/v1` `` + the endpoint path.

**Success envelope** (`ApiEnvelope<T>`): `{ success: true, statusCode, message,
data: T, meta: PageMeta | null, requestId, timestamp, path }`. `request<T>()`
returns `data`.

**Error envelope** (`ApiErrorBody`): `{ success: false, statusCode, code,
message, errors: Record<string, string> | null, requestId, timestamp, path }`.
`ApiError` exposes `code`, `statusCode`, `message`, `errors`, `requestId`.
**Callers branch on `code`, never `message`.**

**`ApiErrorCode`** union (from `_CONVENTIONS.md` + Group A/B, non-exhaustive but
the ones this app will branch on): `VALIDATION_FAILED`, `ALREADY_EXISTS`,
`NOT_FOUND`, `AUTH_INVALID_CREDENTIALS`, `AUTH_TOKEN_MISSING`,
`AUTH_TOKEN_INVALID`, `AUTH_TOKEN_EXPIRED`, `AUTH_SESSION_REVOKED`,
`AUTH_TOKEN_STALE`, `AUTH_MFA_REQUIRED`, `AUTH_MFA_INVALID_CODE`,
`ACCOUNT_SUSPENDED`, `ACCOUNT_DEACTIVATED`, `ACCOUNT_PENDING_VERIFICATION`,
`INSUFFICIENT_ROLE`, `INSUFFICIENT_PERMISSION`, `STEP_UP_REQUIRED`,
`INVALID_STATE_TRANSITION`, `RATE_LIMITED`, `INTERNAL_ERROR`. Type it as the
union `| (string & {})` so an unlisted server code still type-checks.

**`PageMeta`:** `{ page, limit, itemCount, hasNextPage, totalCount, pageCount }`
(defined now for feature 20; unused here).

**`AuthTokens`:** `{ token: string; refreshToken: string; tokenExpires: number }`.
`tokenExpires` is epoch **milliseconds**. This is the persisted shape.

**`AuthRole`:** `{ key: string; displayName: string; description: string;
isInternal: boolean; requires2fa: boolean; permissionsVersion: number;
sortOrder: number }`.

**`AuthAccount`** (from `GET /auth/me`): `{ id: string; roleKey: RoleKey;
status: AccountStatus; role: AuthRole; createdAt: string; deactivatedAt: string
| null; email: string | null; phone: string | null; emailVerified: boolean;
phoneVerified: boolean; twoFactorEnabled: boolean; handle: string | null;
profile: AuthProfileSummary | null }`.

- `RoleKey` = `'business' | 'creator' | 'support' | 'finance_admin' |
'moderator' | 'admin' | 'super_admin'`.
- `AccountStatus` = `'unverified' | 'pending' | 'active' | 'invited' |
'suspended' | 'deactivated'`.
- `AuthProfileSummary` - the backend docs describe it only as "a profile
  summary once the caller onboards one (Group D)" without a field list, and 19a
  never reads into it. Type it `Record<string, unknown>`; 19b/feature 21 give it
  real fields. Note left in the code.

Note the `login` 200 body carries a slightly reduced `user` (no
`emailVerified`/`handle`/`profile`); treat login's account as
`Pick<AuthAccount, 'id' | 'roleKey' | 'role' | 'status' | 'createdAt'> &
{ updatedAt: string; deletedAt: string | null }` or simply re-fetch via
`getMe` in 19b. For 19a, map login's `user` to a `LoginAccount` subset type
rather than claiming a full `AuthAccount`.

### `services/auth.service.ts` functions

| Function         | Endpoint                      | Input                                                                                    | Success result                                                                                                                                                                                                                        |
| ---------------- | ----------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `register`       | `POST /auth/register`         | `{ roleKey: 'business' \| 'creator'; email?: string; phone?: string; password: string }` | `void` (201, `data: null`)                                                                                                                                                                                                            |
| `login`          | `POST /auth/login`            | `{ identifier: string; password: string }`                                               | `{ status: 'ok'; tokens: AuthTokens; account: LoginAccount } \| { status: 'mfa'; preAuthToken: string }`                                                                                                                              |
| `verifyLogin2fa` | `POST /auth/login/2fa/verify` | `{ preAuthToken: string; code: string }`                                                 | `{ tokens: AuthTokens; account: LoginAccount }` (unreachable today - no enrolment path - but the contract exists; keep it)                                                                                                            |
| `requestOtp`     | `POST /auth/otp/request`      | `{ destination: string; channel: 'sms' \| 'email'; purpose: OtpPurpose }`                | `void`                                                                                                                                                                                                                                |
| `verifyOtp`      | `POST /auth/otp/verify`       | `{ destination: string; purpose: OtpPurpose; code: string }`                             | union by `purpose`: `registration`/`login` -> `{ kind: 'session'; tokens: AuthTokens; account: LoginAccount }`; `password_reset` -> `{ kind: 'reset'; resetToken: string }`; `phone_change`/`email_change` -> `{ kind: 'confirmed' }` |
| `resetPassword`  | `POST /auth/reset-password`   | `{ resetToken: string; newPassword: string }`                                            | `void` (also revokes all sessions server-side)                                                                                                                                                                                        |
| `refresh`        | `POST /auth/refresh`          | `refreshToken: string` (goes in the `Authorization` header, empty body)                  | `AuthTokens`                                                                                                                                                                                                                          |
| `logout`         | `POST /auth/logout`           | `accessToken: string`                                                                    | `void`                                                                                                                                                                                                                                |
| `getMe`          | `GET /auth/me`                | `accessToken: string`                                                                    | `AuthAccount`                                                                                                                                                                                                                         |

- `OtpPurpose` = `'registration' | 'login' | 'password_reset' | 'phone_change'
| 'email_change'`.
- `refresh` sends the **refresh** token as `Bearer`, not the access token, and
  an empty body (`_CONVENTIONS.md` `H-Refresh`).
- No retry, no refresh-on-401, no token persistence inside `auth.service` -
  callers (19b) decide when to `setTokens` / `clearTokens`. Keep these
  functions pure request-and-map.
- `register` with `channel=email` OTP and `otp/request` `channel=email` are
  documented as currently returning `500` outside Docker (maildev host). That is
  a backend/env issue, not something this client works around; `ApiError` code
  `INTERNAL_ERROR` surfaces normally. Recorded so 19d handles the message
  gracefully.

## Testing

Jest (`jest-expo`) + the project's standard mocks. Unit tests only - no
screen/scene integration, no real network (standards: those need dev-server or
manual evidence, not brittle tests). No `Browser tests` command is declared, so
none are added.

- `services/http.test.ts` - `global.fetch` stubbed per case:
  success unwrap; `success:false` -> `ApiError` with exact `code`/`statusCode`/
  `errors`; rejected fetch -> `ApiError` `NETWORK_ERROR`; non-JSON 200 ->
  `ApiError` `UNKNOWN`; `Authorization` header present only with a token; base
  URL joins `config.apiUrl` + `/api/v1` without a double slash.
- `services/tokenStore.test.ts` - `jest.mock` AsyncStorage: set-then-get round
  trip; `clearTokens` removes the key; corrupt stored string -> `null`.
- `services/auth.service.test.ts` - `jest.mock('./http')`: `login` maps the
  token branch and the `mfaRequired` branch; `verifyOtp` maps each `purpose`
  shape; `refresh` returns `AuthTokens` and calls `request` with the refresh
  token as the bearer; an `ApiError` thrown by `request` propagates unchanged.

Predicted net: ~3 new suites, ~15-18 new test cases, existing 181 still green.

## Notes for the AI

- Additive step. After 19a the app still imports nothing from these modules;
  `app/_layout.tsx` still calls `getUserAsync()` and the mock flows are
  unchanged. `npm run dev` must start and every existing screen must still
  render on mock data.
- `services/user.service.ts` stays exactly as-is. 19b replaces its use.
- Branch on `code`, never on `message` (messages are localized server-side).
- Envelope parsing must not assume the body is JSON - a gateway/proxy `502`
  can return HTML. Guard `response.json()` in try/catch.
- No `console.log` in the shipped modules (standards). Surface nothing to the
  user from this layer - it only throws typed errors for callers to render.
- `config.env === Env.dev` already gates redux-logger; do not add new logging.
- Match the terse style of the existing `services/user.service.ts`; no banner
  comments, comment only the non-obvious (`tokenExpires` unit, the
  `AuthProfileSummary` gap, the refresh-token-as-bearer quirk).
- Keep functions under ~50 lines; `request<T>()` should stay small.

## Open questions

None block 19a. Carried forward for the later 19x steps:

1. **Web token storage.** AsyncStorage on web is `localStorage`-backed and
   readable by any script on the origin. Accepted for now (decision on record);
   revisit if the web target hardens. Not a 19a code choice - 19a just uses the
   existing persistence layer.
2. **`AuthProfileSummary` shape** is undocumented in the backend impl docs.
   19b or feature 21 must pin it from a live `GET /auth/me` response or a
   `platform-context` contract before any screen reads `account.profile`.
3. **Profile-verification wizard persistence.** The wizard
   (`slices/profileVerification.slice.ts`) collects DOB, categories, socials,
   languages, bio, username and currently persists nothing. Wiring it to
   `POST /profiles/onboarding-creator` / `-business` (Group D) is a flow
   decision for 19d or a dedicated later item, not 19a.
4. **`register` response gives no tokens** (201, `data: null`); the user must
   then `login` or verify an OTP. 19d needs to decide the post-sign-up
   navigation (straight to `login`, or an "verify your email" interstitial,
   given the known no-resend gap).

Last Note: If any thing missing in backend contract, create a plan of blueprint to add it. The plan should save as current plan. so that the backend contract can be updated accordingly. Now otp send of not created. SO update when creator register otp send to creator email. and also update the backend contract accordingly. backend code at C:\Users\Auto PC 2\Documents\influsis\backend
