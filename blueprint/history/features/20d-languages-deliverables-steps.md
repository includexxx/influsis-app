# Feature: Languages + deliverables steps (20d)

**From build-plan:** feature 20d (fourth leaf of item 20, "Creator onboarding
wizard"). Archived 2026-09-10.

**Branch:** `feat/creator-onboarding` (the umbrella branch for all of item 20,
as used for 20a-20c; not merged per sub-item - one squash-merge when the wizard
is done. Supersedes the derived `feature/languages-deliverables-steps`.)

**Status:** verified - `tsc --noEmit`, `expo lint`, and `npm run test`
(98 suites / 370 tests, 20 new) pass. Committed on `feat/creator-onboarding`.

> **Note for later specs:** the "Run `npm run format`" line below is wrong -
> that script is a repo-wide `prettier --write "**/*.{ts,tsx,md}"` and rewrote
> ~52 unrelated files (including the user-owned planning docs, which drifted the
> overview `source-hash`). Those were reverted; only the 20d files were kept.
> Use `npx prettier --write <touched files>` instead.
>
> Continues the item-20 branch (20a-20c are committed here, unmerged). Config's
> `featureBranchPrefix` is `feature/`, but every item-20 sub-feature shares
> `feat/creator-onboarding`; the whole wizard squash-merges once 20g lands.

## Goal

Build **Steps 4 and 5 of the creator onboarding wizard - Languages and
Deliverables** (build-plan 20d, `creator-onboarding-requirements.md` §3 Screens 4
and 5). Both are the same multi-select control over different fixed option sets,
each requiring at least one selection before `Next` enables:

- **Step 4 - Languages:** English, Spanish, French, Russian, Hindi, Others.
  "Others" reveals a free-text "add a language" input; its trimmed value is
  stored alongside the preset picks.
- **Step 5 - Deliverables:** Photo Post, Reel, Video, Story, Blog, Live. No
  "Others", no free text.

They follow the wizard pattern proven by 20a-20c: one scene component per step in
`scenes/creator-onboarding/steps/`, each owning its own react-hook-form seeded
from the saved Redux draft, `ProfileStepHeader` + full-width pink `Next` disabled
until the step's zod schema passes. No network call. No new route.

## Design reference

Visual pattern is inherited, not pixel-replicated: pink progress track, `4 of 8`
/ `5 of 8` counter, 26px title, grey one-line subtext, full-width pink CTA - all
from `ProfileStepHeader` and `buttonStyle.primary`, exactly as the first three
steps use them. `creator-onboarding-requirements.md` §3 Screens 4-5 are the
behavioural source. No Figma node is specified. The retired
profile-verification screens had flag icons
(`assets/images/profile-verification/flag-*.png`) on the language rows; both
steps here stay icon-free so the one shared control looks identical - a later
polish pass can add icons if the design calls for it.

## In scope

- `data/onboardingOptions.ts` (new) - `LANGUAGE_OPTIONS`, `DELIVERABLE_OPTIONS`
  (`{ value; label }[]`) and `OTHER_OPTION_VALUE = 'others'`, with stable
  kebab-case-or-lowercase values.
- `utils/onboardingSchemas.ts` - a `multiSelectSchema` factory plus
  `languagesSchema`, `deliverablesSchema`, and a shared `MultiSelectValues`
  type (`{ selected: string[]; othersText?: string }`). Languages enforces:
  > = 1 selection; if `others` is selected, a non-empty trimmed `othersText`
  > within `OTHERS_TEXT_MAX_LENGTH`. Deliverables enforces only >= 1 selection.
- `creatorOnboarding` slice: `languages?` and `deliverables?` draft fields and
  `saveLanguages` / `saveDeliverables` actions, mirroring `saveContentCategories`.
- `SelectableRow` element component: a bordered pressable row (label + trailing
  checkbox, pink border/tint when selected), `accessibilityRole="checkbox"`.
- `LanguagesStep` (step 4) and `DeliverablesStep` (step 5) scenes wired into
  `CreatorOnboarding`, each with the row list, `Next` gated on
  `formState.isValid`, save-and-advance, and header Back. Languages also renders
  the conditional "Others" free-text field.
- Remove steps 4 and 5 from `PlaceholderStep`'s `STEP_META`.
- Unit tests: data module, both schemas, both slice actions, `SelectableRow`,
  and both steps (RNTL, mirroring `ContentCategoriesStep.test.tsx`).

## Out of scope

- Steps 20e-20g (photos, portfolio, username, Finish) and the `FormData` payload
  assembly - `languages` / `deliverables` are only persisted to the draft here.
  The "Others language becomes a stored value" transformation for the wire
  payload is 20g's concern; this step stores `selected` + `othersText`.
- Any backend call; surfacing these fields in `scenes/main/EditProfile.tsx`.
- Deliverable "Others" or per-deliverable rate range (requirements §5 explicitly
  excludes the rate range and lists no Others).
- Cleaning up the now-orphaned `components/elements/SelectableListItem` and
  `hooks/useDebouncedOtherOption` (leftovers from the retired
  profile-verification multi-selects; `useDebouncedOtherOption` commits to Redux
  per keystroke, which is the wrong architecture for the RHF-per-step wizard, so
  it is not reused). A later cleanup pass can remove them.
- Refactoring `ContentCategoryAccordion`'s inline subcategory row to share
  `SelectableRow` - noted for later, not done here.

## Build loop

`workflow.stepReview` is `feature` and `checkpointCommits` is `disabled`:
implement all build steps in one pass without per-step approval pauses or
checkpoint commits. After the last step, present one review packet. `/complete`
makes the single feature commit on `feat/creator-onboarding` (still not merged -
item 20 keeps stacking until 20g). Run `npm run test`, `npm run lint`, and
`npx tsc --noEmit` before the review packet.

## Build steps

- [x] **1. Data module + schemas + slice.**
  - `data/onboardingOptions.ts`:

    ```text
    OTHER_OPTION_VALUE = 'others'
    LANGUAGE_OPTIONS = [
      english, spanish, french, russian, hindi,   // value === lowercase label
      { value: OTHER_OPTION_VALUE, label: 'Others' },
    ]
    DELIVERABLE_OPTIONS = [
      { value: 'photo-post', label: 'Photo Post' },
      { value: 'reel', label: 'Reel' },
      { value: 'video', label: 'Video' },
      { value: 'story', label: 'Story' },
      { value: 'blog', label: 'Blog' },
      { value: 'live', label: 'Live' },
    ]
    ```

    Values written literally, not computed.

  - `utils/onboardingSchemas.ts`: add

    ```text
    export type MultiSelectValues = { selected: string[]; othersText?: string };

    multiSelectSchema({ noun, withOther }) => z.object({
      selected: z.array(z.string()).min(1, `Select at least one ${noun}`),
      othersText: z.string().trim().max(OTHERS_TEXT_MAX_LENGTH).optional(),
    }).superRefine((v, ctx) => {
      if (withOther && v.selected.includes(OTHER_OPTION_VALUE)
          && !v.othersText?.trim()) {
        ctx.addIssue({ code: custom, path: ['othersText'],
                       message: 'Add the language you speak' });
      }
    })

    export const languagesSchema = multiSelectSchema({ noun: 'language', withOther: true });
    export const deliverablesSchema = multiSelectSchema({ noun: 'deliverable', withOther: false });
    ```

    Import `OTHER_OPTION_VALUE` from `@/data/onboardingOptions`. Reuse the
    existing `OTHERS_TEXT_MAX_LENGTH`.

  - `slices/creatorOnboarding.slice.ts`: add `languages?: MultiSelectValues` and
    `deliverables?: MultiSelectValues` to state + `initialState`,
    `saveLanguages` / `saveDeliverables` reducers, export both, add them to the
    destructured `slice.actions` export, update the state comment.
  - Tests: `data/onboardingOptions.test.ts` (option counts; `Others` is last in
    `LANGUAGE_OPTIONS` and absent from `DELIVERABLE_OPTIONS`; spot-check
    `photo-post`). Extend `utils/onboardingSchemas.test.ts` (empty selection
    fails both; a single preset pick passes both; `others` selected with blank
    text fails languages on the `othersText` path; `others` + text passes;
    `deliverables` ignores `othersText`). Extend
    `slices/creatorOnboarding.slice.test.ts` (`saveLanguages` /
    `saveDeliverables` store; `reset` clears; initial state has both
    `undefined`).
  - **Done when:** `npm run test` passes for the new/changed data, schema, and
    slice specs and `npx tsc --noEmit` is clean; no UI change yet.

- [x] **2. `SelectableRow` component.**
  - `components/elements/SelectableRow/` (`.tsx`, `.test.tsx`, `index.ts`),
    following the folder/style/`useTheme` conventions of `ContentCategoryAccordion`
    and `SelectableListItem`.
  - Props: `label`, `selected`, `onPress`, `style?`, `testID?`.
  - A `Pressable` with `accessibilityRole="checkbox"` and
    `accessibilityState={{ checked: selected }}`: the label plus a trailing
    reused `Checkbox` (`checked={selected}`, `pointerEvents="none"` - the row
    owns the press). Border/background: `palette.primary[400]` tint when
    selected, `palette.gray[100]` border otherwise, matching
    `SelectableListItem`'s selected treatment.
  - **Done when:** the component test passes - renders the label, reflects
    `selected` in `accessibilityState.checked`, and calls `onPress` once per tap.

- [x] **3. Languages + Deliverables steps + wizard wiring.**
  - `scenes/creator-onboarding/steps/LanguagesStep.tsx`: `useForm<MultiSelectValues>`
    with `zodResolver(languagesSchema)`, `mode: 'onChange'`, `defaultValues:
languages ?? { selected: [], othersText: '' }`. Render `LANGUAGE_OPTIONS` as
    `SelectableRow`s driven by `watch('selected')` + `setValue(..., {
shouldValidate: true })` (toggle add/remove). When `selected` includes
    `OTHER_OPTION_VALUE`, render a `ControlledTextField` `name="othersText"`
    (`placeholder="Add a language"`, `maxLength={OTHERS_TEXT_MAX_LENGTH}`,
    `autoCapitalize="words"`, `testID="onboarding-language-other-text"`) directly
    below the Others row; deselecting Others clears `othersText` via
    `setValue('othersText', '', { shouldValidate: true })`. Header: `step={4}`,
    title "What languages are you fluent in?", description "Businesses match
    creators by the languages they speak" (from the current `PlaceholderStep`
    meta), `onBack={back}`. `onSubmit`: `dispatch(saveLanguages(values))` then
    `saveAndContinue()`. Layout matches `ContentCategoriesStep` (ScrollView +
    fixed bottom `Next`, `testID="onboarding-next"`,
    `profileStepStyle.optionList` gap for the row list).
  - `scenes/creator-onboarding/steps/DeliverablesStep.tsx`: same shape with
    `deliverablesSchema`, `deliverables` draft, `saveDeliverables`,
    `DELIVERABLE_OPTIONS`, no Others field, `step={5}`, title "What can you
    deliver?", description "Choose the content types you offer for campaigns".
  - `scenes/creator-onboarding/CreatorOnboarding.tsx`: add `4: LanguagesStep`
    and `5: DeliverablesStep` to `STEP_COMPONENTS`; update the "Steps 6-8 are
    placeholders" comment.
  - `scenes/creator-onboarding/steps/PlaceholderStep.tsx`: delete the `4:` and
    `5:` entries from `STEP_META`; update the `20d-20g` comment to `20e-20g`.
  - `LanguagesStep.test.tsx` and `DeliverablesStep.test.tsx` mirroring
    `ContentCategoriesStep.test.tsx`: renders the right `N of 8` and `Next`
    starts disabled; selecting one option enables `Next`; deselecting the last
    option re-disables it; (languages) selecting Others reveals the text field
    and keeps `Next` disabled until text is entered, and deselecting Others
    clears the text; a valid submit stores the draft and advances to the next
    step; header Back returns to the previous step.
  - **Done when:** `npm run test`, `npm run lint`, and `npx tsc --noEmit` pass,
    and the wizard runs Basics -> Location -> Content Categories -> **Languages**
    -> **Deliverables** -> (placeholder) step 6, with Back restoring each saved
    answer.

