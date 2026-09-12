# Current Feature

**Status:** verified — `npx tsc --noEmit` clean; `npm run test` 111 suites / 460
tests green; `npm run lint` 0 errors (2 pre-existing warnings outside this
feature). All ten onboarding steps render through `OnboardingStepScreen` with
one field-gap rhythm (`spacing.md`), consistent labels, and shared
section/helper/error/counter text styles.

**Branch:** feat/creator-onboarding _(continues the onboarding-wizard branch)_

## Decisions (reviewed 2026-09-10)

1. **Polish ceiling** — approved as written. Structure/spacing/label/text-style/
   control-radius/keyboard harmonization only; not a visual redesign.
2. **Field labels** — label above every input-bearing field; `sectionLabel`
   above every option list.
3. **Field gap** — one value for form fields _and_ option rows: `spacing.md`
   (12). Supersedes the `spacing.lg` suggestion in build steps 1 and 2 below.
4. **Control restyling scope** — restyle onboarding-only controls
   (`SelectableRow`, `DateField`, `PortfolioEntryCard`) in place; reach a
   consistent look for shared controls via props/wrappers only.

`OnboardingStepScreen` keeps `totalSteps` as a required prop (every call site
already passes it from the onboarding hook); no `@/slices` import is added to
`components/elements`.

## Plan addition (approved)

Appended to `blueprint/build-plan.md` after item 21:

```markdown
## Onboarding UI polish

- [ ] 22. **Harmonize the onboarding step UI** - give all ten creator
      onboarding steps one identical, modern layout: a shared step-screen
      wrapper (scroll body + keyboard handling + pinned footer), one field
      spacing rhythm, consistent field labels, and shared section / helper /
      counter / error text styles. Visual consistency and polish only - no new
      screens, data, or copy rewrites.
```

Pure UI/UX. No `project-plan.md` change (§7 already defers UI to
`docs/design-system.md` + `docs/screen/*`).

## Goal

Every step rendered by `scenes/creator-onboarding/CreatorOnboarding.tsx` (Basic
Information, Bio, Location, Content Categories, Subcategories, Languages,
Deliverables, Photos, Portfolio, Username) currently repeats the same outer
skeleton by hand and then styles its inner fields, labels, helper text, counters
and errors with per-file one-off `StyleSheet`s. The result: three different
field-gap values, some steps label every field and some label none, five
different "small text under a field" styles, and no keyboard handling for the
text steps. Make the ten steps look and behave identically — modern, clean,
professional — without redesigning the product.

## Design reference

Follow `docs/design-system.md` and `theme/` tokens (`spacing`, `radius`,
`typography`, `palette`, `colors`). Do not introduce new colors, radii, font
sizes, or spacing values outside those scales. The pink progress bar, `X of N`
counter, one-line subtext, and full-width pink CTA stay as they are — that
pattern is already correct; this makes the rest of each screen match it.

## In scope

- A shared **`OnboardingStepScreen`** layout component that owns: the
  `ScrollView` (`keyboardShouldPersistTaps="handled"`, hidden indicator),
  keyboard avoidance for the footer, `ProfileStepHeader`, the scroll body slot,
  and a pinned footer holding the primary CTA with a hairline top divider.
  Every step renders `<OnboardingStepScreen step title description onBack
onNext nextDisabled nextLabel>{fields}</OnboardingStepScreen>`.
- One canonical field-group style in `styles/profileStep.ts` (`fields`), used by
  every step; `optionList` and the ad-hoc `layoutStyle.fieldGroup` usage in
  onboarding collapse onto it.
- Shared onboarding text styles in `styles/profileStep.ts`: `sectionLabel`,
  `helperText`, `fieldError`, `counter` — replacing the local `StyleSheet`
  blocks in `BioStep`, `SubcategoriesStep`, `PhotosStep`, `PortfolioStep`,
  `UsernameStep`.
- Consistent **field labels**: every input-bearing field gets a `label`
  (BasicInformation and Location already do); the multi-select steps get a
  short `sectionLabel` above the option list. "Others" free-text inputs use one
  treatment (`profileStepStyle.otherInput`, placeholder "Please specify").
- Align the onboarding-only controls to one shape (`radius.lg`, one min-height,
  one selected-border treatment): `SelectableRow`, `DateField`,
  `PortfolioEntryCard`, and `ProfileStepHeader` polish. A light focused-border
  state on text inputs used in onboarding.
