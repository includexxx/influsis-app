# Correct residual auth status claims in the PRD

**Type:** Fix
**Status:** verified
**Branch:** `fix/prd-auth-status-accuracy`
**Fixes:** F-04

Docs-only follow-up to the F-03 fix. That pass reconciled the "what works today"
bullets but left the endpoint count imprecise and left three roadmap /
requirement lines still framing the auth service layer as unstarted. All in
`docs/PRD.md`.

## The problem (F-04)

| Line | Stale text | Reality after 19a-19g |
| --- | --- | --- |
| `docs/PRD.md:72` | "`services/http.ts` and `services/authApi.ts` wire the **seven** `/auth/*` endpoints" | `authApi.ts` defines eight endpoints (`register`, `login`, `login/2fa/verify`, `otp/request`, `otp/verify`, `reset-password`, `me`, `logout`) and `http.ts` adds `/auth/refresh`. "seven" undercounts. |
| `docs/PRD.md:102` (epic E3) | "API service layer (replace fake `getUserAsync`, add error handling, token storage)" listed as a pending epic | `getUserAsync` / `user.service.ts` deleted (19c); `http.ts` has `ApiError` + envelope handling + the 401-refresh interceptor; `tokenStore.ts` persists the pair. E3 landed with the 19a-19g auth epic (real traffic still needs a live backend). |
| `docs/PRD.md:110` (FR-1) | "_(Scaffolded, currently always "logs in".)_" | `app/index.tsx` + the `authGate` layout guards route on `auth.slice.status`; a signed-out user cannot reach the tabs. Not "always logs in". |
| `docs/PRD.md:112` (FR-3) | "A previously signed-in user must be restored when offline. _(Working with fake data.)_" | `restoreSession` reads the real token store and calls `GET /auth/me`. It is not fake data. (Known limitation, separate from this fix: a transient offline failure currently resolves to `unauthenticated` rather than a cached restore.) |
| `docs/PRD.md:144` and `:145` (Success Criteria checkboxes) | `- [ ] Fake user service replaced with a real API client and error handling` and `- [ ] Real auth flow with route guarding (logged-out users cannot reach main tabs)` | Both are factually done (19a-19b service layer; 19c route guarding). |

## The fix

`docs/PRD.md` prose only. No code, no other files.

1. **Line 72** - drop the count: "wire the `/auth/*` endpoints" (avoids a
   number that drifts as endpoints are added).
2. **Line 102 (epic E3)** - leave the table row itself unchanged (widening one
   cell reflows all seven rows and surfaces their pre-existing em dashes in the
   diff). Instead add one status line directly under the table:
   `E2 and E3 are largely built by the 19a-19g auth epic (auth screens, session
   slice, HTTP client, token storage, route guarding); a live backend is the
   remaining gap.`
3. **Line 110** - replace the FR-1 parenthetical with an accurate one, e.g.
   "_(Working: routes on `auth.slice.status` via `restoreSession` + `authGate`;
   live backend still pending.)_".
4. **Line 112** - replace the FR-3 parenthetical with "_(Working against the
   real token store and `GET /auth/me`; a transient offline failure currently
   signs the user out rather than restoring from cache.)_".
5. **Lines 144-145** - tick both checkboxes (`- [x]`). Leave the other three
   Success Criteria items and the section heading untouched; ticking two
   individually-complete items does not assert the milestone is reached.

Must not break: no change to any table row (only a new line beneath the 4.1
table); no checkbox ticked whose item is not actually complete (leave 143
app-identity rebrand, 146 real product screen, 147 real endpoints unticked); no
em dashes, en dashes, or ellipsis characters in edited text
(`coding-standards.md`); `npx prettier --check docs/PRD.md` passes with no table
reflow in the diff.

## Build steps

- [x] **Step 1 - correct the PRD lines (F-04).** Apply edits 1-5 above to
  `docs/PRD.md`. Prose only (line 72 trim, one new line under the 4.1 table,
  two FR parentheticals, two checkbox ticks).
  *Done when:* `rg -n "seven .auth|always .logs in.|Working with fake data" docs/PRD.md`
  returns nothing; `rg -n "^- \[x\] .*(Fake user service|route guarding)" docs/PRD.md`
  returns both lines; `npx prettier --check docs/PRD.md` passes; a read of
  lines 96-115 and 141-148 shows every auth claim matches
  `services/`, `slices/auth.slice.ts`, and `utils/authGate.ts`.

## Verify

- `rg -n "seven|getUserAsync|always .logs in.|fake data" docs/PRD.md` - only the
  E3 row's `getUserAsync` reference remains (now inside a "delivered" note), no
  "seven", no "always logs in", no "fake data".
- Re-read PRD sections 2.1, 4.1, 4.2, and 8 end to end: no remaining statement
  says the auth service layer, route guarding, or session rehydration is
  unbuilt or fake.
- No code touched, so `tsc` / `lint` / `test` are unaffected; run `npm test`
  once anyway as the fix gate.