## Files / areas

- `data/onboardingOptions.ts` (new), `data/onboardingOptions.test.ts` (new)
- `utils/onboardingSchemas.ts`, `utils/onboardingSchemas.test.ts`
- `slices/creatorOnboarding.slice.ts`, `slices/creatorOnboarding.slice.test.ts`
- `components/elements/SelectableRow/` (new: `.tsx`, `.test.tsx`, `index.ts`)
- `scenes/creator-onboarding/steps/LanguagesStep.tsx` (new) + test,
  `DeliverablesStep.tsx` (new) + test
- `scenes/creator-onboarding/CreatorOnboarding.tsx`,
  `scenes/creator-onboarding/steps/PlaceholderStep.tsx`
- Reuse only: `ProfileStepHeader`, `Checkbox`, `ControlledTextField`, `Button`,
  `layoutStyle`, `buttonStyle`, `profileStepStyle`, `useCreatorOnboardingStep`

## Data / contracts

- **No API contract.** No backend endpoint consumes this yet.
- **Draft shape** (`creatorOnboarding.languages`, `creatorOnboarding.deliverables`):
  `{ selected: string[]; othersText?: string }` (`MultiSelectValues`). `selected`
  holds `LANGUAGE_OPTIONS` / `DELIVERABLE_OPTIONS` values, including
  `'others'` for languages. In-memory only, no stored data or external
  compatibility today; safe to revise in 20g when the payload shape is set.