- Swap raw `fontSize`/`fontWeight` literals in the step scenes for `typography`
  tokens where one fits.
- Update `docs/design-system.md` only if it documents the onboarding pattern;
  otherwise leave it.

## Out of scope

- Any change to what a step captures, validates, or dispatches; step order;
  step count; copy (titles/descriptions/placeholders) beyond making "Others"
  placeholders consistent.
- Restyling shared cross-app components' defaults: `TextField`,
  `CustomSelectField`, `ImageUploader`, `AddItemButton`, `CategoryChip`,
  `Button` are used outside onboarding (auth, Edit Profile, Create Gig, Search)
  — reach a consistent look via props/wrappers, never by changing their
  defaults. If a shared control genuinely cannot match without a default
  change, stop and raise it.
- New illustrations, animations beyond a simple progress-bar width transition,
  theming changes, or a visual redesign (new layout paradigm, new color use).
- Non-onboarding screens.

## Build loop

`blueprint/config.json`: `workflow.stepReview: "feature"`,
`checkpointCommits: "disabled"`. Build all steps, keep the tree green after each,
one review packet, then `/complete`. Verify with `npm run test` +
`npx tsc --noEmit` + `npm run lint`. Do **not** run `npm run format` (repo-wide);
`prettier --check` the feature's own files.

## Build steps

- [x] **1. Shared step-screen wrapper + onboarding style tokens.**
  - `styles/profileStep.ts`: add `fields` (canonical vertical gap — reconcile
    `fieldGroup` gap `sm` vs `optionList` gap `14`; pick one, `spacing.lg` a
    likely choice, record the decision), `sectionLabel`, `helperText`,
    `fieldError`, `counter`. Keep `optionList` as an alias of `fields` for one
    release or delete it and update callers here.
  - New `components/elements/OnboardingStepScreen/` (`.tsx`, `index.ts`,
    `.test.tsx`): props `step`, `totalSteps` (optional — default from the
    onboarding hook is fine to leave to the caller), `title`, `description`,
    `onBack?`, `onNext`, `nextDisabled?`, `nextLabel?` (default `"Next"`),
    `nextTestID?` (default `"onboarding-next"`), `footerSlot?` (for steps that
    add a second control), `children`. Renders the `ScrollView` +
    `ProfileStepHeader` + body + a `KeyboardAvoidingView`-wrapped footer with a
    `palette.gray[100]` hairline top border. Keep `testID="onboarding-next"` on
    the CTA so existing tests pass unchanged.
  - Test: renders the header counter, fires `onBack` / `onNext`, respects
    `nextDisabled`, shows `nextLabel`.
  - **Done when:** `npm run test` for the new component green; `npx tsc --noEmit`
    clean; nothing else changed yet.

- [x] **2. Adopt the wrapper in steps 1-5 (Basic, Bio, Location, Categories,
      Subcategories).**
  - Replace each step's `<><ScrollView>…<ProfileStepHeader/>…</ScrollView><View><Button/></View></>`
    boilerplate with `<OnboardingStepScreen …>`. Keep the exact
    `handleSubmit(onSubmit)` wiring as `onNext`, `!isValid` (or the step's real
    condition) as `nextDisabled`. Bottom-sheet siblings (`OptionSheet`,
    `CalendarPicker`) stay as siblings — the wrapper must allow trailing
    siblings, or the step keeps a fragment around `<OnboardingStepScreen/>` +
    sheets.
  - Field bodies use `profileStepStyle.fields`. Add `label` to Bio's field
    ("Your bio") and a `sectionLabel` above the Categories / Subcategories
    option lists. Bio's counter uses `profileStepStyle.counter`;
    Subcategories' section/message/error use the shared tokens; delete those
    files' local `StyleSheet`s.
  - "Others" inputs: `profileStepStyle.otherInput`, placeholder
    `"Please specify"` in both Categories and Subcategories.
  - Update the five step tests only where structure moved — every
    `testID`, visible label, counter string, and step-number assertion must
    stay identical, so most tests should need no change. Fix any that assumed
    the old element tree.
  - **Done when:** `npm run test` green; steps 1-5 render through
    `OnboardingStepScreen`; no local `StyleSheet` for helper/counter/error text
    remains in those five files.

