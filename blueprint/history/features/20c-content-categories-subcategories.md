# Feature: Content categories + subcategories (20c)

**From build-plan:** feature 20c (third leaf of item 20, "Creator onboarding
wizard"). Archived 2026-09-10.

**Branch:** `feat/creator-onboarding` (the umbrella branch for all of item 20,
as used for 20a/20b; not merged per sub-item - one squash-merge when the wizard
is done. Supersedes the derived `feature/content-categories-subcategories`.)

**Status:** verified - all build steps done; `tsc --noEmit`, `expo lint`, and
`npm run test` (94 suites / 350 tests) pass. Committed on `feat/creator-onboarding`.

> Continues the existing item-20 branch (20a shell + 20b location were committed
> here). Config's `featureBranchPrefix` is `feature/`, but every item-20
> sub-feature shares `feat/creator-onboarding`; keep that pattern.

## Goal

Build **Step 3 of the creator onboarding wizard - Content Categories**
(`creator-onboarding-requirements.md` §3 Screen 3, build-plan 20c). The creator
multi-selects from the eight content categories; selecting one expands its
subcategory list inline as an accordion, and each selected category must have at
least one subcategory chosen before `Next` enables. Deselecting a category
clears its subcategories. "Others" replaces the checklist with a free-text
"Please specify" input whose value later becomes both a category and a
subcategory.

The step follows the wizard pattern already proven by 20a/20b: one component in
`scenes/creator-onboarding/steps/`, its own react-hook-form seeded from the
saved Redux draft, `ProfileStepHeader` + full-width pink `Next` disabled until
the step's zod schema passes. No network call. No new route.

## Design reference

Visual pattern is inherited, not pixel-replicated: pink progress track, `3 of 8`
counter, 26px title, grey one-line subtext, full-width pink CTA - all from
`ProfileStepHeader` and `buttonStyle.primary`, exactly as `LocationStep` and
`BasicInformationStep` use them. `creator-onboarding-requirements.md` §3 Screen
3 is the behavioural source. No Figma node is specified for this screen; do not
invent one.

## In scope

- `data/contentCategories.ts` - the eight categories (values aligned with the
  existing `data/gigCategories.ts` set plus `others`), their display labels, and
  the per-category subcategory tables from the requirements doc, with stable
  string values and a `getSubcategories(categoryValue)` helper.
- `contentCategoriesSchema` + `ContentCategoriesValues` in
  `utils/onboardingSchemas.ts`, enforcing: at least one category; every selected
  non-`others` category has >= 1 subcategory; when `others` is selected, a
  non-empty (trimmed) specify string within a max length.
- `creatorOnboarding` slice: a `contentCategories` draft field and a
  `saveContentCategories` action, mirroring `saveBasics` / `saveLocation`.
- A `ContentCategoryAccordion` element component: a selectable category header
  row (checkbox + label + expand chevron) over an expandable body that is either
  a subcategory checklist (built from options) or caller-supplied children (the
  Others text field).
- `ContentCategoriesStep` scene wired into `CreatorOnboarding` as step 3, with
  the accordion list, per-category "pick at least one" inline hint, the Others
  free-text branch, `Next` gated on `formState.isValid`, save-and-advance to
  step 4, and header Back to step 2.
- Remove step 3 from `PlaceholderStep`'s `STEP_META`.
- Unit tests: data module, schema, slice action, the new component, and the step
  (RNTL, mirroring `LocationStep.test.tsx`).

## Out of scope

- Steps 20d-20g (languages, deliverables, photos, portfolio, username, Finish)
  and the `FormData` payload assembly - `contentCategories` is only persisted to
  the draft here. The "Others becomes both a category and a subcategory"
  transformation happens at payload-assembly time in 20g; this step just stores
  the specify string.
- Editing `data/gigCategories.ts` (it feeds the Create Gig `SelectField` and
  uses a different type and the label "Beauty & Life Style"; leave it).
- Any backend call, and surfacing these fields in `scenes/main/EditProfile.tsx`.
- Subcategory as a matching hard filter - the requirements note it is a soft
  ranking boost server-side; nothing to build here.
- Category icons (the retired `SelectableListItem` rows had icons; the accordion
  header does not need one and none are specified).

## Build loop

`workflow.stepReview` is `feature` and `checkpointCommits` is `disabled`:
implement all build steps in one pass without per-step approval pauses or
checkpoint commits. After the last step, present a single review packet covering
the whole feature. `/complete` makes the one feature commit on
`feat/creator-onboarding`. Run `npm run test` (and `npm run lint`) before the
review packet.

## Build steps

- [x] **1. Data module + schema + slice.**
  - `data/contentCategories.ts`: export `CONTENT_CATEGORY_OPTIONS`
    (`{ value; label }[]`, order: Education, Beauty & Lifestyle, Travel, Music,
    Gym & Body Building, Sports, Health, Others), `OTHERS_CATEGORY_VALUE =
'others'`, a `SUBCATEGORIES_BY_CATEGORY: Record<string,
{ value; label }[]>` built from the requirements tables, and
    `getSubcategories(categoryValue)`. Category values reuse
    `gigCategories.ts`: `education`, `beauty`, `travel`, `music`, `gym`,
    `sports`, `health`; add `others`. Subcategory `value` = the label
    lower-cased with each run of non-alphanumeric characters collapsed to one
    hyphen and edge hyphens trimmed (e.g. `Academic/Study Tips` ->
    `academic-study-tips`, `Local Travel (BD)` -> `local-travel-bd`); write the
    values out literally in the file, do not compute them at runtime. Full
    tables are in `creator-onboarding-requirements.md` §3 Screen 3.
  - `utils/onboardingSchemas.ts`: add
    `export const OTHERS_TEXT_MAX_LENGTH = 60;` and

    ```text
    contentCategoriesSchema = z.object({
      categories: z.array(z.object({
        value: z.string(),
        subcategories: z.array(z.string()),
      })).min(1, 'Select at least one category'),
      othersText: z.string().trim().max(OTHERS_TEXT_MAX_LENGTH).optional(),
    }).superRefine((v, ctx) => {
      for each entry:
        if entry.value === 'others': require v.othersText?.trim() to be non-empty
          (issue on path ['othersText'], message 'Tell us what you create')
        else: require entry.subcategories.length >= 1
          (issue on path ['categories', i, 'subcategories'],
           message 'Pick at least one subcategory')
    })
    ```

    Export `ContentCategoriesValues = z.infer<...>`.

  - `slices/creatorOnboarding.slice.ts`: add `contentCategories?:
ContentCategoriesValues` to state + `initialState`, a `saveContentCategories`
    reducer, export it, add it to the destructured `slice.actions` export list,
    and update the header comment / `CreatorOnboardingState` field comment.
  - Tests: `data/contentCategories.test.ts` (every category has a non-empty
    subcategory list except `others`; a spot-check of generated values; options
    count is 8). Extend `utils/onboardingSchemas.test.ts` (empty categories
    fails; a category with no subcategory fails; `others` with blank text fails;
    `others` with text passes; a normal full selection passes). Extend
    `slices/creatorOnboarding.slice.test.ts` (`saveContentCategories` stores the
    value; `reset` clears it; initial state includes
    `contentCategories: undefined`).
  - **Done when:** `npm run test` passes for the new/changed data, schema, and
    slice specs and `tsc` is clean; no UI change yet.

- [x] **2. `ContentCategoryAccordion` component.**
  - `components/elements/ContentCategoryAccordion/` (`.tsx`, `.test.tsx`,
    `index.ts`), following the folder/style/`useTheme` conventions of
    `AccordionItem` and `SelectableListItem`.
  - Props: `label`, `selected`, `expanded`, `onToggleSelected`,
    `onToggleExpanded`, plus either `subcategoryOptions: { value; label }[]` +
    `selectedSubcategories: string[]` + `onToggleSubcategory(value)` for the
    checklist body, or `children` which, when provided, render as the body
    instead (the Others text field). `error?: string` renders an inline
    message under the body when expanded. `testID?`.
  - Header row is a `Pressable` with `accessibilityRole="button"` and
    `accessibilityState={{ selected, expanded }}`: a `Checkbox` (`checked=
{selected}`, its own press toggles `onToggleSelected`), the label, and the
    reused `create-gig/chevron-down` asset rotated 180deg when `expanded`
    (as `AccordionItem` does). Tapping the row body toggles `onToggleExpanded`.
  - Body shows only when `selected && expanded`. Checklist rows are
    `Pressable` + `Checkbox` + label, `accessibilityRole="checkbox"` via the
    `Checkbox`.
  - Reuse `profileStepStyle.optionList` gap where a stacked list is rendered;
    keep component-internal spacing local to the file.
  - **Done when:** the component test passes - collapsed body is not rendered;
    toggling selected calls `onToggleSelected`; a subcategory press calls
    `onToggleSubcategory` with its value; `children` override replaces the
    checklist; `error` text shows only when selected + expanded.

- [x] **3. `ContentCategoriesStep` scene + wizard wiring.**
  - `scenes/creator-onboarding/steps/ContentCategoriesStep.tsx`: `useForm<
ContentCategoriesValues>({ resolver: zodResolver(contentCategoriesSchema),
mode: 'onChange', defaultValues: contentCategories ?? { categories: [],
othersText: '' } })`. Read/write `categories` and `othersText` through
    `watch` + `setValue(..., { shouldValidate: true })`, the same indirection
    `LocationStep` uses.
  - Local `expanded: Record<string, boolean>` state (multiple categories may be
    open at once - requirements: "each shows its own subcategory list
    independently"). Selecting a category adds `{ value, subcategories: [] }`
    and sets its `expanded` true; deselecting removes the entry, drops its
    `expanded`, and - for `others` - clears `othersText`.
  - Toggling a subcategory updates that entry's `subcategories` array.
  - The Others accordion renders a `ControlledTextField` (or `TextField` via
    `setValue`) for `othersText` as the accordion `children`, `maxLength=
{OTHERS_TEXT_MAX_LENGTH}`, placeholder "Please specify", with the schema's
    `othersText` error surfaced.
  - Per-category inline hint: when a non-`others` category is selected with zero
    subcategories, pass the "Pick at least one subcategory" `error` to its
    accordion.
  - `ProfileStepHeader` `step={3}` `totalSteps={totalSteps}` title "What content
    do you create?" description "Pick the categories and subcategories that fit
    your work" `onBack={back}` (copy carried from `PlaceholderStep`'s current
    step-3 meta; keep or lightly refine). Scrollable body + fixed bottom `Next`
    (`disabled={!isValid}`, `testID="onboarding-next"`), matching `LocationStep`
    layout exactly.
  - `onSubmit`: `dispatch(saveContentCategories(values))` then
    `saveAndContinue()`.
  - `scenes/creator-onboarding/CreatorOnboarding.tsx`: add `3:
ContentCategoriesStep` to `STEP_COMPONENTS`.
  - `scenes/creator-onboarding/steps/PlaceholderStep.tsx`: delete the `3:` entry
    from `STEP_META`.
  - `ContentCategoriesStep.test.tsx` mirroring `LocationStep.test.tsx`: renders
    "3 of 8" and `Next` starts disabled; selecting a category shows its
    subcategories and keeps `Next` disabled; picking one subcategory enables
    `Next`; selecting a second category re-disables until it too has a
    subcategory; deselecting a category clears its subcategories (re-enables
    when the remaining state is valid); the Others branch enables `Next` once
    text is entered; a valid submit stores `contentCategories` and advances to
    step 4; header Back returns to step 2.
  - **Done when:** `npm run test` passes including the new step test, `npm run
lint` is clean, and the wizard advances Basics -> Location -> **Content
    Categories** -> (placeholder) step 4 with Back restoring each saved answer.

## Files / areas

- `data/contentCategories.ts` (new), `data/contentCategories.test.ts` (new)
- `utils/onboardingSchemas.ts`, `utils/onboardingSchemas.test.ts`
- `slices/creatorOnboarding.slice.ts`, `slices/creatorOnboarding.slice.test.ts`
- `components/elements/ContentCategoryAccordion/` (new: `.tsx`, `.test.tsx`,
  `index.ts`)
- `scenes/creator-onboarding/steps/ContentCategoriesStep.tsx` (new),
  `ContentCategoriesStep.test.tsx` (new)
- `scenes/creator-onboarding/CreatorOnboarding.tsx`,
  `scenes/creator-onboarding/steps/PlaceholderStep.tsx`
- Reuse only: `ProfileStepHeader`, `Checkbox`, `ControlledTextField` /
  `TextField`, `Button`, `layoutStyle`, `buttonStyle`, `profileStepStyle`,
  `useCreatorOnboardingStep`, `assets/images/create-gig/chevron-down.png`

## Data / contracts

- **No API contract.** No backend endpoint consumes this yet; the platform
  contracts under `../platform-context/` define no onboarding submit route.
- **Draft shape (`creatorOnboarding.contentCategories`):**
  `{ categories: { value: string; subcategories: string[] }[]; othersText?:
string }`. `value` is a `CONTENT_CATEGORY_OPTIONS` value (including
  `'others'`). This is an internal, in-memory representation with no stored data
  or external compatibility today; it is chosen for round-tripping through
  react-hook-form and is safe to revise in 20g when the payload shape is
  specified.
- **Category values** (stable, reused from `data/gigCategories.ts` + `others`):
  `education`, `beauty`, `travel`, `music`, `gym`, `sports`, `health`,
  `others`.
- **Subcategory values:** kebab-case of the requirements label as defined in
  step 1; written literally in `data/contentCategories.ts`. Note the deliberate
  distinction between Gym's `nutrition-diet` ("Nutrition/Diet") and Health's
  `nutrition` ("Nutrition").
- **`OTHERS_TEXT_MAX_LENGTH = 60`** - repository-native cap (the requirements
  are silent); trimmed before the non-empty check.
- **Label note:** use "Beauty & Lifestyle" (requirements spelling) for value
  `beauty`; `gigCategories.ts` says "Beauty & Life Style" and is intentionally
  left untouched.

## Testing

`npm run test` (Jest + `jest-expo` + RNTL) is the gate. Add:

- **Data:** every non-`others` category resolves to a non-empty subcategory
  list; `CONTENT_CATEGORY_OPTIONS` has 8 entries ending in `others`; spot-check
  two generated subcategory values.
- **Schema:** empty `categories` fails; selected category with no subcategory
  fails on the `categories.i.subcategories` path; `others` selected with blank /
  whitespace `othersText` fails on the `othersText` path; `others` with text
  passes; a two-category selection each with a subcategory passes.
- **Slice:** `saveContentCategories` stores the payload; `reset` clears it;
  initial state has `contentCategories: undefined`.
- **Component:** collapsed/unselected body not rendered; header toggles;
  subcategory press reports the value; `children` override; `error` visibility.
- **Step:** the `LocationStep.test.tsx`-style scenarios listed in build step 3
  (mock any bottom-sheet-based control if used; the accordion checklists are
  plain `Pressable`s and need no mock).

No browser test (no `Browser tests` command configured). No live/visual evidence
will be claimed - `/check` or `/try` can exercise the running wizard later.

## Notes for the AI

- Match `LocationStep.tsx` structure closely: `<>` fragment wrapping a
  `ScrollView` (`layoutStyle.screen` / `layoutStyle.scrollContent`) then a fixed
  `<View style={layoutStyle.scrollContent}>` holding the `Next` `Button`. Keep
  `testID="onboarding-next"` so the shared test helpers work.
- The wizard step machine (`useCreatorOnboardingStep`) is unchanged: dispatch
  the typed save action, then call `saveAndContinue()`. Do not add step-specific
  logic to the hook.
- Each step owns its own form seeded from the slice draft, so Back/forward
  restoration is automatic - do not add effects to sync form <-> slice on every
  change; only persist on submit, exactly as steps 1 and 2 do.
- `Checkbox` renders an exported checked asset and a bordered square; it already
  sets `accessibilityRole="checkbox"`. Do not rebuild it.
- `AccordionItem` is Q&A-specific (`question` / `answer` strings, single-open
  Help Center semantics) - it is a style reference, not a base to extend. Build
  `ContentCategoryAccordion` fresh.
- User-entered `othersText` is rendered only inside a `TextField`; no rich text,
  no HTML surface - React Native `Text` escapes it. Still trim before store and
  cap at `OTHERS_TEXT_MAX_LENGTH`.
- Keep category ordering stable and identical between
  `CONTENT_CATEGORY_OPTIONS`, the rendered list, and the stored `categories`
  array is **not** required to be sorted - store in selection order, the
  requirement is only ">= 1 subcategory each".
- Run `npm run format` before finishing; the repo's CI runs `format` -> `lint`
  -> `test`.

## Open questions

None blocking. Deferred to 20g (payload assembly), not this step:

- The exact wire representation of "Others as both a category and a
  subcategory" - here it is stored as `othersText` plus an `others` entry in
  `categories`; 20g decides how that serialises.