- **Option values** (stable, literal):
  - Languages: `english`, `spanish`, `french`, `russian`, `hindi`, `others`.
  - Deliverables: `photo-post`, `reel`, `video`, `story`, `blog`, `live`.
- **`OTHERS_TEXT_MAX_LENGTH`** (existing, 60) caps the trimmed `othersText`.
- Stored order of `selected` is selection order, not option order - not sorted.

## Testing

`npm run test` (Jest + `jest-expo` + RNTL) is the gate. Add:

- **Data:** `LANGUAGE_OPTIONS` has 6 entries ending in `others`;
  `DELIVERABLE_OPTIONS` has 6 and contains no `others`; spot-check `photo-post`.
- **Schema:** empty `selected` fails both; one preset pick passes both;
  languages with `others` selected and blank/whitespace `othersText` fails on
  the `othersText` path; languages with `others` + text passes; deliverables
  passes regardless of `othersText`; over-long `othersText` fails languages.
- **Slice:** `saveLanguages` / `saveDeliverables` store; `reset` clears both;
  initial state has both `undefined`.
- **Component:** `SelectableRow` label render, `checked` state, one `onPress`
  per tap.
- **Steps:** the `ContentCategoriesStep.test.tsx`-style scenarios in build
  step 3 (no bottom-sheet mocks needed - rows are plain `Pressable`s).

