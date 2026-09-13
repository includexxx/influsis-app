# Feature: Auth HTTP foundation (19a)

**From build-plan:** feature 19a (first leaf of item 19, "Real creator
authentication (server-wired)")
**Status:** verified
**Branch:** `feature/auth-http-foundation`

## Goal

Stand up the client-side HTTP plumbing every later auth step (19b-19g) needs,
and nothing else:

- an **axios** instance that speaks the backend's `/api/v1` response envelope
  and turns any failure into a typed `ApiError` carrying the machine-readable
  `code`,
- an **AsyncStorage-backed token store** for the access/refresh pair,
- a **request interceptor** that attaches `Authorization: Bearer <accessToken>`,
- a **response interceptor** that, on a `401`, performs a **one-shot,
  single-flight refresh** against `POST /auth/refresh`, persists the rotated
  pair atomically, retries the original request once, and on a definitive
  refresh failure clears the stored session and notifies a registered handler.

This step adds modules only. No screen, navigation, Redux, or app-bootstrap
behavior changes; the app keeps building and running on the existing mock
fixtures. RTK Query, the session slice, and screen wiring are 19b+.

Backend contracts (implementation authority, read-only for this repo):

- `../platform-context/api-contracts/README.md` - response/error envelope,
  the exhaustive error-`code` catalog, headers, base path.
- `../platform-context/api-contracts/auth.md` - `POST /auth/refresh` (Bearer
  **refresh** token, empty body, one-shot rotation), `GET /auth/me`,
  `POST /auth/login` / `register` / `otp/*` / `reset-password` /
  `login/2fa/verify`, `POST /auth/logout`.
- `../backend/docs/Implementations/GROUP_A_PUBLIC_AUTH.md` - refresh rotation
  and reuse-detection detail.

## In scope

- `types/api.ts` (new) - `ApiEnvelope<T>`, `ApiListEnvelope<T>`, `PageMeta`,
  `ApiErrorBody`, and `ApiErrorCode` (string-literal union of the documented
  codes plus the synthetic `NETWORK_ERROR` / `UNKNOWN`). Re-exported from
  `types/index.ts`.
- `types/auth.ts` (new) - `AuthTokens`, `AuthAccount`, `AuthRole`,
  `AuthProfileSummary` (the `GET /auth/me` shape). The existing mock `User`
  interface in `types/user.ts` is left untouched. Re-exported from
  `types/index.ts`.
- `services/http.ts` (new) - the configured axios instance (`httpClient`), the
  `ApiError` class, `request<T>()` thin helper, and
  `setUnauthorizedHandler(fn)`.
- `services/tokenStore.ts` (new) - `getTokens` / `setTokens` / `clearTokens`
  over `DataPersistKeys.TOKENS`, with a synchronous in-memory mirror so the
  request interceptor does not hit AsyncStorage on every call.
- `services/index.ts` - export the new modules (keep the existing
  `user.service` export; 19b removes it).
- `hooks/useDataPersist.ts` - add the `TOKENS` enum member only.
- `package.json` - add `axios` to `dependencies`.
- Co-located Jest unit tests: `services/http.test.ts`,
  `services/tokenStore.test.ts`.

## Out of scope

- Any change to `slices/`, `utils/store.ts`, `app/_layout.tsx`,
  `app/index.tsx`, or route `_layout` files (19b, 19c).
- RTK Query, `axiosBaseQuery`, and the typed auth endpoints (19b).
- Registering a real unauthorized handler / dispatching a session end (19b -
  19a ships the hook unset, a no-op).
- Wiring any auth screen, the OTP screens, or the Profile logout row (19d-19g).
- react-hook-form / zod (19d).
- Removing or rewriting `services/user.service.ts` / `getUserAsync` (19b).
- `expo-secure-store` - decided: AsyncStorage via the existing persistence
  layer, matching every other persisted value in this app.
- Proactive/scheduled refresh before expiry - 19b's launch rehydrate does the
  skew check; 19a only reacts to a `401`.
- Pointing `API_URL` at a production/staging environment (feature 22).
- A generic retry/backoff policy, request cancellation, or offline queueing.

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`
(from `blueprint/config.json`): implement all build steps in one pass, keeping
the project compiling after each, then present one review packet. No per-step
approval pause, no checkpoint commits. `/complete` creates the single feature
commit and merges after approval.

There is no `typecheck` npm script, so the per-step type gate is
`npx tsc --noEmit`. Logic gate: `npm test` (Jest, `--passWithNoTests`; a
required gate for logic-bearing steps per `coding-standards.md`). `npm run lint`
must stay clean. All three must be green before the review packet and before
`/complete`. No dev server or live backend call is part of this feature's
evidence (pure client modules, unit-tested with a stubbed axios adapter).

## Build steps

- [x] **Step 1 - API + auth types.** Add `types/api.ts` and `types/auth.ts` per
  Data / contracts and re-export both from `types/index.ts`. `ApiErrorCode` is
  a string-literal union of exactly the catalog in
  `api-contracts/README.md` plus `NETWORK_ERROR` and `UNKNOWN`. Nothing outside
  `types/` imports them yet.
  *Done when:* `npx tsc --noEmit` is clean; `npm test` is still green;
  `git grep -l "types/api\|types/auth"` shows references only under `types/`.

- [x] **Step 2 - Token store.** Add `TOKENS = 'TOKENS'` to `DataPersistKeys`
  in `hooks/useDataPersist.ts`. Add `services/tokenStore.ts`:
  `getTokens(): Promise<AuthTokens | null>`,
  `setTokens(t: AuthTokens): Promise<void>`,
  `clearTokens(): Promise<void>`, plus a synchronous
  `peekAccessToken(): string | null` reading the in-memory mirror. Wrap
  `AsyncStorage` directly (sanctioned for a service module; components still go
  through `useDataPersist`). The whole `AuthTokens` object is JSON-serialized
  under the one key. A malformed stored value resolves to `null`, never throws.
  `setTokens` / `clearTokens` update the in-memory mirror and storage together.
  Add `services/tokenStore.test.ts` (AsyncStorage is globally mocked in
  `jest.setup.js`).
  *Done when:* tests cover set-then-get round trip, `clearTokens` removes the
  key and nulls the mirror, a corrupt stored string yields `null`, and
  `peekAccessToken()` returns the value set by `setTokens` without a storage
  read (spy on `AsyncStorage.getItem`); `npm test` green; `npx tsc --noEmit`
  clean.

- [x] **Step 3 - axios instance + envelope handling.** Add `services/http.ts`:
  - `httpClient = axios.create({ baseURL: config.apiUrl, headers: { 'Content-Type': 'application/json' }, timeout: 15000 })`.
    `config.apiUrl` already includes the `/api/v1` suffix (see `.env.dev`), so
    request paths are `/auth/login` etc.
  - `class ApiError extends Error` with readonly `code: ApiErrorCode`,
    `statusCode: number`, `errors: Record<string, string> | null`,
    `requestId?: string`.
  - A **response interceptor** (fulfilled arm) that unwraps `response.data` to
    `body.data` when `body.success === true`.
  - A response interceptor (rejected arm) that maps failures to `ApiError`:
    an envelope with `success === false` -> `ApiError` from its fields; a
    response with no parseable envelope -> `ApiError` `code: 'UNKNOWN'` (2xx)
    or `'INTERNAL_ERROR'` (>=500) / `'BAD_REQUEST'` (4xx) using `statusCode`
    from the response; no response at all (`error.request` set, `error.response`
    undefined) or a thrown/timeout error -> `ApiError` `code: 'NETWORK_ERROR'`,
    `statusCode: 0`.
  - `request<T>(config): Promise<T>` - a thin wrapper over `httpClient(config)`
    typed to the unwrapped payload.
  - Export `httpClient`, `ApiError`, `request`. Update `services/index.ts`.
  Add `services/http.test.ts` driving the instance via a stubbed
  `httpClient.defaults.adapter` (a jest fn returning a synthetic
  `AxiosResponse` or rejecting with an `AxiosError`); no real network.
  *Done when:* tests cover (a) `success: true` -> resolves with `data`,
  (b) `success: false` -> rejects with `ApiError` carrying the exact
  `code` / `statusCode` / `errors`, (c) no-response error -> `ApiError`
  `NETWORK_ERROR` / `statusCode 0`, (d) an unparseable 500 -> `ApiError`
  `INTERNAL_ERROR`; `npm test` green; `npx tsc --noEmit` and `npm run lint`
  clean.

- [x] **Step 4 - request interceptor (bearer token).** Add a request
  interceptor to `httpClient` that sets `Authorization: Bearer <token>` from
  `tokenStore.peekAccessToken()` unless the request config carries
  `skipAuth: true` (augment the axios request config type in `services/http.ts`
  via module augmentation or a local `AuthRequestConfig` type). The auth
  endpoints that must never send a stale access token (`/auth/login`,
  `/auth/register`, `/auth/otp/request`, `/auth/otp/verify`,
  `/auth/reset-password`, `/auth/refresh`, `/auth/login/2fa/verify`) are called
  by 19b with `skipAuth: true`; 19a only provides the mechanism.
  Extend `services/http.test.ts`.
  *Done when:* tests cover the header present when a token is stored and absent
  both when no token is stored and when `skipAuth: true` is set; `npm test`
  green; `npx tsc --noEmit` clean.

- [x] **Step 5 - response interceptor (one-shot single-flight refresh).**
  Extend the rejected arm of the response interceptor: on an `ApiError` with
  `statusCode === 401` for a request that is **not** `skipAuth` and has not
  already been retried (`config._retry` unset):
  1. If `tokenStore.getTokens()` has no `refreshToken`, reject with the
     `ApiError` unchanged.
  2. Otherwise call `refreshTokens()` - a module-level function guarded by a
     single shared `let refreshPromise: Promise<AuthTokens> | null`. It POSTs
     `/auth/refresh` on a **bare** axios call (no interceptors, to avoid
     recursion) with `Authorization: Bearer <refreshToken>` and an empty body,
     unwraps the envelope, `await tokenStore.setTokens(next)`, clears
     `refreshPromise`, and returns the new pair. On failure it
     `await tokenStore.clearTokens()`, calls the registered unauthorized
     handler, clears `refreshPromise`, and rethrows an `ApiError`.
  3. On refresh success, set `config._retry = true`, overwrite the request's
     `Authorization` header with the new access token, and re-issue it through
     `httpClient`.
  4. On refresh failure, reject with the `ApiError` from `refreshTokens()`.
  `setUnauthorizedHandler(fn: () => void)` stores the handler in a module
  variable (default: a no-op). Extend `services/http.test.ts`.
  *Done when:* tests cover (a) a `401` triggers exactly one `/auth/refresh`
  and the original request is retried once with the new token and then
  resolves, (b) two concurrent `401`s share one refresh call (single-flight),
  (c) a failing refresh clears the token store, invokes the handler set via
  `setUnauthorizedHandler`, and rejects with an `ApiError`, (d) a `401` with no
  stored refresh token rejects immediately with no refresh attempt, (e) a
  `401` on a `skipAuth` request is passed through untouched; `npm test` green;
  `npx tsc --noEmit` and `npm run lint` clean.

## Files / areas

| Path | Change |
| --- | --- |
| `types/api.ts` | new - envelope, `PageMeta`, `ApiErrorBody`, `ApiErrorCode` |
| `types/auth.ts` | new - `AuthTokens`, `AuthAccount`, `AuthRole`, `AuthProfileSummary` |
| `types/index.ts` | re-export `./api`, `./auth` |
| `types/user.ts` | untouched (mock `User` stays) |
| `services/http.ts` | new - `httpClient`, `ApiError`, `request`, interceptors, `setUnauthorizedHandler` |
| `services/tokenStore.ts` | new - token persistence + in-memory mirror |
| `services/index.ts` | export `./http`, `./tokenStore` (keep `./user.service`) |
| `hooks/useDataPersist.ts` | add `DataPersistKeys.TOKENS` |
| `package.json` | add `axios` dependency |
| `services/http.test.ts`, `services/tokenStore.test.ts` | new |

`utils/config.ts` is read but not changed. `app/`, `slices/`, `utils/store.ts`
are not touched.

## Data / contracts

### `types/api.ts`

```ts
interface ApiEnvelope<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta: PageMeta | null;
  requestId: string;
  timestamp: string;
  path: string;
}

