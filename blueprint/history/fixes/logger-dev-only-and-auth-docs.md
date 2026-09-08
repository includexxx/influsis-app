# Restrict redux-logger to dev and reconcile stale auth docs

**Type:** Fix
**Status:** verified
**Branch:** `fix/logger-dev-only-and-auth-docs`
**Fixes:** F-01, F-03

Two small, unrelated cleanups from the `feat/server-auth` audit, bundled into one
fix because both are drift left by the 19a-19g auth epic and neither touches
runtime auth logic.

## The problem

### F-01 (P2, security) - `utils/store.ts`

The store middleware ternary is inverted:

```ts
return config.env === Env.dev ? base : base.concat(logger);
```

`redux-logger` is attached for **staging and production** and skipped only in
development. Before the auth epic that logged benign UI state. 19b-19g now route
every login, OTP verify, 2FA verify, and silent token refresh through `authApi`
actions whose fulfilled payload is the `{ token, refreshToken, tokenExpires,
user }` pair, so a staging or production build `console.log`s the access and
refresh tokens on every auth event. On a device those reach `adb logcat` /
Console.app and any future log-capture SDK.

The pre-existing `serializableCheck` relaxation for `authApi` is correct and
stays; only the logger attach is wrong.

### F-03 (P3, quality) - auth docs vs shipped state

19c removed `checked`, `loggedIn`, and `setLoggedIn` from `app.slice` and added
route guarding; 19a-19b added the HTTP client and `authApi`; 19c deleted
`services/user.service.ts`. Several doc lines still describe the old world:

| File / line | Stale claim | Reality after 19a-19g |
| --- | --- | --- |
| `docs/PRD.md:56` | "a simulated user fetch runs, the user is stored in Redux and persisted to AsyncStorage" | `app/_layout.tsx` dispatches `restoreSession` (reads the token store, confirms with `GET /auth/me`) |
| `docs/PRD.md:65` | `app` slice has `(checked, loggedIn, user)` | `app` slice is `user` only; session lives in `auth.slice` (`status`, `account`) |
| `docs/PRD.md:67` | "Offline fallback: if the startup fetch fails, the user is restored from persistent storage" | `restoreSession` returns null on any failure (status becomes `unauthenticated`); the token pair is kept only on a non-401/403 failure so a later launch can retry |
| `docs/PRD.md:73` | "drives the real `loggedIn` Redux state ... no route guarding (the `(main)` tabs are reachable without signing in)" | drives `auth.slice.status`; `authGate` guards every route group (19c) |
| `docs/PRD.md:72` | "User service: `services/user.service.ts` returns a hardcoded fake user" | file deleted in 19c |
| `docs/PRD.md:74` | "Backend: No API client, no endpoints" | `services/http.ts` + `services/authApi.ts` exist; the seven `/auth/*` endpoints are wired (screens still need a live backend) |
| `docs/screen/profile/README.md:78` | logout calls `setLoggedIn(false)` | logout dispatches the `signOut()` thunk (ends the Redux session, resets `authApi`, clears the token store) |
| `docs/screen/auth/README.md:47` | "`app/index.tsx` always redirects to `/onboarding`" once `checked` in `slices/app.slice.ts` resolves | `app/index.tsx` routes on `auth.slice.status`: `restoring` -> null, `authenticated` -> `/home`, `unauthenticated` -> `/onboarding` |

Scope is the auth epic's drift only, not a broader PRD refresh.

## The fix

1. **`utils/store.ts`** - flip the ternary so the logger is dev-only:
   `config.env === Env.dev ? base.concat(logger) : base`. Nothing else in the
   `middleware` builder changes. `devTools`, `serializableCheck`, and the
   `setUnauthorizedHandler` wiring are untouched.
2. **Docs** - rewrite the lines above to match shipped state, keeping each
   line's surrounding format and tone. Do not restructure the docs or touch
   unrelated content. No em dashes, en dashes, or ellipsis characters
   (`coding-standards.md`).

