# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P2] fixed - redux-logger prints auth tokens in every non-dev build

**File:** utils/store.ts:24-31
**Found:** 2026-09-08 by /audit (scope: feat/server-auth delta cab4989..HEAD; lens: security)
**Why it matters:** The middleware ternary is `config.env === Env.dev ? base : base.concat(logger)`,
so `redux-logger` is attached for staging and production and skipped only in
development (the check reads inverted). Before this branch that logged benign
app state. 19b-19g route every login, OTP verify, 2FA verify, and silent token
refresh through `authApi` actions whose fulfilled payload is the
`{ token, refreshToken, tokenExpires, user }` pair, so a staging or production
build now `console.log`s the access and refresh tokens on every auth event.
On a device those land in `adb logcat` / Console.app and in any log-capture SDK
added later. `serializableCheck` was correctly relaxed for `authApi`, but the
logger was not.
**Suggested fix:** Flip the condition so the logger is dev-only
(`config.env === Env.dev ? base.concat(logger) : base`), or drop `redux-logger`
entirely. If a prod action log is genuinely wanted, add an action/state
sanitizer that redacts `authApi` payloads.
**Resolution:** Fixed on `fix/logger-dev-only-and-auth-docs` (step 1). Ternary
in `utils/store.ts:32` flipped to `config.env === Env.dev ? base.concat(logger)
: base`; `redux-logger` now runs only in development. `serializableCheck`,
`authApi.middleware` order, and `devTools` unchanged. `tsc` / 284 tests / lint
green. Awaiting `/audit` re-review to close.

### F-02 [P2] open - Six auth screens ship with no behavioral verification

**File:** scenes/auth/VerifyOtp.tsx:74-127
**Found:** 2026-09-08 by /audit (scope: feat/server-auth delta cab4989..HEAD; lens: tests)
**Why it matters:** `SignIn`, `SignUp`, `VerifyOtp`, `ForgotPassword`,
`ResetPassword`, and `VerifyTwoFactor` carry the branch's real integration
logic (mutation dispatch, response-shape narrowing, `setTokens` +
`sessionEstablished` ordering, `router.replace` targets, error mapping). The
coding standard exempts screens from unit tests, but the compensating control
(manual `/check` against a live backend, or a browser harness) has not been
run: the backend at `192.168.68.106:3001` is unreachable and no `Browser tests`
command exists. The 19e session-establish-then-navigate hand-off is the
sharpest gap: establishing the session while still on `(auth)/auth/verify-otp`
makes `authGate` want to redirect to `/home`, and only the immediately
following `router.replace('/profile-verification/date-of-birth')` is expected
to win that race. Nothing has confirmed it does.
**Suggested fix:** Stand up the backend (or point `API_URL` at a running
instance) and complete the manual try paths in
`blueprint/history/features/19d-19g`, or run `/browser-tests` to add a harness
and cover at least the OTP -> profile-verification transition and the
missing-token guards on `ResetPassword` / `VerifyTwoFactor`.
**Resolution:**

### F-03 [P3] fixed - Docs still reference the removed loggedIn / setLoggedIn state

**File:** docs/PRD.md:65
**Found:** 2026-09-08 by /audit (scope: feat/server-auth delta cab4989..HEAD; lens: quality)
**Why it matters:** 19c deleted `checked`, `loggedIn`, and `setLoggedIn` from
`app.slice`, but `docs/PRD.md` (lines 65, 73) and
`docs/screen/profile/README.md` (line 78) still describe auth state as a single
`app` slice with `loggedIn` and a logout that calls `setLoggedIn(false)`. A
reader onboarding from these docs will look for state that no longer exists.
**Suggested fix:** Update those three lines to describe `auth.slice`
(`status` / `account`), `restoreSession`, and the `signOut` thunk.
**Resolution:** Fixed on `fix/logger-dev-only-and-auth-docs` (step 2). Eight
lines reconciled: `docs/PRD.md` (app bootstrap, state management, startup
failure, auth HTTP layer, auth flow + route guarding, backend) plus
`docs/screen/auth/README.md:47` (`app/index.tsx` routes on `auth.slice.status`)
and `docs/screen/profile/README.md:78` (logout uses `signOut()`). `rg
"loggedIn|setLoggedIn" docs/` now clean. Not touched (forward-looking roadmap,
not false present-tense claims): `docs/PRD.md` lines ~102, ~110, ~144 still list
"replace fake `getUserAsync`" as pending epic work. Awaiting `/audit`
re-review to close.
