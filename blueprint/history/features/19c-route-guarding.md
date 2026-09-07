# 19c - Route guarding

> Archived by `/complete`. Third leaf of build-plan item 19 ("Real
> authentication + route guarding").

**Note:** Depends on 19a + 19b + 19d, all merged on `feat/creator-auth`.
Branched from `feat/creator-auth`. Reads the 19b session state
(`useAppSlice().checked` / `.loggedIn`); does not change the session slice,
thunks, or the auth forms.

**Branch:** `feature/route-guarding`

**Status:** verified - steps 1-5 complete (`npx tsc --noEmit` clean, `npm run
lint` clean, `npm test` green at 81 suites / 256 tests). Step 6 (manual routing
check against a running backend) was explicitly waived by the user before merge;
`uiEvidence: when-available` and no dev server was run. The five `_layout` /
entry wiring changes rest on the `authRedirect` unit tests + a traced-by-hand
redirect matrix + code review only - confirm at runtime via `/try latest`.

## Goal

Stop logged-out users from reaching the app shell, and stop logged-in users
from being dropped back at onboarding / the sign-in screens. Concretely:

- `app/index.tsx` routes by session: authenticated -> `/home`, otherwise
  `/onboarding`. No more unconditional `/onboarding`.
- `(main)` and `(details)` require a live session; an unauthenticated visitor
  is redirected to `/onboarding`.
- `(auth)` redirects an authenticated visitor to `/home`, **except** while they
  are in the post-signup `profile-verification` wizard (they are authenticated
  there by design - 19d's `signUp` dispatches `sessionAuthenticated` then
  navigates into it).
- The redirect decision is a pure, unit-tested helper; the `_layout` files are
  thin consumers.

## In scope

- `utils/authGate.ts` (new) - pure `authRedirect(area, state)` returning the
  href to redirect to, or `null` to render children.
- `utils/authGate.test.ts` (new).
- `app/index.tsx` - replace the unconditional `<Redirect href="/onboarding" />`
  with the helper's decision.
- `app/(main)/_layout.tsx` - wrap the existing `<Tabs>` in the guard.
- `app/(details)/_layout.tsx` (new) - guard + `<Stack>` (this group previously
  had no layout of its own and rendered under the root `<Stack>`).
- `app/(auth)/_layout.tsx` (new) - guard + `<Stack>`, with the
  `profile-verification` exception via `useSegments()`.

## Out of scope

- **19e** - `VerifyOtp` / `ForgotPassword` / `ResetPassword` backend wiring.
  `VerifyOtp` still `router.replace('/profile-verification/date-of-birth')`;
  the new `(auth)` guard's exception already covers that path.
- **Feature 21** - persisting profile-verification progress. If an
  authenticated user relaunches mid-wizard they land on `/home` and restart the
  wizard next time; that is acceptable here and noted below.
- A "has completed onboarding" flag. There is none today
  (`docs/screen/auth/README.md`), and 19c does not add one - `loggedIn` is the
  only gate. A logged-out returning user still sees the full Intro -> carousel
  -> landing each launch, unchanged.
- Deep-link / universal-link handling (feature 23), `expo-router`
  `Stack.Protected` migration (considered; see Notes), and any change to the
  `(main)` tab set, the create-gig `tabPress` interception, or the invalid-`id`
  `<Redirect href="/home" />` guards inside `(details)` scenes.
- `docs/screen/*` and `docs/PRD.md` stale "no route guarding" notes - 19b set
  the precedent that this project's Blueprint work does not maintain
  `docs/screen/*`; left for a separate docs pass (flagged in Notes).

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
build all steps in one pass, one review packet. `/complete` makes the commit.

Per-step gates: `npx tsc --noEmit`, `npm test` (step 1 ships passing tests),
`npm run lint`. `verification.uiEvidence: "when-available"` - the layout wiring
is verified by the user-run manual check in the last step, not by
scene-integration tests (coding-standards: navigation between screens is not
unit-tested).

## Build steps

- [x] 1. **Pure redirect resolver.** Add `utils/authGate.ts`:

     ```ts
     export type AuthArea = 'root' | 'main' | 'details' | 'auth';

     // 'root' overload returns non-null so app/index.tsx typechecks without a
     // hack; the general signature can return null ("render children").
     export function authRedirect(area: 'root', state: AuthGateState): '/home' | '/onboarding';
     export function authRedirect(
       area: AuthArea,
       state: { loggedIn: boolean; inProfileVerification?: boolean },
     ): '/home' | '/onboarding' | null
     ```

     Rules (assume the session check has already resolved; callers handle the
     unresolved case):
     - `root`: `loggedIn` -> `/home`; else `/onboarding`.
     - `main` / `details`: `!loggedIn` -> `/onboarding`; else `null`.
     - `auth`: `loggedIn && !inProfileVerification` -> `/home`;
       `!loggedIn && inProfileVerification` -> `/onboarding`; else `null`.

     Add `utils/authGate.test.ts`.
     **Done when:** tests cover every `area` for both `loggedIn` values and, for
     `auth`, both `inProfileVerification` values (8+ cases); `npm test` green;
     `npx tsc --noEmit` clean.

- [x] 2. **Route the entry screen by session.** `app/index.tsx`: keep
     `if (!checked) return null;`, then
     `const to = authRedirect('root', { loggedIn }); return <Redirect href={to} />;`
     (`to` is always non-null for `root`). Pull `loggedIn` from `useAppSlice()`.
     **Done when:** `npx tsc --noEmit` + `npm run lint` clean; `npm test` green;
     behavior confirmed in step 6.

- [x] 3. **Guard `(main)`.** `app/(main)/_layout.tsx`: read
     `{ checked, loggedIn }` from `useAppSlice()`; `if (!checked) return null;`
     `const to = authRedirect('main', { loggedIn }); if (to) return <Redirect
     href={to} />;` then return the existing `<Tabs>` unchanged. Keep the
     `tabBarShadow` logic, all `<Tabs.Screen>` entries, and the `create-gig`
     `tabPress` listener exactly as they are.
     **Done when:** `npx tsc --noEmit` + `npm run lint` clean; `npm test` green;
     diff is guard-only; behavior confirmed in step 6.

- [x] 4. **Guard `(details)`.** Add `app/(details)/_layout.tsx`: same
     `checked` / `authRedirect('details', ...)` guard, then
     `return <Stack screenOptions={{ headerShown: false }} />;` (matches the
     root layout's screen options so nested detail screens keep no header).
     **Done when:** `npx tsc --noEmit` + `npm run lint` clean; `npm test` green;
     a logged-out deep link to a `(details)` route redirects to `/onboarding`;
     the create-gig wizard and every `/campaign/[id]`-style route still open
     when logged in (step 6).

- [x] 5. **Guard `(auth)`.** Add `app/(auth)/_layout.tsx`: read
     `{ checked, loggedIn }`; `const segments = useSegments();`
     `const inProfileVerification = segments.includes('profile-verification');`
     `if (!checked) return null;`
     `const to = authRedirect('auth', { loggedIn, inProfileVerification }); if
     (to) return <Redirect href={to} />;` then
     `return <Stack screenOptions={{ headerShown: false }} />;`.
     **Done when:** `npx tsc --noEmit` + `npm run lint` clean; `npm test` green;
     an authenticated user hitting `/auth/sign-in` lands on `/home`, but the
     `profile-verification` wizard still runs after sign-up (step 6).

- [x] 6. **Manual guard check (user-run).** Ships no code. With `npm run dev`
     against a running backend:
     (a) Logged out, deep-link `/home` and `/campaign/1` -> both land on the
     Intro/onboarding, never the tab shell or a detail screen.
     (b) Sign in -> `/home`; force-quit and relaunch -> boots straight to
     `/home`, skipping Intro and the carousel.
     (c) While signed in, navigate to `/auth/sign-in` (e.g. type the URL on
     web) -> redirected to `/home`.
     (d) Sign up a fresh creator -> the `profile-verification` wizard opens and
     every step advances normally; finishing it ("Completed" -> `/home`) works.
     (e) Sign out from Profile -> returned to onboarding, and `/home` is no
     longer reachable by back-navigation or deep link.
     **Done when:** the user reports these, or explicitly waives the check.
     **Outcome:** explicitly waived by the user at `/complete` (no dev server
     run). All eight session x area x wizard redirect paths were traced by hand
     for loop-freedom; confirm at runtime via `/try latest`.

## Files / areas

| Path | Change |
| --- | --- |
| `utils/authGate.ts` + `.test.ts` | new - pure `authRedirect(area, state)` |
| `app/index.tsx` | session-based entry redirect (was always `/onboarding`) |
| `app/(main)/_layout.tsx` | wrap `<Tabs>` in the guard, otherwise untouched |
| `app/(details)/_layout.tsx` | new - guard + `<Stack headerShown:false>` |
| `app/(auth)/_layout.tsx` | new - guard + `<Stack>`, `profile-verification` exception |

No change to `slices/*`, `services/*`, the auth scenes, the onboarding scenes,
the profile-verification scenes, or any `(details)` scene.

## Data / contracts

### `authRedirect(area, state)`

| `area` | `loggedIn` | `inProfileVerification` | result |
| --- | --- | --- | --- |
| `root` | `true` | any | `/home` |
| `root` | `false` | any | `/onboarding` |
| `main` \| `details` | `true` | any | `null` |
| `main` \| `details` | `false` | any | `/onboarding` |
| `auth` | `true` | `false` / omitted | `/home` |
| `auth` | `true` | `true` | `null` |
| `auth` | `false` | `true` | `/onboarding` |
| `auth` | `false` | `false` / omitted | `null` |

Pure function, no React or router imports. `null` means "render children".

### Session selectors (19b, read-only)

- `useAppSlice().checked` - `state.app.status !== 'loading'` (the launch
  rehydrate has finished; splash is already hidden by `app/_layout.tsx`).
- `useAppSlice().loggedIn` - `state.app.status === 'authenticated'`.

### Layout guard shape (every guarded layout)

```tsx
const { checked, loggedIn } = useAppSlice();
if (!checked) return null;               // splash still logically up
const to = authRedirect(<area>, { loggedIn /*, inProfileVerification */ });
if (to) return <Redirect href={to} />;
return <Tabs .../> | <Stack .../>;
```

### `(auth)` segment check

`useSegments()` from `expo-router` returns e.g.
`['(auth)', 'profile-verification', 'date-of-birth']`;
`segments.includes('profile-verification')` is the wizard test.

## Testing

Jest + `@jest/globals`. Only `utils/authGate.ts` is unit-tested - it is pure
logic (coding-standards: "parsers, formatters, validators" yes; "navigation
between screens" no).

- `utils/authGate.test.ts` - one assertion per row of the Data / contracts
  table, plus that `main` and `details` behave identically, and that the
  `inProfileVerification`-omitted `auth` case equals the `false` case. 9 cases.

The five `_layout` / entry wiring changes are verified by the step 6 manual
check (waived), not by tests. Net: 1 new suite, 9 cases; total 80 suites / 247
tests -> 81 suites / 256 tests.

## Notes for the AI

- Branch from `feat/creator-auth`; 19a/19b/19d are already merged there.
- **This is UX / defense-in-depth, not the security boundary.** Client-side
  route guards only decide what renders; the real protection is the backend
  rejecting unauthenticated requests (401) once product screens call it
  (feature 20+). Do not let the guard become a reason to relax server-side
  checks later.
- The guard logic lives in `authRedirect`; the layouts must stay thin. Do not
  put branching (segment checks aside) in the `_layout` files.
- `(details)` had no `_layout.tsx` - adding one nests those routes in their own
  `<Stack>` under the root `<Stack>`, the same shape `(main)` already uses with
  `<Tabs>`. Matches the root's `screenOptions={{ headerShown: false }}` so
  detail screens keep no header.
- Keep `if (!checked) return null;` even though `app/_layout.tsx` only hides the
  splash after `bootstrapSession` resolves - cheap insurance against a
  re-render during rehydrate, mirrors the old `app/index.tsx`.
- Considered and rejected for this pass: `expo-router`'s `Stack.Protected`
  `guard` prop (v6 supports it). Modern idiom, but the codebase uses
  `<Redirect>` everywhere; staying with `<Redirect>` keeps the diff consistent
  and the decision testable in isolation. Revisit if more groups need guarding.
- `docs/screen/main/README.md` ("No auth guarding"), `docs/screen/auth/README.md`
  ("`app/index.tsx` always redirects to `/onboarding`"), and `docs/PRD.md` §8
  are stale after this. 19b did not touch `docs/screen/*`; left for a dedicated
  docs pass.

## Open questions

None block 19c. Carried forward:

1. **Onboarding fast-path.** A logged-out returning user replays the full
   Intro + carousel every launch because no "seen onboarding" flag is
   persisted. 19c deliberately does not add one (`loggedIn` is the only gate).
   If the product wants "skip the carousel after first run", that is a small
   separate change once someone decides where the flag lives (AsyncStorage key
   vs. server preference).
2. **Mid-wizard relaunch.** An authenticated user who relaunches while in
   `profile-verification` lands on `/home` (entry redirect) and would restart
   the wizard on next entry. Acceptable now; feature 21 (profile-verification
   persistence / `GET /profiles/me`) is where resume-in-place belongs.