Must not break: the `authApi` middleware order (`.concat(authApi.middleware)`
stays before any logger), the prod/staging build (logger simply stops running
there), and the Jest suites (they build their own stores and do not read
`utils/store.ts`'s middleware).

## Build steps

- [x] **Step 1 - logger dev-only (F-01).** In `utils/store.ts`, invert the
  middleware return so `redux-logger` is concatenated only when
  `config.env === Env.dev`. Leave the `getDefaultMiddleware({ serializableCheck:
  ... })` block and `.concat(authApi.middleware)` exactly as they are.
  *Done when:* `npx tsc --noEmit` clean; `npm test` green; a quick read of the
  built expression shows `logger` only on the `Env.dev` branch and `authApi`
  middleware still always attached.

- [x] **Step 2 - reconcile auth docs (F-03).** Edit the lines in the table
  above (`docs/PRD.md` x6, `docs/screen/profile/README.md` x1,
  `docs/screen/auth/README.md` x1) to describe `auth.slice`, `restoreSession`,
  `authGate` route guarding, the deleted `user.service.ts`, the `authApi`
  client, and the `signOut` thunk. Prose only, no code or config changes in
  this step.
  *Done when:* `rg -n "loggedIn|setLoggedIn" docs/` returns nothing;
  `rg -n "no route guarding|user\.service\.ts returns" docs/` returns nothing;
  `npm run format` leaves the files unchanged (or only its own formatting).

## Verify

- **F-01:** In `utils/store.ts` confirm the logger is on the `Env.dev` branch
  only. Optional runtime check: with `ENV=development` the redux-logger group
  output appears in the Metro console on an action; a `staging` / `production`
  build produces no redux-logger output. No token string should appear in logs
  in any environment.
- **F-03:** Re-read the six doc lines against `slices/auth.slice.ts`,
  `utils/authGate.ts`, `app/index.tsx`, and `scenes/main/Profile.tsx`; every
  claim matches. `npm run lint` and `npm test` stay green (docs-only, so no
  behavior change).

## Findings

Resolved findings from this fix, closed by the `/audit` re-review of merged
commit `69d73c9` (2026-09-08). Archived here at the next `/complete` because the
re-review landed after this fix had already merged.

### logger-dev-only-and-auth-docs/F-01 [P2] closed - redux-logger prints auth tokens in every non-dev build

**File:** utils/store.ts:24-31
**Found:** 2026-09-08 by /audit (scope: feat/server-auth delta cab4989..HEAD; lens: security)
**Why it matters:** The middleware ternary read `config.env === Env.dev ? base : base.concat(logger)`,
so `redux-logger` attached for staging and production and was skipped only in
development. 19b-19g route every login, OTP verify, 2FA verify, and silent token
refresh through `authApi` actions whose fulfilled payload carries the
`{ token, refreshToken, tokenExpires, user }` pair, so a staging or production
build `console.log`ged the access and refresh tokens on every auth event.
**Suggested fix:** Flip the condition so the logger is dev-only, or drop
`redux-logger` entirely.
**Resolution:** Fixed here (step 1): `utils/store.ts` ternary flipped to
`config.env === Env.dev ? base.concat(logger) : base`. `serializableCheck`,
`authApi.middleware` order, and `devTools` unchanged.
**Closed** 2026-09-08 by /audit (scope: current, merged fix `69d73c9`; all
lenses). In staging/production the logger is not attached, so `authApi` fulfilled
actions and their token payloads are no longer logged; `authApi.middleware` stays
always attached. Dev now runs `redux-logger` (the intended use of a dev-only
tool). Original defect gone, no new defect introduced.

### logger-dev-only-and-auth-docs/F-03 [P3] closed - Docs referenced the removed loggedIn / setLoggedIn state

**File:** docs/PRD.md:65
**Found:** 2026-09-08 by /audit (scope: feat/server-auth delta cab4989..HEAD; lens: quality)
**Why it matters:** 19c deleted `checked`, `loggedIn`, and `setLoggedIn` from
`app.slice` and added route guarding; `docs/PRD.md` and
`docs/screen/profile/README.md` still described auth state as a single `app`
slice with `loggedIn` and a logout that called `setLoggedIn(false)`.
**Suggested fix:** Update those lines to describe `auth.slice` (`status` /
`account`), `restoreSession`, and the `signOut` thunk.
**Resolution:** Fixed here (step 2): eight lines reconciled across `docs/PRD.md`,
`docs/screen/auth/README.md:47`, and `docs/screen/profile/README.md:78`.
**Closed** 2026-09-08 by /audit (scope: current, merged fix `69d73c9`; all
lenses). All eight rewritten lines verified against source; `rg
"loggedIn|setLoggedIn" docs/` clean. One residual imprecision spun out as F-04
(tracked separately); the original defect is fully gone.
