# Feature: Route guarding (19c)

**From build-plan:** feature 19c (third leaf of item 19, "Real creator
authentication (server-wired)")
**Status:** verified
**Branch:** `feature/route-guarding`

## Goal

Enforce the entry gate the app has always implied but never checked: an
unauthenticated visitor can only reach onboarding and the auth screens, and an
authenticated creator can only reach the app shell (never back into
sign-in/onboarding). The decision is one pure function, `authGate`, consulted
by `app/index.tsx` and by one `_layout` guard per route group.

19b left a `setLoggedIn` bridge into `app.slice` "until 19c routes on
`auth.slice` directly." 19c does that and retires the bridge: `app.slice` loses
its `checked` / `loggedIn` fields, and logout becomes a real client-side
session teardown (`signOut` thunk) instead of a boolean flip.

Still no `react-hook-form`, no auth-endpoint wiring from a screen, no server
`POST /auth/logout`. Those are 19d-19g. Every product screen still runs on
`data/*.ts` fixtures.

## Security note

This guard is **UX only**. The real authorization boundary is the backend: every
`(main)` / `(details)` data call carries the bearer token (19a interceptor) and
the server rejects an unauthenticated or under-permissioned request regardless
of what the client renders. `authGate` exists so a signed-out user does not see
an empty app shell, not to protect data.

## Backend contracts

None consumed directly. 19c reads `auth.slice.status` (populated by 19b's
`restoreSession` from `GET /auth/me`) and never calls an endpoint itself. The
`signOut` thunk clears local state only; the server session revoke
(`POST /auth/logout`) is a later leaf.

## In scope

- `utils/authGate.ts` (new) - a pure `authGate(status, group, area?)` returning
  a `{ type: 'wait' | 'allow' | 'redirect'; href? }` discriminated union. No
  React, no router, no store import - just the rule table.
- `utils/authGate.test.ts` (new) - the full status x group matrix.
- `slices/auth.slice.ts` - add a `signOut` async thunk: dispatch
  `sessionEnded()` and `authApi.util.resetApiState()` synchronously, then
  `await clearTokens()`. No new reducer (reuses `sessionEnded`).
- `slices/auth.slice.test.ts` - add `signOut` cases.
- `slices/index.ts` - export `signOut` and `sessionEnded`.
- `app/index.tsx` - replace the unconditional `<Redirect href="/onboarding" />`
  with session-based routing: `restoring` renders `null`; `authenticated` ->
  `/home`; `unauthenticated` -> `/onboarding`.
- `app/(auth)/_layout.tsx` (new) - `useAuthSlice()` + `useSegments()`, call
  `authGate(status, '(auth)', segments[1])`, honor the result, else render
  `<Stack screenOptions={{ headerShown: false }} />`.
- `app/(details)/_layout.tsx` (new) - same pattern, `authGate(status,
  '(details)')`, else `<Stack screenOptions={{ headerShown: false }} />`.
- `app/(main)/_layout.tsx` - add the same guard above the existing `<Tabs>`
  (`authGate(status, '(main)')`); the Tabs config is unchanged.
- `app/_layout.tsx` - drop the `setLoggedIn` bridge and the now-unused
  `useAppSlice` import; the effect just `await dispatch(restoreSession())` then
  hides the splash.
- `slices/app.slice.ts` - remove `checked`, `loggedIn`, and the `setLoggedIn`
  reducer from `AppState` / `initialState` / `reducers`. Keep `user`,
  `setUser`, `reset`, and `useAppSlice`.
- `scenes/main/Profile.tsx` - the logout handler dispatches `signOut()` instead
  of `setLoggedIn(false)`; it keeps `removePersistData(USER)`,
  `dispatch(setUser(undefined))`, and `router.replace('/auth/sign-in')`.

## Out of scope

- Wiring `SignIn` / `SignUp` / `VerifyOtp` / `ForgotPassword` / `ResetPassword`
  to real endpoints, and `react-hook-form` / `zod` (19d, 19e, 19f).
- `POST /auth/logout` (server session revoke). `signOut` is local teardown for
  now; the later leaf adds the network call inside the same thunk.
- Forcing profile-verification completion as a hard gate. The backend lets a
  `pending` / `unverified` creator log in and use the app, and the post-signup
  push into the wizard is already done by the existing scene navigation
  (`VerifyOtp` -> `router.replace('/profile-verification/...')`). `authGate`
  allows an authenticated user into both `(main)` and
  `(auth)/profile-verification`; it does not redirect a profile-less account
  out of `(main)`. Revisit if a product rule says otherwise.
- Persisting "carousel already seen" so a returning signed-out user skips
  straight to `/auth`. Not in the packet; unauthenticated still lands on
  `/onboarding`.
- Removing `app.slice.user` / `setUser` or the mock name/email on the Profile
  screen. That is a profile-feature concern, untouched here.
- Role-based routing (creator vs business). The mobile app is creator-only.
- Per-subtree guards inside `(details)` (`withdraw/`, `campaign/[id]/`, etc.).
  The single `(details)/_layout.tsx` covers the whole subtree.

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`
(from `blueprint/config.json`): implement every step in one pass, keeping the
project compiling and tests green after each, then present one review packet.
No per-step approval pause, no checkpoint commits. `/complete` makes the single
feature commit and merges into `feat/server-auth` after approval.

Gates (no `typecheck` script exists):

- `npx tsc --noEmit` clean
- `npm test` green (Jest; a required gate for the `authGate` and `signOut`
  logic)
- `npm run lint` clean (0 errors; the pre-existing `app/_layout.tsx`
  exhaustive-deps warning stays and its dependency list shrinks)

The layout guard components are navigation glue (no unit test per
`coding-standards.md`: "full screen/scene integration ... Verify those with the
dev server ... not brittle integration tests"). Their behavior is proven by
`authGate`'s unit tests plus the manual try path below. No dev server is part
of this feature's automated evidence.

## Build steps

- [x] **Step 1 - `authGate` helper + tests.** Add `utils/authGate.ts`:

  ```ts
  import { AuthStatus } from '@/slices/auth.slice';

  export type GateGroup = '(auth)' | '(main)' | '(details)';
  export type GateResult =
    | { type: 'wait' }
    | { type: 'allow' }
    | { type: 'redirect'; href: '/home' | '/onboarding' };

  export function authGate(status: AuthStatus, group: GateGroup, area?: string): GateResult;
  ```

  Rules: `status === 'restoring'` -> `wait`. Then, with
  `authed = status === 'authenticated'`:
  - `group === '(main)' || group === '(details)'` -> `authed` ? `allow` :
    `redirect '/onboarding'`.
  - `group === '(auth)'` and `area === 'profile-verification'` -> `authed` ?
    `allow` : `redirect '/onboarding'`.
  - `group === '(auth)'` otherwise (`auth`, `onboarding`, or `area`
    undefined) -> `authed` ? `redirect '/home'` : `allow`.

  Add `utils/authGate.test.ts` covering every `(status, group, area)`
  combination that the rule table distinguishes (see Testing).
  *Done when:* `npx tsc --noEmit` clean; `npm test` green with the new suite;
  `git grep -l "expo-router\|react" utils/authGate.ts` returns nothing (the
  helper stays pure).

- [x] **Step 2 - `signOut` thunk.** In `slices/auth.slice.ts` add:

  ```ts
  export const signOut = createAsyncThunk('auth/signOut', async (_, { dispatch }) => {
    dispatch(sessionEnded());
    dispatch(authApi.util.resetApiState());
    await clearTokens();
  });
  ```

  `sessionEnded` is dispatched synchronously (before the first `await`) so a
  caller can navigate immediately against a consistent `unauthenticated`
  status. Add it to the `useAuthSlice` return object. Export `signOut` and
  `sessionEnded` from `slices/index.ts`. Extend `slices/auth.slice.test.ts`.
  *Done when:* tests cover (a) `signOut` moves status to `unauthenticated` and
  nulls `account`, (b) `signOut` calls `clearTokens` (spy) so
  `getTokens()` resolves `null` afterward; `npm test` green; `npx tsc --noEmit`
  and `npm run lint` clean.

- [x] **Step 3 - session-based index + `app.slice` cleanup.**
  - `slices/app.slice.ts`: drop `checked`, `loggedIn`, `setLoggedIn` from
    `AppState`, `initialState`, and `reducers`. `AppState` becomes
    `{ user?: User }`.
  - `app/_layout.tsx`: remove `useAppSlice`; take `dispatch` and
    `restoreSession` from `useAuthSlice()`; the effect becomes
    `await Promise.all([loadImages(), loadFonts()]).catch(() => {});
    await dispatch(restoreSession());` inside `try`, `SplashScreen.hideAsync()`
    in `finally`.
  - `app/index.tsx`: `const { status } = useAuthSlice();`
    `if (status === 'restoring') return null;`
    `return <Redirect href={status === 'authenticated' ? '/home' : '/onboarding'} />;`
  *Done when:* `git grep -n "checked\|loggedIn\|setLoggedIn" slices app` shows
  no remaining references (the Checkbox/Toggle `accessibilityState.checked` in
  component tests is unrelated and stays); `npx tsc --noEmit` clean; `npm test`
  green; `npm run lint` clean.

- [x] **Step 4 - the three layout guards.** Each reads
  `const { status } = useAuthSlice();`, computes a `GateResult`, and:
  `if (gate.type === 'wait') return null;`
  `if (gate.type === 'redirect') return <Redirect href={gate.href} />;`
  then renders its container.
  - `app/(auth)/_layout.tsx` (new): also `const segments = useSegments();`,
    `authGate(status, '(auth)', segments[1])`, container
    `<Stack screenOptions={{ headerShown: false }} />`.
  - `app/(details)/_layout.tsx` (new): `authGate(status, '(details)')`,
    container `<Stack screenOptions={{ headerShown: false }} />`.
  - `app/(main)/_layout.tsx`: add the guard (`authGate(status, '(main)')`)
    before the existing `<Tabs>`; keep `useTheme` and every `Tabs.Screen`
    exactly as they are.
  `Redirect`, `Stack`, `useSegments` come from `expo-router`.
  *Done when:* `npx tsc --noEmit` clean; `npm test` green; `npm run lint`
  clean; the manual try path below behaves as described (evidence gathered in
  `/check`, not here).

- [x] **Step 5 - Profile logout.** In `scenes/main/Profile.tsx`, change
  `handleLogout`: keep `setIsLogoutConfirmOpen(false)`,
  `removePersistData(DataPersistKeys.USER)`, `dispatch(setUser(undefined))`,
  and `router.replace('/auth/sign-in')`; replace `dispatch(setLoggedIn(false))`
  with `dispatch(signOut())` (from `useAuthSlice()`; add the hook alongside the
  existing `useAppSlice()` call). Remove `setLoggedIn` from the `useAppSlice()`
  destructure.
  *Done when:* `git grep -n setLoggedIn` returns nothing; `npx tsc --noEmit`
  clean; `npm test` green; `npm run lint` clean; tapping "Log Out" in the
  running app returns to the sign-in screen and a relaunch stays signed out
  (evidence in `/check`).

## Files / areas

| Path | Change |
| --- | --- |
| `utils/authGate.ts` | new - pure gate rule table |
| `utils/authGate.test.ts` | new - status x group matrix |
| `slices/auth.slice.ts` | add `signOut` thunk, expose via `useAuthSlice` |
| `slices/auth.slice.test.ts` | `signOut` cases |
| `slices/index.ts` | export `signOut`, `sessionEnded` |
| `slices/app.slice.ts` | remove `checked` / `loggedIn` / `setLoggedIn` |
| `app/index.tsx` | session-based redirect |
| `app/_layout.tsx` | drop the `setLoggedIn` bridge |
| `app/(auth)/_layout.tsx` | new - segment-aware guard + `<Stack>` |
| `app/(details)/_layout.tsx` | new - guard + `<Stack>` |
| `app/(main)/_layout.tsx` | add guard above `<Tabs>` |
| `scenes/main/Profile.tsx` | logout -> `signOut()` |

`slices/auth.slice.ts`'s existing `restoreSession`, `sessionEstablished`,
`accountUpdated` are unchanged. No route file under `app/**` other than the
three layouts and `index.tsx` is touched.

## Data / contracts

### `authGate` rule table

| status | group | area | result |
| --- | --- | --- | --- |
| `restoring` | any | any | `wait` (render `null`) |
| `unauthenticated` | `(main)` | - | `redirect /onboarding` |
| `unauthenticated` | `(details)` | - | `redirect /onboarding` |
| `unauthenticated` | `(auth)` | `auth` | `allow` |
| `unauthenticated` | `(auth)` | `onboarding` | `allow` |
| `unauthenticated` | `(auth)` | `profile-verification` | `redirect /onboarding` |
| `authenticated` | `(main)` | - | `allow` |
| `authenticated` | `(details)` | - | `allow` |
| `authenticated` | `(auth)` | `auth` | `redirect /home` |
| `authenticated` | `(auth)` | `onboarding` | `redirect /home` |
| `authenticated` | `(auth)` | `profile-verification` | `allow` |

- `href` is only ever `'/home'` or `'/onboarding'` - both are real, always
  mounted routes (`app/(main)/home.tsx`, `app/(auth)/onboarding/index.tsx`).
- The helper never inspects `account` or `account.profile`. Profile-completion
  is not a routing gate in 19c (see Out of scope).
- `area` is `segments[1]` from `useSegments()` for the `(auth)` group
  (`['(auth)', 'auth', 'sign-in']` -> `'auth'`). For `(main)` / `(details)`
  the caller passes no `area`.

### `signOut` thunk

| Step | Sync? | Effect |
| --- | --- | --- |
| `dispatch(sessionEnded())` | yes | `status -> 'unauthenticated'`, `account -> null` |
| `dispatch(authApi.util.resetApiState())` | yes | drops every cached `authApi` response |
| `await clearTokens()` | no | wipes the AsyncStorage token pair and the in-memory mirror |

- Mirrors the 19b unauthorized handler (`sessionEnded` + `resetApiState`) and
  adds the token wipe that an explicit logout needs.
- The later leaf inserts `await request({ url: '/auth/logout', method: 'POST' })`
  before `clearTokens()`, tolerating its failure (a dead access token still
  means "logged out" locally).

### `app.slice` after 19c

```ts
export interface AppState {
  user?: User;
}
const initialState: AppState = { user: undefined };
// reducers: setUser, reset
```

`useAppSlice()` keeps its shape (`{ dispatch, user, setUser, reset }`). Nothing
in the app reads `checked` or `loggedIn` after Step 3 (`app/index.tsx` moves to
`auth.slice.status`, and `Profile.tsx` moves to `signOut`).

## Testing

Jest (`jest-expo`) + `@jest/globals`. `authGate` is pure - no mocks. `signOut`
reuses the `slices/auth.slice.test.ts` harness from 19b (throwaway store +
stubbed `httpClient.defaults.adapter` + fake timers + `resetApiState` in
`afterEach`). No component/navigation tests for the layouts
(`coding-standards.md`).

- `utils/authGate.test.ts` - one assertion per row of the rule table above (11
  rows), plus: `restoring` returns `wait` for every group; an unknown `area`
  under `(auth)` is treated as the `auth` / `onboarding` case.
- `slices/auth.slice.test.ts` (extend) - `signOut` sets `unauthenticated` +
  null `account` from an `authenticated` starting state; `signOut` clears the
  token store (seed with `setTokens`, assert `getTokens()` is `null` after).

Predicted: 1 new suite (~13 cases), ~2 added cases in the auth slice suite.
Existing suites stay green - note that removing `app.slice` fields must not
break any component test (none import `app.slice`; `_layout` / `index` are not
under test).

## Notes for the AI

- `authGate` **must not import** `expo-router`, `react`, `@/slices` runtime
  values, or `@/utils/store`. It may `import type { AuthStatus }` from
  `slices/auth.slice`. Keep it a lookup table.
- The layout guards are the only place `useSegments()` appears. Do not thread
  segments through `authGate` as an array - pass the one string the `(auth)`
  layout needs.
- Hooks order in `app/(main)/_layout.tsx`: call `useAuthSlice()` and
  `useTheme()` unconditionally at the top, then the early `return null` /
  `<Redirect>`. Never gate a hook behind the redirect.
- `app/_layout.tsx` keeps its single `useEffect([])` and its existing
  eslint-disable-free style; the exhaustive-deps warning is expected and its
  dependency list just gets shorter.
- Do not add `app/(auth)/auth/_layout.tsx` or other nested layouts. One
  `(auth)/_layout.tsx` with the `segments[1]` check is the whole guard.
- `signOut` dispatches `sessionEnded()` synchronously on purpose - a caller
  that navigates right after `dispatch(signOut())` sees `unauthenticated`
  immediately, so no guard bounce race.
- Redirect targets are route paths (`/home`, `/onboarding`), not group names.
- No em dashes, en dashes, or ellipsis characters in code, comments, or docs
  (`coding-standards.md`).
- Creator-only app: no role branch in the gate.

## Manual try path (for `/check`, not this skill)

1. Fresh launch, no stored tokens -> lands on `/onboarding`, carousel ->
   `/auth`. Try to open `/home` directly (deep link or `router` in dev) ->
   bounced back to `/onboarding`.
2. With a stored valid token pair (simulate via a dev button or by seeding
   `tokenStore` and a stub `/auth/me`) -> launch lands on `/home`; navigating
   to `/auth/sign-in` bounces to `/home`; `/profile-verification/date-of-birth`
   is allowed.
3. Profile tab -> Log Out -> returns to `/auth/sign-in`; kill and relaunch ->
   still signed out, lands on `/onboarding`.