- [x] **3. Adopt the wrapper in steps 6-10 (Languages, Deliverables, Photos,
      Portfolio, Username).**
  - Same conversion. Photos: its "Profile photo" / "Cover photo" labels use
    `sectionLabel`; the "recommended but optional" line and Remove control use
    `helperText`; delete the local `styles`. Portfolio: the zero-entry nudge
    uses `helperText`; `AddItemButton` stays. Username: the availability status
    row, "Try one of these" label, and suggestion chips keep their behavior but
    use `helperText` / shared spacing; add a `label` ("Username") to the field.
  - Languages / Deliverables get a `sectionLabel`; "Others" input treatment
    matches step 2's decision.
  - Update these tests only for moved structure; preserve every `testID` and
    string.
  - **Done when:** `npm run test` green (full suite); all ten steps go through
    `OnboardingStepScreen`.

- [x] **4. Control-shape + typography polish.**
  - `SelectableRow`, `DateField`, `PortfolioEntryCard`: align border radius to
    `radius.lg`, one min-height, one selected/error border color from
    `palette`. These are onboarding-only (verified: no other importers), so
    changing them here is safe.
  - `ProfileStepHeader`: optional progress-bar width transition
    (`LayoutAnimation` or an `Animated` width) — small, tasteful, skip if it
    risks flakiness in tests.
  - Replace raw `fontSize` / `fontWeight` literals in the step scenes and the
    touched components with `typography` tokens where one matches.
  - A focused-border state (`palette.primary[400]`) for onboarding text inputs —
    via an `OnboardingTextField` thin wrapper over `ControlledTextField` if a
    prop on the shared `TextField` would leak elsewhere.
  - **Done when:** `npm run lint` + `npm run test` green; `npx tsc --noEmit`
    clean; a visual pass (below) is offered.

## Files / areas

| Area                     | Files                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| New                      | `components/elements/OnboardingStepScreen/*`                                                                              |
| Styles                   | `styles/profileStep.ts`                                                                                                   |
| Steps                    | all of `scenes/creator-onboarding/steps/*.tsx` (+ tests as needed)                                                        |
| Onboarding-only controls | `components/elements/SelectableRow/*`, `DateField/*`, `PortfolioEntryCard/*`, `ProfileStepHeader/*`                       |
| Docs                     | `docs/design-system.md` (only if it covers onboarding)                                                                    |
| Not touched              | `components/elements/TextField`, `CustomSelectField`, `ImageUploader`, `AddItemButton`, `CategoryChip`, `Button` defaults |

## Data / contracts

None. No slice, schema, payload, route, or network change. `useCreatorOnboardingStep`,
`ONBOARDING_TOTAL_STEPS`, every `saveX` action, and every `testID` are unchanged.

## Testing

- The existing ~70 onboarding tests assert `testID`s, visible text, and step
  transitions — not styles. A structural refactor that preserves those keeps
  them green; treat any onboarding test failure as a regression to fix, not a
  test to loosen.
- Add `OnboardingStepScreen.test.tsx` (render + callbacks + disabled state).
- No screenshot/visual-regression tooling in this repo. UI evidence is
  `when-available` (config) — not required, and not claimed. The final packet
  offers a manual `/try latest` walkthrough of all ten screens.

## Notes for the AI

- The bottom-sheet steps (Basic Information → `CalendarPicker`/`OptionSheet`,
  Location → `OptionSheet`) render the sheet as a **sibling** of the scroll
  area, not inside it. `OnboardingStepScreen` must not swallow that — either
  accept a `sheetsSlot`/trailing children or let the step wrap
  `<><OnboardingStepScreen/>{sheets}</>`.
- Keep the CTA `testID` `"onboarding-next"` and the handle field `testID`
  `"onboarding-handle"`, etc. — do not rename any `testID`.
- PhotosStep's `Next` is always enabled (optional step); Portfolio's depends on
  a live schema parse, not `formState.isValid`; Username's is
  `formatValid && state === 'available'`. Pass each step's real condition as
  `nextDisabled` — do not standardize the gating logic, only the layout.
- Prefer deleting a per-file `StyleSheet` entirely over leaving one member.
- Match existing code: `StyleSheet.create`, `useTheme()` for color, tokens for
  the rest.

## Open questions

None outstanding — all four resolved; see "Decisions" above.
