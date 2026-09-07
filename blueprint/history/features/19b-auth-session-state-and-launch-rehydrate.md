# 19b - Auth session state + launch rehydrate

> Archived by `/complete`. Second leaf of build-plan item 19
> ("Real authentication + route guarding").

**Note:** Mobile app is `creator`-only for now. The session state and thunks
are role-agnostic; nothing here branches on `roleKey`.

**Branch:** `feature/auth-session-state-and-launch-rehydrate`

**Status:** completed - steps 1-2 verified (`npx tsc --noEmit` clean, `npm test`
green at 79 suites / 227 tests, lint clean). Step 3 (manual launch check) was
NOT performed before merge - `uiEvidence: when-available` and no dev server was
run. The `_layout.tsx` bootstrap and `Profile.tsx` logout wiring rest on unit
tests + code review only; confirm at runtime via `/try latest` or during 19c.

**Stacks on:** 19a. `feature/auth-api-client-and-token-store` is not merged yet,
so `/implement` must branch 19b from that branch (or from `feat/creator-auth`
once 19a lands there). 19b imports `services/tokenStore`, `services/auth.service`,
and the `AuthAccount` / `AuthTokens` types from 19a.

## Goal

Turn the token plumbing from 19a into real session state: a Redux slice that
holds `status` / `account` / `tokens`, a launch thunk that rehydrates from
storage (refreshing an expired token, ending the session on a definitive auth
rejection, staying signed in through a network blip), and a `signOut` thunk.
Replace the fake `getUserAsync` bootstrap. No route guards yet (19c) and no
auth-screen wiring yet (19d).

