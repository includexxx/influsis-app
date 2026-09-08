# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

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

### F-04 [P3] fixed - Residual auth inaccuracies in docs/PRD.md

**File:** docs/PRD.md:72
**Found:** 2026-09-08 by /audit (scope: current, merged fix `69d73c9`; lens: quality)
**Why it matters:** The F-03 fix rewrote the PRD's auth section for accuracy but
left small inaccuracies:

- Line 72 (new "Auth HTTP layer" bullet) says `http.ts` + `authApi.ts` "wire the
  seven `/auth/*` endpoints". `authApi.ts` defines eight
  (`register`, `login`, `login/2fa/verify`, `otp/request`, `otp/verify`,
  `reset-password`, `me`, `logout`) and `http.ts` adds `/auth/refresh`, so nine
  distinct paths (or seven if you count only the ones a screen or `restoreSession`
  actively calls, leaving `logout` and `refresh` as plumbing). The number should
  be exact or dropped.
- Lines ~102 / ~110 / ~144 still frame the auth service layer as unstarted:
  epic E3 "replace fake `getUserAsync`", FR-1 "Scaffolded, currently always
  'logs in'", and an unchecked "Fake user service replaced with a real API
  client" roadmap box. 19a-19g delivered most of that.
**Suggested fix:** Make line 72 exact ("eight `/auth/*` endpoints" or "the
`/auth/*` endpoints") and update the three roadmap/requirement lines to reflect
that the API service layer and route-based auth state now exist (the live
backend is the remaining gap).
**Resolution:** Fixed on `fix/prd-auth-status-accuracy` (step 1). `docs/PRD.md`:
line 72 count dropped ("wire the `/auth/*` endpoints"); a status line added
under the 4.1 epics table noting E2/E3 are largely built by 19a-19g with a live
backend the remaining gap (table rows untouched to avoid a reflow); FR-1 and
FR-3 parentheticals rewritten to the real `restoreSession` / `authGate` /
`GET /auth/me` status; the two completed Success Criteria checkboxes ticked.
`prettier --check docs/PRD.md` clean, stale-phrase greps clean, no code touched
(284 tests still green). Awaiting `/audit` re-review to close.
