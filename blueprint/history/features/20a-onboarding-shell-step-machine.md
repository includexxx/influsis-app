# Feature: Onboarding shell + step machine (20a)

**From build-plan:** feature 20a (first leaf of item 20, "Creator onboarding
wizard"). Archived 2026-09-10.

**Branch:** `feat/creator-onboarding` (umbrella branch the user created for the
whole item-20 wizard, mirroring how item 19 used one `feat/server-auth` branch;
supersedes the spec's original per-sub-item `feature/onboarding-shell-step-machine`).

Build-plan item **20a - Onboarding shell + step machine** (parent: 20, Creator
onboarding wizard). Source of intent: `creator-onboarding-requirements.md`
(Creator Onboarding flow, Draft v1) and `blueprint/context/project-overview.md`.

## Goal

Stand up the single-screen, multi-step creator onboarding wizard and prove the
pattern end to end with Step 1:

- one **private** route (`app/(auth)/creator-onboarding.tsx`), reached only
  after registration, gated to authenticated users
- a Redux **step machine** (`currentStep` / `completedSteps` / per-step draft)
  in a new `creatorOnboarding` slice
- a per-step **react-hook-form + zod** pattern where each step seeds its form
  from the saved draft, so Back restores the previous answer
- **Step 1 (Basic Information)** - name, gender, date of birth - fully wired,
  including a hard **minimum-age-14** block on date of birth
- placeholder steps 2-8 so the machine and the `X of 8` progress bar are
  walkable and testable now, replaced one by one in 20b-20g

This replaces the shipped profile-verification wizard, which is **retired in
this feature**: its 7 routes and 7 scenes are deleted, and its Redux slice is
migrated to a trimmed `profile` slice that only serves `EditProfile`.

There is **no backend call** in this feature. The onboarding submit and its
post-submit behaviour are specified later (20g+).

## Design reference

Follow the visual pattern of the (being-deleted) `scenes/profile-verification/*`
screens and their specs under `docs/screen/profile-verification/`:

- pink progress track + `X of 8` counter + title + one-line subtext:
  `components/elements/ProfileStepHeader` (already accepts `totalSteps`)
- full-width pink primary CTA: `buttonStyle.primary` / `buttonStyle.primaryTitle`
- `Next` greyed until that step's mandatory fields are valid (as the old
  Languages/Categories screens greyed `Next`)
- date of birth: `components/elements/DateField` + `components/elements/CalendarPicker`
  (the exact pair the old `DateOfBirth` scene used)
- gender: 4-option `components/elements/OptionSheet`, the pattern
  `scenes/main/EditProfile.tsx` uses for its gender field
- no in-screen Back on Step 1; Back on steps 2+

## In scope

- **Route**: `app/(auth)/creator-onboarding.tsx` - thin re-export of the scene
  (flat file, so `useSegments()[1] === 'creator-onboarding'`; the
  `(auth)/onboarding` segment is already the pre-login intro carousel).
- **Scenes**: `scenes/creator-onboarding/`
  - `CreatorOnboarding.tsx` - shell: owns the `SafeAreaView` background and
    renders the component for `currentStep`
  - `steps/BasicInformationStep.tsx` - Step 1, real form
  - `steps/PlaceholderStep.tsx` - one reusable "coming soon" step for 2-8
    (header with the right step number + label + a working Back)
  - `useCreatorOnboardingStep.ts` - co-located hook exposing `currentStep`,
    `totalSteps`, `isFirstStep`, `isLastStep`, `saveAndContinue()`, `skip()`,
    `back()`
  - `index.ts`
- **Slice**: `slices/creatorOnboarding.slice.ts` (+ `.test.ts`), registered in
  `slices/index.ts` (`useCreatorOnboardingSlice`) and `utils/store.ts`
  (reducer key `creatorOnboarding`).
- **Schema**: `utils/onboardingSchemas.ts` (+ `.test.ts`) - `GENDER_OPTIONS`,
  `MINIMUM_CREATOR_AGE = 14`, `basicInformationSchema`, `BasicInformationValues`.
- **Gate**: `utils/authGate.ts` - replace the `profile-verification` branch with
  a `creator-onboarding` branch (authenticated -> allow, otherwise ->
  `/onboarding`); update `utils/authGate.test.ts`.
- **Entry rewire**: `scenes/auth/VerifyOtp.tsx` - the post-registration
  `router.replace('/profile-verification/date-of-birth')` becomes
  `router.replace('/creator-onboarding')`.
- **Retire the old wizard**:
  - delete `app/(auth)/profile-verification/` (7 route files) and
    `scenes/profile-verification/` (7 scenes + `index.ts`)
  - migrate `slices/profileVerification.slice.ts` ->
    `slices/profile.slice.ts`: `ProfileState` trimmed to the only fields
    `EditProfile` reads (`phoneNumber`, `phoneCountry`, `gender`, `country`,
    `dateOfBirth`) with their setters + `reset`; hook renamed `useProfileSlice`;
    update `slices/index.ts`, `utils/store.ts` (reducer key `profile`),
    `scenes/main/EditProfile.tsx`
  - refresh now-stale comments referencing the old flow (`styles/profileStep.ts`,
    `styles/createGig.ts`, `data/gigCategories.ts`, `EditProfile.tsx`)
  - add a "superseded by creator onboarding" note to the top of
    `docs/screen/profile-verification/README.md`
- **Step 1 behaviour**:
  - name: `ControlledTextField`, required (trimmed, min 1)
  - gender: required, one of `male | female | other | prefer_not_to_say`
    (requirements section 3, Screen 1); opens `OptionSheet`, wired through a
    react-hook-form `Controller`
  - date of birth: required; stored as `date.toISOString()` (matches the old
    `DateOfBirth`/`EditProfile` convention); `CalendarPicker` with
    `maxDate={new Date()}`
  - **age rule**: reject when age at today's date is `< 14`; inline error on the
    date-of-birth field ("You must be at least 14 to join Influsis"); `Next`
    stays disabled
  - `Next` disabled until `formState.isValid` (`mode: 'onChange'`); on submit,
    dispatch `saveBasics(values)` then `saveAndContinue()`
- **Placeholder steps 2-8**: labels from the requirements section 2 table
  (Location, Content Categories, Languages, Deliverables, Profile & Cover
  Picture, Portfolio, Username) - provisional, finalised per sub-feature.

## Out of scope

- Any real field capture for steps 2-8 (20b-20g).
- The onboarding submit / `FormData` assembly / `console.log` of final state and
  the completion screen (20g).
- The handle-availability API call (20g).
- Persisting the draft across app restarts (no requirement; the old wizard
  didn't either).
- Android hardware-back handling inside the wizard.
- A "already onboarded, skip the wizard" guard (needs backend state such as
  `AuthAccount.handle`; see Open questions).
- Renaming `styles/profileStep.ts` / `profileStepStyle` (kept as-is; only the
  doc comment changes).
- Re-running `/overview` and editing `project-plan.md` sections 3-4 (flagged
  below).

## Build loop

`workflow.stepReview: "feature"` and `checkpointCommits: "disabled"` - implement
all build steps, then present **one** review packet. No inter-step commits.
`/complete` creates the single feature commit and merges after approval.

## Build steps

- [x] 1. **Onboarding schema** - `utils/onboardingSchemas.ts` +
     `utils/onboardingSchemas.test.ts`: `GENDER_OPTIONS`,
     `MINIMUM_CREATOR_AGE = 14`, an ISO-string age helper, `basicInformationSchema`
     (name required, gender enum, dateOfBirth required + age >= 14),
     `BasicInformationValues`.
     **Done when:** `npm run test` passes the new cases - valid adult basics
     accepted; missing name / gender / dob each rejected; a 13-year-old dob
     rejected; exactly 14 and older accepted - and `npx tsc --noEmit` is clean.

- [x] 2. **Slice + step machine** - `slices/creatorOnboarding.slice.ts`:
     `{ currentStep: number (1-8), completedSteps: number[], basics?: BasicInformationValues }`,
     actions `saveBasics`, `goToStep` (clamped 1-8), `markStepComplete` (dedupe),
     `reset`; `useCreatorOnboardingSlice` hook; register in `slices/index.ts` and
     `utils/store.ts`. Add `scenes/creator-onboarding/useCreatorOnboardingStep.ts`.
     Add `slices/creatorOnboarding.slice.test.ts`.
     **Done when:** slice tests pass (initial state; `saveBasics` stores values;
     `goToStep(0)` -> 1 and `goToStep(9)` -> 8; `markStepComplete` no duplicates;
     `reset`); `npm run test` green; `npx tsc --noEmit` clean.

- [x] 3. **Shell + placeholder + Step 1** - `scenes/creator-onboarding/`
     (`CreatorOnboarding.tsx`, `index.ts`, `steps/BasicInformationStep.tsx`,
     `steps/PlaceholderStep.tsx`) and `app/(auth)/creator-onboarding.tsx`. Reuse
     `ProfileStepHeader` (`totalSteps={8}`), `layoutStyle`, `profileStepStyle`,
     `buttonStyle`, `ControlledTextField`, `DateField`, `CalendarPicker`,
     `OptionSheet`. Add `scenes/creator-onboarding/steps/BasicInformationStep.test.tsx`
     (build a store inline with `configureStore`, mirroring
     `slices/auth.slice.test.ts`; no shared render-with-store helper exists).
     **Done when:** the component test passes - renders "1 of 8"; `Next` disabled
     on first render; with name + gender + an adult dob the form is valid and
     submitting dispatches `saveBasics` and moves the store to `currentStep === 2`;
     an underage dob keeps `Next` disabled and shows the age error. `npm run test`
     green; `npx tsc --noEmit` clean.

- [x] 4. **Gate + entry rewire** - `utils/authGate.ts`: swap the
     `profile-verification` area branch for `creator-onboarding`. Update
     `utils/authGate.test.ts` rows. `scenes/auth/VerifyOtp.tsx`: redirect to
     `/creator-onboarding` (rename `proceedToProfileSetup` -> `proceedToOnboarding`).
     **Done when:** `authGate` tests pass with the updated area; `npm run test`
     green; `npx tsc --noEmit` clean.

- [x] 5. **Delete the old wizard screens** - remove
     `app/(auth)/profile-verification/` and `scenes/profile-verification/`.
     **Done when:** searching for `scenes/profile-verification` outside
     `blueprint/`, `assets/`, `docs/` returns nothing; `npx tsc --noEmit` clean;
     `npm run test` green.

- [x] 6. **Migrate the slice** - `slices/profileVerification.slice.ts` ->
     `slices/profile.slice.ts` (`ProfileState` = `phoneNumber?`, `phoneCountry?`,
     `gender?`, `country?`, `dateOfBirth?` + setters + `reset`; `useProfileSlice`);
     update `slices/index.ts`, `utils/store.ts` (reducer key `profile`),
     `scenes/main/EditProfile.tsx` (import, destructure, comment).
     **Done when:** searching for `profileVerification` / `ProfileVerification` in
     `.ts`/`.tsx` outside `blueprint/` returns nothing; `EditProfile` still renders
     Full Name, Email, Phone, Gender, Date of Birth, Country; `npm run test` green;
     `npx tsc --noEmit` clean.

- [x] 7. **Stale-reference cleanup** - refresh comments in
     `styles/profileStep.ts`, `styles/createGig.ts`, `data/gigCategories.ts`,
     `scenes/main/EditProfile.tsx`; prepend a "superseded by creator onboarding
     (build-plan 20)" note to `docs/screen/profile-verification/README.md`.
     **Done when:** `npm run format` and `npm run lint` are clean; `npm run test`
     green.

- [x] 8. **Full verify** - `npm run format`, `npm run lint`, `npm run test`,
     `npx tsc --noEmit`.
     **Done when:** all four succeed (this mirrors `.github/workflows/test.yml`:
     format -> lint -> test).

## Files / areas

| Area                                                                    | Change                                                                                  |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `app/(auth)/creator-onboarding.tsx`                                     | new - thin re-export                                                                    |
| `app/(auth)/profile-verification/*`                                     | deleted (7 files)                                                                       |
| `scenes/creator-onboarding/*`                                           | new - shell, 2 step components, hook, index                                             |
| `scenes/profile-verification/*`                                         | deleted (8 files)                                                                       |
| `slices/creatorOnboarding.slice.ts` (+ test)                            | new                                                                                     |
| `slices/profileVerification.slice.ts` -> `slices/profile.slice.ts`      | renamed + trimmed                                                                       |
| `slices/index.ts`                                                       | drop `useProfileVerificationSlice`, add `useCreatorOnboardingSlice` + `useProfileSlice` |
| `utils/store.ts`                                                        | reducer keys: remove `profileVerification`, add `creatorOnboarding` + `profile`         |
| `utils/onboardingSchemas.ts` (+ test)                                   | new                                                                                     |
| `utils/authGate.ts` (+ test)                                            | `profile-verification` area -> `creator-onboarding`                                     |
| `scenes/auth/VerifyOtp.tsx`                                             | post-registration redirect target                                                       |
| `scenes/main/EditProfile.tsx`                                           | `useProfileSlice`                                                                       |
| `styles/profileStep.ts`, `styles/createGig.ts`, `data/gigCategories.ts` | comment refresh only                                                                    |
| `docs/screen/profile-verification/README.md`                            | "superseded" note                                                                       |

Untouched: `assets/images/profile-verification/*` (still used by
`DateField`, `CalendarPicker`, `Profile.tsx`), `ProfileStepHeader`,
`SelectableListItem`, `theme/`.

## Data / contracts

No API. Client-only Redux state:

```ts
// slices/creatorOnboarding.slice.ts
type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

interface BasicInformationValues {
  name: string; // trimmed, non-empty
  gender: Gender;
  dateOfBirth: string; // ISO 8601 (Date.prototype.toISOString())
}

interface CreatorOnboardingState {
  currentStep: number; // integer, clamped 1..8
  completedSteps: number[]; // unique, unordered
  basics?: BasicInformationValues;
  // 20b+: location, categories, languages, deliverables, photos, portfolio, handle
}
```

- `ONBOARDING_TOTAL_STEPS = 8` - exported constant, single source for the
  progress denominator and the `goToStep` clamp.
- `MINIMUM_CREATOR_AGE = 14` - exported from `utils/onboardingSchemas.ts`; age
  compared at "today" in device local time, `>= 14` passes.
- Migrated `profile` slice keeps `dateOfBirth` as an ISO string (unchanged
  from today).

## Testing

`npm run test` (Jest + RNTL, gate is on). New:

- `slices/creatorOnboarding.slice.test.ts` - reducer behaviour (see step 2).
- `utils/onboardingSchemas.test.ts` - field validation + the age-14 boundary
  (13 rejected, 14 accepted).
- `scenes/creator-onboarding/steps/BasicInformationStep.test.tsx` - render
  "1 of 8", `Next` disabled then enabled, submit advances the store, underage
  error.
- `utils/authGate.test.ts` - updated rows for the `creator-onboarding` area
  (restoring -> wait, unauthenticated -> redirect `/onboarding`, authenticated
  -> allow).

No browser-test command exists; none added.

## Notes for the AI

- The wizard is **one screen**: steps switch via `currentStep` in Redux, not
  via `router` navigation (unlike the old per-route wizard and the Create Gig
  wizard). This is an explicit product instruction.
- Each **step component owns its own `ProfileStepHeader` + CTA row** and its own
  `useForm`, seeded from the slice draft (`defaultValues: basics ?? { ... }`),
  exactly as the old per-route scenes each owned their header + `Button`. The
  shell only owns the `SafeAreaView` + step switch.
- Step components dispatch their own typed save action (`saveBasics`) and then
  call `saveAndContinue()` from the hook (which runs `markStepComplete` +
  `goToStep(current + 1)`). `skip()` advances without a save (for 20e/20f).
- Follow the existing slice-hook idiom: `useXSlice()` returns
  `{ dispatch, ...state, ...slice.actions }` (see `slices/createGig.slice.ts`).
- Gender values are stored as the enum strings above; `GENDER_OPTIONS` carries
  the display labels. The migrated `profile` slice's `gender` stays a bare
  `string` (EditProfile only knows `male`/`female`) - do not couple the two.
- `date-fns`/`dayjs` are **not** dependencies - compute age by hand from the
  ISO string.
- `CalendarPicker`/`OptionSheet` render under Jest via the global
  `react-native-reanimated` mock in `jest.setup.js`. If driving the calendar in
  RNTL proves impractical, keep the age-boundary assertions in the schema test
  and drive `BasicInformationStep`'s form completion by the most direct means
  the harness allows.
- `styles/profileStep.ts` / `profileStepStyle` keep their names; the export is
  generic enough ("profile step") and renaming ripples through `styles/index.ts`
  for no behavioural gain.
- After this feature, `project-overview.md` still reflects the plan correctly
  (item 20 already documented, project-plan drift already noted). Do **not**
  regenerate the overview here - that is `/overview`'s job when the user updates
  `project-plan.md` sections 3-4.

## Open questions

- **Minimum age policy is resolved: 14, hard client-side block.** Still open for
  later: whether the real backend should _reject_ vs _soft-flag_ an underage
  signup (no backend flag target exists yet, so 20a can only block).
- **Re-entry:** nothing marks onboarding "complete" without a backend. This
  feature lets any authenticated user into `/creator-onboarding` (same as the
  old wizard). A future guard could redirect users whose `AuthAccount.handle`
  is already set. Not blocking.

## Status: verified (2026-09-10)

All 8 build steps complete and checked. Final gate:

- `npx prettier --check` on every touched/new file - clean
- `npm run lint` - 0 errors (1 pre-existing `app/_layout.tsx` warning, untouched)
- `npx tsc --noEmit` - clean
- `npm run test` - 89 suites / 301 tests pass (baseline 86 / 284; +3 suites,
  +17 tests from `onboardingSchemas`, `creatorOnboarding.slice`,
  `BasicInformationStep`)

Deviation from the spec's steps 7-8: `npm run format` is a **repo-wide**
`prettier --write "**/*.{ts,tsx,md}"` and rewrote ~30 unrelated files that
were never Prettier-clean (`data/country-flags.ts`, `services/http.ts`,
`docs/screen/**`, `.claude`/`.agents` skill docs, several `scenes/main/*`).
Those were reverted; formatting was verified with `prettier --check` scoped to
this feature's files instead. A repo-wide format is its own chore, not part of
20a.

Findings (`blueprint/context/findings.md`): no P0/P1. **F-02 [P2, open]**
touches the same `VerifyOtp` hand-off this feature edits - it flags that the
"establish session on `(auth)/auth/verify-otp`, then `router.replace` before
`authGate` redirects to `/home`" transition has never been verified against a
live backend. This feature only changes the replace **target**
(`/profile-verification/date-of-birth` -> `/creator-onboarding`); the race is
structurally unchanged and `authGate` now allows the `creator-onboarding` area
for authenticated users (covered by `authGate.test.ts`). F-02 does not block
`/complete`. **F-04 [P3, fixed]** is unrelated (docs/PRD.md).

`qualityGates.regular` are all `manual`, so audit / independent review / check /
try guide were not run.