Backend contracts (from 19a's packet, read-only): `GET /auth/me`
(`GROUP_B_OWN_ACCOUNT.md`), `POST /auth/refresh` and its one-shot rotation
(`GROUP_A_PUBLIC_AUTH.md`), `POST /auth/logout` (`GROUP_B`). Error catalog:
`_CONVENTIONS.md`.

## In scope

- `slices/app.slice.ts` - rewrite around session state; keep `setUser` /
  `user` as a compatibility field for the two mock screens that still read it.
- `slices/app.thunks.ts` (new) - `bootstrapSession()` and `signOut()`.
- `slices/index.ts` - export the thunks.
- `utils/store.ts` - add the `AppThunk` type (additive).
- `services/tokenStore.ts` - add `getStoredAccount` / `setStoredAccount` /
  `clearStoredAccount` alongside the existing token helpers.
- `hooks/useDataPersist.ts` - add `DataPersistKeys.AUTH_ACCOUNT`.
- `app/_layout.tsx` - bootstrap through `dispatch(bootstrapSession())` instead
  of `getUserAsync`; hide the splash once `status` leaves `loading`.
- `scenes/main/Profile.tsx` - `handleLogout` dispatches `signOut()`.
- Delete `services/user.service.ts` and its `services/index.ts` re-export.
- Unit tests for the slice reducers, both thunks, and the new store helpers.

## Out of scope

- Route `_layout` guards, `app/index.tsx` first-run logic (19c).
- Wiring Sign In / Sign Up / OTP / password-reset screens (19d).
- Logout confirmation copy, the "why were you signed out" message for a
  suspended/deactivated account (19d).
- A generic 401-refresh interceptor for product endpoints - reassigned to
  feature 20 (no authenticated product calls exist yet; `getMe` and `logout`
  handle refresh inline here).
- `GET /profiles/me` and migrating `Profile.tsx` / `EditProfile.tsx` off the
  compat `user` field - feature 21.
- `expo-secure-store` (decided in 19a: AsyncStorage).

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
build all steps in one pass, one review packet, no checkpoint commits.
`/complete` makes the single feature commit.

Type gate per step: `npx tsc --noEmit`. Logic gate: `npm test` (Jest;
`verification.logicTests: "when-configured"` and a runner is configured, so
logic steps ship passing tests). `verification.uiEvidence: "when-available"` -
the `_layout` / `Profile` edits are integration-level; verify them with the dev
server / a manual run, not screen tests (coding-standards: no screen-integration
tests).

Each step must leave `npx tsc --noEmit` clean and the app compiling.

## Build steps

- [x] 1. **Stored-account helpers.** Add `DataPersistKeys.AUTH_ACCOUNT` and
     `getStoredAccount` / `setStoredAccount` / `clearStoredAccount` to
     `services/tokenStore.ts` (same AsyncStorage-wrapper pattern as the token
     helpers; a malformed stored value resolves to `null`, never throws). Extend
     `services/tokenStore.test.ts`.
     **Done when:** tests cover set/get round trip, `clearStoredAccount` removes
     the key, and a corrupt value yields `null`; `npm test` green;
     `npx tsc --noEmit` clean.

- [x] 2. **Session slice + thunks.** Rewrite `slices/app.slice.ts` to the state
     and reducers in Data / contracts (`sessionLoading`, `sessionAuthenticated`,
     `sessionEnded`, keep `setUser`; drop `setLoggedIn` and `reset` - no
     external callers besides `_layout` and `Profile`, both updated in this
     step). `useAppSlice` returns derived `checked` and `loggedIn` so
     `app/index.tsx` is unchanged. Add `slices/app.thunks.ts` with
     `bootstrapSession()` and `signOut()` per the algorithms below, `AppThunk`
     in `utils/store.ts`, and thunk exports in `slices/index.ts`. Rewrite
     `app/_layout.tsx` to `dispatch(bootstrapSession())` and hide the splash
     when `status !== 'loading'`. Update `scenes/main/Profile.tsx` `handleLogout`
     to `dispatch(signOut())` then `router.replace('/auth/sign-in')`. Delete
     `services/user.service.ts` and its re-export. Add `slices/app.slice.test.ts`
     and `slices/app.thunks.test.ts`.
     **Done when:** slice tests cover each reducer and the `deriveUser` mapping;
     thunk tests cover every branch in the algorithms below (real store per
     test, `@/services` mocked); `npm test` green; `npx tsc --noEmit` clean;
     `npm run lint` clean.

- [ ] 3. **Manual launch check (user-run).** Ships no code. `uiEvidence` is
     `when-available` and the dev server cannot be started from here, so this is
     a user-run check, not a hard gate. With `npm run dev`, confirm the
     19b-observable behavior: (a) cold start with no stored tokens - splash
     dismisses and the app lands on `/onboarding` (routing is unchanged; the
     authenticated-user redirect is 19c); (b) `app.status` transitions
     `loading -> unauthenticated` (or `-> authenticated` when `TOKENS` +
     `AUTH_ACCOUNT` are pre-seeded), visible in React DevTools - redux-logger is
     off in the dev env; (c) Profile > Logout removes `TOKENS`, `AUTH_ACCOUNT`
     and `USER` from AsyncStorage and returns to Sign In; (d) no crash on launch
     with or without stored tokens.
     **Done when:** the user reports these observations, or explicitly waives the
     manual check. Do not claim any of it was run otherwise.

## Files / areas

| Path | Change |
| --- | --- |
| `slices/app.slice.ts` | rewrite - session state, derived `checked`/`loggedIn`, `deriveUser` |
| `slices/app.thunks.ts` | new - `bootstrapSession`, `signOut` |
| `slices/index.ts` | export the thunks |
| `utils/store.ts` | add `export type AppThunk` |
| `services/tokenStore.ts` + `.test.ts` | add stored-account helpers |
| `hooks/useDataPersist.ts` | add `AUTH_ACCOUNT` |
| `app/_layout.tsx` | bootstrap via thunk, splash gated on `status` |
| `scenes/main/Profile.tsx` | `handleLogout` -> `signOut()` |
| `slices/app.slice.test.ts`, `slices/app.thunks.test.ts` | new |
| `services/user.service.ts` | delete |
| `services/index.ts` | drop `user.service` re-export |

`app/index.tsx`, `scenes/main/EditProfile.tsx` unchanged - they read `checked`
and `user` / `setUser`, all still provided.

## Data / contracts

### Slice state (`slices/app.slice.ts`)

```ts
type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AppState {
  status: SessionStatus;        // starts 'loading'
  account: AuthAccount | null;
  tokens: AuthTokens | null;
  user?: { name: string; email: string };  // compat for Profile/EditProfile; removed in feature 21
}
```

Reducers:

- `sessionLoading()` - `status = 'loading'` (used only if a later feature needs
  to re-enter the loading state; bootstrap starts there via `initialState`).
- `sessionAuthenticated({ account, tokens })` - sets both, `status =
  'authenticated'`, `user = deriveUser(account)`.
- `sessionEnded()` - `account = null`, `tokens = null`, `user = undefined`,
  `status = 'unauthenticated'`.
- `setUser(user | undefined)` - unchanged; `EditProfile` writes here.

`useAppSlice()` exposes raw state, `slice.actions`, and derived
`checked: status !== 'loading'`, `loggedIn: status === 'authenticated'`.

`deriveUser(account: AuthAccount | null): AppState['user']` -
`account` is `null` -> `undefined`; otherwise
`{ name: account.handle ?? account.email ?? '', email: account.email ?? '' }`.
`AuthAccount` carries no display name; the real name comes from
`GET /profiles/me` in feature 21.

### Persistence

| Key | Value | Written by | Cleared by |
| --- | --- | --- | --- |
| `DataPersistKeys.TOKENS` | `AuthTokens` JSON (19a) | `bootstrapSession` after a refresh, future login | `signOut`, auth-failure paths |
| `DataPersistKeys.AUTH_ACCOUNT` | `AuthAccount` JSON | `bootstrapSession` after `getMe` | `signOut`, auth-failure paths |
| `DataPersistKeys.USER` | `{ name, email }` (legacy) | `EditProfile` | `signOut` |

### `bootstrapSession()` thunk

Runs once from `app/_layout.tsx` after assets load. `initialState.status` is
`'loading'`.

1. `tokens = await getTokens()`. If `null` -> `dispatch(sessionEnded())`, return.
2. If `Date.now() >= tokens.tokenExpires - REFRESH_SKEW_MS` (`REFRESH_SKEW_MS =
   30_000`): try `tokens = await refresh(tokens.refreshToken)`, then
   `await setTokens(tokens)`.
   - `ApiError` with an `AUTH_*` code -> clear tokens + stored account,
     `dispatch(sessionEnded())`, return.
   - `NETWORK_ERROR` / `INTERNAL_ERROR` -> go to step 4 (optimistic path).
3. `account = await getMe(tokens.token)`:
   - success -> `await setStoredAccount(account)`,
     `dispatch(sessionAuthenticated({ account, tokens }))`, return.
   - `AUTH_SESSION_REVOKED` / `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED` -> one
     `refresh` + `setTokens` + single `getMe` retry; still failing -> clear +
     `sessionEnded()`, return.
   - `ACCOUNT_SUSPENDED` / `ACCOUNT_DEACTIVATED` -> clear + `sessionEnded()`
     (19d adds the user-facing reason), return.
   - `NETWORK_ERROR` / `INTERNAL_ERROR` -> step 4.
4. Optimistic path (offline / server blip, tokens not proven bad):
   `stored = await getStoredAccount()`. If `stored` ->
   `dispatch(sessionAuthenticated({ account: stored, tokens }))`. Else
   `dispatch(sessionEnded())` (nothing to show).

`app/_layout.tsx` calls `SplashScreen.hideAsync()` after the dispatched thunk
resolves (it always resolves; it never rejects).

### `signOut()` thunk

1. `tokens = await getTokens()`; if present, `await logout(tokens.token)` inside
   `try/catch` - a failure here (already-revoked, offline) is ignored.
2. `await clearTokens()`, `await clearStoredAccount()`,
   `removePersistData(DataPersistKeys.USER)`.
3. `dispatch(sessionEnded())`.

Navigation (`router.replace('/auth/sign-in')`) stays in `Profile.handleLogout`,
after the dispatch.

### Error handling boundary

Only `bootstrapSession` and `signOut` catch. They catch `ApiError` (19a) and
branch on `.code`; any non-`ApiError` throw propagates to the thunk's outer
`try/catch`, which treats it as the optimistic/`sessionEnded` path rather than
crashing the splash. No `console.log` (coding-standards); nothing is surfaced to
the user from this layer.

## Testing

Jest + `@jest/globals`, `jest.mock('@/services')` (or the specific modules),
`jest.mock('@react-native-async-storage/async-storage')` is already global.

- `services/tokenStore.test.ts` (extend) - stored-account round trip, clear,
  corrupt-value -> `null`.
- `slices/app.slice.test.ts` - `sessionAuthenticated` / `sessionEnded` /
  `setUser` reducers; `deriveUser` for `handle`, `email`-only, and all-`null`
  accounts; `checked` / `loggedIn` derivation for each status.
- `slices/app.thunks.test.ts` - real `configureStore({ reducer: { app } })` per
  test, `@/services` mocked. Cases: no tokens -> `sessionEnded`; fresh token +
  `getMe` ok -> `sessionAuthenticated` + account persisted; expired token ->
  `refresh` called, tokens persisted, then authenticated; `refresh` throws
  `AUTH_SESSION_REVOKED` -> tokens + account cleared, `sessionEnded`; `getMe`
  `AUTH_SESSION_REVOKED` -> refresh+retry -> authenticated; `getMe`
  `NETWORK_ERROR` with a stored account -> optimistic `sessionAuthenticated`;
  `getMe` `NETWORK_ERROR` with no stored account -> `sessionEnded`; `getMe`
  `ACCOUNT_SUSPENDED` -> cleared + `sessionEnded`. `signOut`: calls `logout`,
  clears all three keys, `sessionEnded`, and still ends the session when
  `logout` rejects.

`Date.now` is read in one place (the skew check); tests stub it with
`jest.spyOn(Date, 'now')`.

Predicted net: ~2 new suites + `tokenStore` extension, ~20 cases. Existing 200
stay green (181 on `feat/creator-auth` + 19 from 19a on the stacked branch).

## Notes for the AI

- Branch from the 19a branch (see Stacks on). Do not re-implement anything from
  19a.
- The slice keeps `user` / `setUser` purely so `Profile.tsx` (hero display) and
  `EditProfile.tsx` (name/email edit) compile untouched. Do not migrate those
  screens here.
- `app/index.tsx` must not need editing - `checked` is derived. If it would,
  the derivation is wrong.
- Thunks are plain (`(): AppThunk => async (dispatch) => {}`), not
  `createAsyncThunk` - the branching has more than three outcomes.
- Keep `bootstrapSession` resolvable-always: the caller hides the splash on
  resolve, so an unhandled rejection would hang the splash.
- Branch on `ApiError.code`, never `message`.
- `utils/store.ts` middleware already includes thunk (RTK default) - only the
  `AppThunk` type is added.
- Match 19a's terse module style; comment only the non-obvious (the skew
  constant, the optimistic path's rationale).

## Open questions

None block 19b. Carried forward:

1. **Display name.** `deriveUser` shows `handle` or `email` because
   `GET /auth/me` has no name field. Feature 21 adds `GET /profiles/me` and
   migrates `Profile` / `EditProfile` to the real profile record, then removes
   the compat `user` field.
2. **Generic 401 refresh.** Reassigned from 19a's note to feature 20 - a shared
   interceptor only pays off once product endpoints are being called. 19b
   handles refresh inline for its two authenticated calls.
3. **Suspended / deactivated at launch.** 19b ends the session silently; 19d
   decides the message the user sees.
