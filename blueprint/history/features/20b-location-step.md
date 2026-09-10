# Feature: Location step (20b)

**From build-plan:** feature 20b (second leaf of item 20, "Creator onboarding
wizard"). Archived 2026-09-10.

**Branch:** `feat/creator-onboarding` (the umbrella branch for all of item 20,
as used for 20a; not merged per sub-item - one squash-merge when the wizard is
done. Supersedes the derived `feature/location-step`.)

Build-plan item **20b - Location step** (parent: 20, Creator onboarding wizard).
Source of intent: `creator-onboarding-requirements.md` §3 Screen 2 and
`blueprint/context/project-overview.md`.

## Goal

Replace the wizard's step-2 placeholder with a real Location step: a locked
Country field (Bangladesh, V1), a Division select, a City select dependent on
the chosen Division, and an optional Zip/Postal Code. City is a hard filter in
Search & Discovery, so it must be a **picked value from the Division's district
list - never free text**. The division/district data and the
country -> division -> city cascade are ported from the web app
(`../web/src/data/locations/`) into `data/locations.ts` so both apps agree on
the stored values, and the schema keeps a country-generic shape so a future US
launch adds a data table, not new fields.

No backend call. The step saves to the `creatorOnboarding` Redux draft and
advances, exactly like 20a's Basic Information step.

## Design reference

Same wizard pattern as 20a (`scenes/creator-onboarding/steps/BasicInformationStep.tsx`):
`ProfileStepHeader` (progress track + `X of 8` + title + one-line subtext),
`buttonStyle.primary` full-width `Next`, greyed until valid. New this step:
an in-screen **Back** affordance (requirements §5 - Back on every screen except
Screen 1), rendered as a chevron above the progress track, matching
`components/elements/AuthHeader`'s back button.

## In scope

- **`data/locations.ts`** (new) - ported from `../web/src/data/locations/`:
  - `BD_DIVISION_VALUES` - `as const` tuple of the web app's 8 lowercase
    division keys (`barisal`, `chittagong`, `dhaka`, `khulna`, `mymensingh`,
    `rajshahi`, `rangpur`, `sylhet`) so both apps store identical values.
  - `BD_DIVISIONS: { value, label }[]` - value + display label, web labels
    verbatim (`Barisal`, `Chittagong`, ...; see Open questions re: spelling).
  - `BD_DISTRICTS_BY_DIVISION: Record<string, string[]>` - the 64 districts,
    grouped by division, copied verbatim from
    `web/src/data/locations/bd-districts.ts`.
  - `LOCKED_COUNTRY = { value: 'bangladesh', label: 'Bangladesh' }`.
  - Country-generic helpers: `getDivisions(country)` -> `{value,label}[]` (or
    `[]`), `getCities(country, division)` -> `{value,label}[]` (or `[]` when
    either is missing), `getDivisionLabel(value)`. Shaped so a US launch adds a
    `US_STATES` / `US_CITIES` branch, not new call sites.
- **`utils/onboardingSchemas.ts`** - add:
  - `locationSchema = z.object({ country: z.literal('bangladesh'), division:
z.enum(BD_DIVISION_VALUES, { message: 'Select your division' }), city:
z.string().min(1, 'Select your city'), zip: z.string().trim().optional() })`
    plus an object-level `.refine` that `city` is one of
    `getCities(country, division)` (path `['city']`, message
    `'Select your city'`) - enforces "picked value, never free text" at the
    data layer.
  - `export type LocationValues = z.infer<typeof locationSchema>`.
- **`slices/creatorOnboarding.slice.ts`** - add `location?: LocationValues` to
  `CreatorOnboardingState`, a `saveLocation` reducer + named export, and update
  the `// 20b+` comment. `useCreatorOnboardingStep` needs no change.
- **`components/elements/CustomSelectField/`** - add two optional props
  (backward-compatible):
  - `disabled?: boolean` - dimmed, not pressable, `accessibilityState.disabled`
    true (used for the locked Country field).
  - `error?: string` - rendered below the trigger, same shape/quiet-when-absent
    as `TextField`'s error row.
  - Update `CustomSelectField.test.tsx`.
- **`components/elements/ProfileStepHeader/`** - add `onBack?: () => void`; when
  set, render a back chevron (`@/assets/images/icons/back-chevron.png`,
  `accessibilityLabel="Go back"`) above the progress track. Update
  `ProfileStepHeader.test.tsx`.
- **`scenes/creator-onboarding/steps/LocationStep.tsx`** (new) - step 2:
  - `useForm<LocationValues>({ resolver: zodResolver(locationSchema), mode:
'onChange', defaultValues: location ?? { country: 'bangladesh', division:
'', city: '', zip: '' } })`.
  - `ProfileStepHeader step={2} totalSteps={totalSteps} onBack={back}` with
    title/subtext (provisional copy, e.g. "Where are you based?" /
    "Your city is used to match you with campaigns near you").
  - Country: `CustomSelectField` `disabled`, value `bangladesh`, no sheet.
  - Division: `CustomSelectField` + scene-owned `OptionSheet`
    (`getDivisions('bangladesh')`); on select, if the value changed, also
    `setValue('city', '', { shouldValidate: true })`.
  - City: `CustomSelectField` + scene-owned `OptionSheet`
    (`getCities('bangladesh', division)`); `disabled` until a division is
    picked.
  - Zip: `ControlledTextField`, optional, `keyboardType="number-pad"`,
    `maxLength={10}`, no format check (requirements: keep off the critical path).
  - Both `OptionSheet`s are siblings of the `ScrollView`, not descendants (per
    `CustomSelectField`'s docblock - `@gorhom/bottom-sheet` has no portal here).
  - `Next`: `disabled={!isValid}`; on submit `dispatch(saveLocation(values));
saveAndContinue()`.
- **`scenes/creator-onboarding/CreatorOnboarding.tsx`** - add `2: LocationStep`
  to `STEP_COMPONENTS`.
- **`scenes/creator-onboarding/steps/PlaceholderStep.tsx`** - drop the `2:`
  `STEP_META` entry; move its Back to `ProfileStepHeader onBack` and remove the
  bottom Back button, so steps 3-8 stay visually consistent with the real
  step 2.
- **`scenes/creator-onboarding/steps/BasicInformationStep.tsx`** (20a
  follow-up, folded in here) - its gender `OptionSheet` and `CalendarPicker`
  are currently rendered inside the `Controller` inside the `ScrollView`,
  against `CustomSelectField`'s docblock ("the sheet has to be a sibling of the
  scene's ScrollView, not a descendant") and unlike `EditProfile`. Move both
  to siblings of the `ScrollView`, driven by `setValue(..., { shouldValidate:
true })` + `watch(...)` instead of the in-`Controller` `field.onChange`.
  LocationStep uses the same corrected pattern from the start.

## Out of scope

- Any non-Bangladesh country (the helpers are shaped for it; the data and a
  branch come with the US launch).
- Postal-code format validation, lookup, or autocomplete.
- Geolocation / "detect my location".
- Persisting the draft across app restarts.
- Steps 3-8 real content, the onboarding submit, and the completion screen
  (20c-20g).
- Renaming `profileStepStyle` (kept, as in 20a).

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"` -
build all steps, then one review packet. No inter-step commits. `/complete`
owns the commit; the branch is not merged until the whole wizard is done.

## Build steps

- [x] 1. **Location data** - `data/locations.ts` + `data/locations.test.ts`.
     Port `BD_DIVISION_VALUES`, `BD_DIVISIONS`, `BD_DISTRICTS_BY_DIVISION`
     verbatim from `../web/src/data/locations/`; add `LOCKED_COUNTRY`,
     `getDivisions`, `getCities`, `getDivisionLabel`.
     **Done when:** `npm run test` passes - 8 divisions; `getCities('bangladesh',
'dhaka')` has 13 entries; `getCities('bangladesh', 'sylhet')` has 4;
     `getCities('bangladesh', '')` and `getDivisions('united-states')` are `[]`;
     every `BD_DISTRICTS_BY_DIVISION` key is in `BD_DIVISION_VALUES`. `npx tsc
--noEmit` clean.

- [x] 2. **Location schema** - add `locationSchema` + `LocationValues` to
     `utils/onboardingSchemas.ts`; extend `utils/onboardingSchemas.test.ts`.
     **Done when:** tests pass - a full valid Dhaka/Dhaka entry accepted; missing
     division rejected; `city: ''` rejected; a city not in the chosen division
     (e.g. `division: 'sylhet', city: 'Dhaka'`) rejected; a free-text city
     (`'Nowhere'`) rejected; `zip` omitted accepted; `zip: '1207'` accepted.
     `npx tsc --noEmit` clean.

- [x] 3. **Slice** - `location?: LocationValues` + `saveLocation` in
     `slices/creatorOnboarding.slice.ts`; extend
     `slices/creatorOnboarding.slice.test.ts`.
     **Done when:** tests pass - `saveLocation` stores the payload; `reset` clears
     it. `npm run test` green; `npx tsc --noEmit` clean.

- [x] 4. **Shared component props** - `CustomSelectField` `disabled` + `error`;
     `ProfileStepHeader` `onBack`. Update
     `components/elements/CustomSelectField/CustomSelectField.test.tsx` and
     `components/elements/ProfileStepHeader/ProfileStepHeader.test.tsx`.
     **Done when:** tests pass - a `disabled` `CustomSelectField` does not call
     `onPress` when pressed and exposes `accessibilityState.disabled`; its `error`
     string renders; `ProfileStepHeader` with `onBack` renders a "Go back" control
     that fires the callback, and without `onBack` renders none. `npm run test`
     green; `npx tsc --noEmit` clean.

- [x] 5. **LocationStep scene + wire-in** - `LocationStep.tsx`, register step 2
     in `CreatorOnboarding.tsx`, trim `PlaceholderStep.tsx`, and move
     `BasicInformationStep.tsx`'s gender sheet + calendar to `ScrollView`
     siblings (see In scope). Add
     `scenes/creator-onboarding/steps/LocationStep.test.tsx` (mock `OptionSheet`
     with a stand-in that emits a value, as `BasicInformationStep.test.tsx`
     does; build the store inline).
     **Done when:** the LocationStep test passes - renders "2 of 8"; `Next`
     disabled and City disabled on first render; picking a Division enables
     City; picking a City enables `Next`; pressing `Next` stores `location` and
     moves the store to `currentStep === 3`; changing the Division after a City
     was picked clears the City and re-disables `Next`; the header Back moves
     the store to `currentStep === 1`. `BasicInformationStep.test.tsx` still
     passes. `npm run test` green; `npx tsc --noEmit` clean.

- [x] 6. **Full verify** - `npx prettier --check` on every touched/new file,
     `npm run lint`, `npm run test`, `npx tsc --noEmit`.
     **Done when:** all clean (lint may keep the one pre-existing
     `app/_layout.tsx` warning). Do **not** run `npm run format` - it is a
     repo-wide `prettier --write` and rewrites unrelated non-Prettier-clean files
     (see 20a's archive).

## Files / areas

| Area                                                        | Change                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| `data/locations.ts` (+ test)                                | new - ported BD division/district data + generic helpers |
| `utils/onboardingSchemas.ts` (+ test)                       | add `locationSchema` / `LocationValues`                  |
| `slices/creatorOnboarding.slice.ts` (+ test)                | `location` draft + `saveLocation`                        |
| `components/elements/CustomSelectField/*`                   | `disabled` + `error` props (+ test)                      |
| `components/elements/ProfileStepHeader/*`                   | `onBack` prop (+ test)                                   |
| `scenes/creator-onboarding/steps/LocationStep.tsx` (+ test) | new - step 2                                             |
| `scenes/creator-onboarding/CreatorOnboarding.tsx`           | register step 2                                          |
| `scenes/creator-onboarding/steps/PlaceholderStep.tsx`       | drop step 2 entry; header Back                           |

Untouched: the 20a slice/hook API, `authGate`, `VerifyOtp`, `profile` slice.

## Data / contracts

Client-only Redux state (no API):

```ts
// data/locations.ts
export const BD_DIVISION_VALUES = [
  'barisal',
  'chittagong',
  'dhaka',
  'khulna',
  'mymensingh',
  'rajshahi',
  'rangpur',
  'sylhet',
] as const;
export type BdDivision = (typeof BD_DIVISION_VALUES)[number];

// utils/onboardingSchemas.ts
interface LocationValues {
  country: 'bangladesh'; // literal, locked in V1
  division: BdDivision; // required, one of the 8
  city: string; // required; a district name from the division
  zip?: string; // optional, trimmed, no format rule
}

// slices/creatorOnboarding.slice.ts
interface CreatorOnboardingState {
  currentStep: number;
  completedSteps: number[];
  basics?: BasicInformationValues;
  location?: LocationValues; // <- added
}
```

- Division/district **values** are the web app's exact strings (lowercase
  division keys; district names as-is including `Cox's Bazar`, `Chapai
Nawabganj`) so a shared backend contract matches both apps.
- `city` is stored as the district-name string, not an id.
- `zip` stored verbatim (trimmed); empty/absent both mean "not provided".

## Testing

`npm run test` (Jest + RNTL). New / extended:

- `data/locations.test.ts` - division count, district counts, empty-input
  guards, key/value consistency.
- `utils/onboardingSchemas.test.ts` - `locationSchema` valid / missing-division
  / empty-city / wrong-division-city / free-text-city / zip-optional.
- `slices/creatorOnboarding.slice.test.ts` - `saveLocation`, `reset`.
- `components/elements/CustomSelectField/CustomSelectField.test.tsx` - `disabled`
  and `error` behaviour.
- `components/elements/ProfileStepHeader/ProfileStepHeader.test.tsx` - `onBack`.
- `scenes/creator-onboarding/steps/LocationStep.test.tsx` - the step flow (see
  step 5 Done-when).

No browser-test command exists; none added.

## Notes for the AI

- Follow 20a's step pattern exactly: the step component owns its `useForm`
  (seeded from the slice draft), its `ProfileStepHeader`, its CTA row, and its
  `OptionSheet`s; the shell only switches on `currentStep`.
- Dispatch `saveLocation(values)` then call `saveAndContinue()` (from
  `useCreatorOnboardingStep`) - do not call `goToStep` directly.
- `OptionSheet`s must be siblings of the `ScrollView` (not inside it), like the
  gender sheet in `BasicInformationStep.tsx`.
- Clear `city` whenever `division` changes (`setValue('city', '', {
shouldValidate: true })`) so a stale city can't survive a division switch;
  the schema's `.refine` is the backstop for a restored draft.
- Port the district data by copying `web/src/data/locations/bd-districts.ts`'s
  object verbatim - do not retype it (transcription risk on 64 names).
- `date-fns`/`dayjs` are not deps (not needed here anyway).
- `CustomSelectField.error` should mirror `TextField`'s error row markup so the
  two read the same in a form.
- Do not run `npm run format`. Scope Prettier to changed files.
- After this feature, `project-overview.md` already lists item 20's field set
  (basics, location, ...); no `/overview` re-run needed.

## Open questions

- **Division label spelling.** The web app labels two divisions `Chittagong`
  and `Barisal` (older transliteration); `creator-onboarding-requirements.md`
  §3 writes `Chattogram` and `Barishal` (current official spelling). This spec
  ports the web labels verbatim so the two apps render identically and share
  one source. If product wants the newer spellings, that is a one-line change
  in `data/locations.ts` (labels only - the stored values stay `chittagong` /
  `barisal`). Not blocking.

## Status: verified (2026-09-10)

All 6 build steps complete and checked. Final gate:

- `npx prettier --check` on every touched/new file - clean (fixed with a
  file-scoped `prettier --write`, never repo-wide)
- `npm run lint` - 0 errors (the one pre-existing `app/_layout.tsx` warning,
  untouched)
- `npx tsc --noEmit` - clean
- `npm run test` - 91 suites / 326 tests pass (baseline 89 / 301; +2 suites,
  +25 tests: `data/locations` 8, `locationSchema` 7, slice 1,
  `CustomSelectField` 2, `ProfileStepHeader` 2, `LocationStep` 5)

Scope note: step 5 folded in a **20a follow-up** -
`BasicInformationStep.tsx`'s gender sheet and calendar were rendered inside
the `Controller` inside the `ScrollView`, contrary to `CustomSelectField`'s
docblock and `EditProfile`'s pattern (`@gorhom/bottom-sheet` positions against
its parent; no portal provider here). Both were moved to `ScrollView` siblings
driven by `watch` + `setValue`; its 3 tests still pass. LocationStep uses the
corrected pattern from the start.

Findings (`blueprint/context/findings.md`): no P0/P1. F-02 [P2, open] and
F-04 [P3, fixed] are unrelated to this step and do not block `/complete`.
`qualityGates.regular` are all `manual` - audit / independent review / check /
try guide were not run.