interface ApiListEnvelope<T> extends Omit<ApiEnvelope<T[]>, 'meta'> {
  meta: PageMeta;
}

interface PageMeta {
  page: number;
  limit: number;
  itemCount: number;
  hasNextPage: boolean;
  totalCount?: number;
  pageCount?: number;
}

interface ApiErrorBody {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  errors: Record<string, string> | { required: string[]; mode: string } | null;
  requestId: string;
  timestamp: string;
  path: string;
}

type ApiErrorCode =
  | 'BAD_REQUEST' | 'MALFORMED_JSON'
  | 'AUTH_TOKEN_MISSING' | 'AUTH_TOKEN_INVALID' | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_SESSION_REVOKED' | 'AUTH_TOKEN_STALE' | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_MFA_REQUIRED' | 'AUTH_MFA_INVALID_CODE'
  | 'FORBIDDEN' | 'INSUFFICIENT_ROLE' | 'INSUFFICIENT_PERMISSION'
  | 'STEP_UP_REQUIRED' | 'ACCOUNT_SUSPENDED' | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_PENDING_VERIFICATION' | 'SELF_ACTION_FORBIDDEN' | 'NOT_RESOURCE_OWNER'
  | 'NOT_FOUND'
  | 'CONFLICT' | 'ALREADY_EXISTS' | 'HANDLE_TAKEN' | 'HANDLE_RESERVED'
  | 'ROLE_IN_USE' | 'INVALID_STATE_TRANSITION'
  | 'VALIDATION_FAILED' | 'BUSINESS_RULE_VIOLATION'
  | 'MEDIA_INVALID_TYPE' | 'MEDIA_TOO_LARGE'
  | 'RATE_LIMITED' | 'OTP_ATTEMPTS_EXCEEDED'
  | 'INTERNAL_ERROR' | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR' | 'UNKNOWN';