No browser test (no `Browser tests` command). No live/visual evidence claimed.

## Notes for the AI

- Match `ContentCategoriesStep.tsx` structure: `<>` fragment wrapping a
  `ScrollView` (`layoutStyle.screen` / `layoutStyle.scrollContent`) then a fixed
  `<View style={layoutStyle.scrollContent}>` holding the `Next` `Button` with
  `testID="onboarding-next"`.
- Each step owns its own RHF form seeded from the slice draft; persist only on
  submit (dispatch the save action then `saveAndContinue()`), exactly as steps
  1-3 do. Do not sync form -> slice on every change and do not use
  `useDebouncedOtherOption`.
- Toggle helper: `selected.includes(v) ? selected.filter(x => x !== v) :
[...selected, v]`, then `setValue('selected', next, { shouldValidate: true })`.
- The two steps are deliberately near-duplicates. A shared inner component is
  optional; if extracted, keep it local to `scenes/creator-onboarding/steps/`
  and still give each step its own schema, draft field, header copy, and test.
- User-entered `othersText` renders only inside a `TextField` (RN `Text`
  escapes it); trim before store, cap at `OTHERS_TEXT_MAX_LENGTH`.
- `useForm` `isValid` starts `false` before the first change, same as
  `LocationStep` / `ContentCategoriesStep` rely on - the initial `Next` disabled
  assertion works without a mount-time validation.
- Run `npm run format` before finishing; CI runs `format` -> `lint` -> `test`.

## Open questions

None blocking.