```

The catalog list is copied verbatim from `api-contracts/README.md` "Error
codes" (the file says it is exhaustive - do not invent codes client-side). Only
`NETWORK_ERROR` and `UNKNOWN` are synthetic, generated by `http.ts` for
transport / unparseable failures.

### `types/auth.ts`

Shape of `GET /auth/me` (`MeResponseDto` in `api-contracts/auth.md`):

```ts
interface AuthTokens {
  token: string;         // access token (JWT)
  refreshToken: string;  // refresh token (JWT); Bearer for POST /auth/refresh
  tokenExpires: number;  // epoch MILLISECONDS
}

type SessionAccountStatus =
  | 'active' | 'pending' | 'invited' | 'suspended' | 'deactivated' | 'unverified';

interface AuthRole {
  key: string;
  displayName: string;
  description: string;
  isInternal: boolean;
  requires2fa: boolean;
  permissionsVersion: number;
  sortOrder: number;
}

interface AuthProfileSummary {
  kind: 'business' | 'creator' | 'admin';
  displayName: string;
  avatarUrl: string | null;
  verificationStatus: string;
}

interface AuthAccount {
  id: string;
  roleKey: string;
  status: SessionAccountStatus;
  role: AuthRole | null;
  createdAt: string;
  deactivatedAt: string | null;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  handle: string | null;
  profile: AuthProfileSummary | null;
}
```

`unverified` is included in `SessionAccountStatus` because a fresh creator
registration lands there and can still log in; `api-contracts/auth.md` lists
the other five explicitly and `GROUP_A_PUBLIC_AUTH.md` confirms `unverified`
is a real value returned in the login/`me` `user` payload.

### `ApiError`

- Constructed from an `ApiErrorBody` (real server error) or a synthesized
  `{ code, statusCode, message, errors? }` (transport / unparseable).
- `code` is stored as `ApiErrorCode`; an unrecognized server `code` string is
  still stored as-is (typed via `as ApiErrorCode`) rather than dropped, so no
  information is lost - callers branch on known members and fall through.
- `errors` normalizes to `Record<string, string> | null` for the
  `VALIDATION_FAILED` field-map case; the permission-shape `errors` object is
  kept as `null` for 19a's purposes (no permission-gated call here).
- `message` is the server `message` verbatim, or a fixed fallback string for
  the synthetic cases. Never contains a token.

### Token store

| Key | Value | Written by | Cleared by |
| --- | --- | --- | --- |
| `DataPersistKeys.TOKENS` | `AuthTokens` JSON | `setTokens` (19b login/verify, refresh interceptor) | `clearTokens` (19b signOut, refresh-failure path) |

- In-memory mirror is the source of truth for `peekAccessToken()`; it is
  seeded on the first `getTokens()` and updated on every `setTokens` /
  `clearTokens`. A process restart starts with an empty mirror; 19b's launch
  rehydrate calls `getTokens()` early, which seeds it.
- `setTokens` writes storage and mirror; if the storage write rejects it still
  updates the mirror and rethrows (caller decides) - a persisted-token write
  failure is rare and 19b surfaces it.

### Refresh (`POST /auth/refresh`)

- **Bearer the refresh token**, not the access token. Empty body.
- Response `data`: `{ token, refreshToken, tokenExpires }` - a full new pair.
  **One-shot rotation**: the previous refresh token is now invalid, and
  replaying it revokes the whole session chain. So `setTokens(next)` must land
  before any retried request goes out, and a failed refresh must
  `clearTokens()` (no automatic re-try of a refresh).
- Called on a bare `axios` request (interceptor-free) to avoid recursion.
- Single-flight: one shared `refreshPromise` for all concurrent `401`s.
- Refreshable trigger for 19a: **any `401`** on a non-`skipAuth`, not-yet-retried
  request. A refresh that itself returns `401` / `403` account status is the
  definitive-failure path (clear + handler + reject).

### Trusted values / redaction

- The access token is attached only from `tokenStore`; no caller passes a token
  into `request()`.
- Tokens never appear in `ApiError.message`, thrown errors, or any log. No
  `console.*` in this feature (`coding-standards.md`).
- `skipAuth` is a client-set request flag only; it has no security meaning
  server-side (the endpoints it marks are `@Public()` on the backend).

## Testing

Jest (`jest-expo`) + `@jest/globals`. AsyncStorage is globally mocked in
`jest.setup.js`. No React Native Testing Library here (no components). No
screen/integration tests (`coding-standards.md`). No dev server, no live
backend.

- `services/tokenStore.test.ts` - set/get round trip; `clearTokens` removes the
  key and nulls the mirror; corrupt stored string -> `null`;
  `peekAccessToken()` returns the set value with `AsyncStorage.getItem` not
  called again (spy).
- `services/http.test.ts` - drive `httpClient` with a stubbed
  `httpClient.defaults.adapter` (jest fn). Cases: envelope unwrap; `ApiError`
  from `success:false` with exact `code`/`statusCode`/`errors`; `NETWORK_ERROR`
  on no-response; `INTERNAL_ERROR` on unparseable 500; bearer header present /
  absent / suppressed by `skipAuth`; `401` -> single `/auth/refresh` + one
  retry -> resolve; concurrent `401`s share one refresh; failing refresh ->
  `clearTokens` + unauthorized handler + `ApiError`; `401` with no refresh
  token -> immediate reject; `401` on `skipAuth` -> pass-through.

Predicted: 2 new suites, ~20 cases. Existing suites stay green.

## Notes for the AI

- **Terse module style.** Match the existing `services/` and `types/` files:
  no banner comments, no JSDoc that restates the signature. Comment only the
  non-obvious - the single-flight rationale, why refresh uses a bare axios
  call, why `tokenExpires` is milliseconds.
- **No `any`.** Use `unknown` + narrowing for the envelope parse. Augment the
  axios request config type for `skipAuth` / `_retry` via module augmentation
  (`declare module 'axios'`) or a local extended type - do not cast to `any`.
- **`config.apiUrl` already ends in `/api/v1`** (`.env.dev`). Do not append it
  again. When `API_URL` is unset, `app.config.ts` yields `https://example.com`
  and calls will 404 - that is expected until feature 22; tests never hit the
  network.
- The refresh interceptor **must not** import from `slices/` or `utils/store.ts`
  - the decoupling point is `setUnauthorizedHandler`, which 19b calls once at
  store setup. In 19a it is an unset no-op.
- Do not touch `services/user.service.ts`, `slices/app.slice.ts`,
  `app/_layout.tsx`, or any route file. If a change there seems necessary, it
  belongs in 19b - stop and note it.
- Branch on `ApiError.code` / `.statusCode`, never on `.message`.
- No em dashes, en dashes, or ellipsis characters in code, comments, or docs
  (`coding-standards.md`).
- The mobile app is **creator-only**. 19a is role-agnostic (it moves tokens and
  errors), but later leaves hard-code `roleKey: 'creator'` on register.
