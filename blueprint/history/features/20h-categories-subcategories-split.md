# Current Feature

**Status:** verified

**Branch:** feat/creator-onboarding _(continues the existing item 20 branch; every
20a–20g sub-item shipped on it, so 20h stays on it rather than opening
`feature/…` per `blueprint/config.json`.)_

## Goal

Build-plan item **20h**: split the single Content Categories step (step 3) of the
creator onboarding wizard into two consecutive steps —

- **Step 3 – Categories:** pick one or more content categories only.
- **Step 4 – Subcategories:** for each picked category, choose its subcategories.

Every later step shifts down by one (Languages 4→5, Deliverables 5→6, Photos
6→7, Portfolio 7→8, Username 8→9) and the wizard becomes **9 steps** total. The
"Others" category keeps its free-text write-in, now surfaced on both screens: the
custom **category** name on step 3 and the custom **subcategory** name on step 4.

## In scope

- `ONBOARDING_TOTAL_STEPS` 8 → 9 and the shell step map
  (`scenes/creator-onboarding/CreatorOnboarding.tsx`).
- New `SubcategoriesStep` scene at position 4.
- Trim `ContentCategoriesStep` to category selection only (drop the inline
  subcategory accordion body).
- Split `contentCategoriesSchema` into a categories schema and a subcategories
  schema; rename the draft's `othersText` → `categoryOthersText` and add
  `subcategoryOthersText`.
- Split `saveContentCategories` into `saveCategories` (step 3) and
  `saveSubcategories` (step 4) in `slices/creatorOnboarding.slice.ts`.
- Thread the two Others texts through `utils/onboardingPayload.ts`.
- Renumber `step={N}` props and every hard-coded `"X of 8"` / `advances to step
N` / `currentStep).toBe(N)` expectation in the onboarding tests.
- Update `creator-onboarding-requirements.md` §2 / §3 to the 9-screen split and
  the step-number comments in the step/data files.

## Out of scope

- Any change to steps 1–2 or 5–9 beyond their step number and progress counter.
- A real onboarding submit endpoint (still `console.log` at Finish — later item).
- Backend/matching semantics for subcategories (soft-boost ranking is a backend
  concern per requirements §3).
- An "Other" write-in under _every_ category (see Open questions).
- Reworking `ContentCategoryAccordion` beyond reusing it for the per-category
  subcategory checklist on step 4.

## Build loop

`blueprint/config.json`: `workflow.stepReview: "feature"`,
`checkpointCommits: "disabled"`. Implement all build steps, keeping the project
green after each, then present **one** review packet. No per-step commits;
`/complete` writes the single feature commit. Verify with `npm run test` +
`npx tsc --noEmit` + `npm run lint`.

> `npm run format` is repo-wide `prettier --write "**/*.{ts,tsx,md}"` — running
> it rewrites ~70 unrelated files that were never prettier-clean on `HEAD`. CI
> runs it but discards the result, so it is **not** an enforced gate. Only
> `prettier --check` the feature's own files instead (done; all clean).

## Build steps

**Status: verified.** `npx tsc --noEmit` clean; `npm run test` 108 suites / 441
tests green; `npm run lint` 0 errors (2 pre-existing warnings, both outside this
feature). Deviations from the spec are noted per step.

- [x] **1. Schema + slice + shell + new Subcategories step, with the renumber sweep.**
  - `utils/onboardingSchemas.ts`: replace `contentCategoriesSchema` with
    `categoriesStepSchema` (`categories: {value,subcategories[]}[]` min 1;
    `categoryOthersText?` trimmed, `≤ OTHERS_TEXT_MAX_LENGTH`, required only when
    an entry's `value === OTHERS_CATEGORY_VALUE`) and `subcategoriesStepSchema`
    (every non-`others` entry needs `subcategories.length >= 1`;
    `subcategoryOthersText?` same rules, required only when the `others` entry is
    present). Export `CategoriesStepValues` / `SubcategoriesStepValues`.
  - `slices/creatorOnboarding.slice.ts`: `ONBOARDING_TOTAL_STEPS = 9`; change the
    `contentCategories` draft shape to
    `{ categories: {value,subcategories[]}[]; categoryOthersText?: string; subcategoryOthersText?: string }`;
    replace `saveContentCategories` with `saveCategories` (writes `categories` +
    `categoryOthersText`, preserving each surviving entry's `subcategories`) and
    `saveSubcategories` (writes the per-entry `subcategories` + `subcategoryOthersText`).
  - `scenes/creator-onboarding/CreatorOnboarding.tsx`: `STEP_COMPONENTS` map of 9
    — `3: ContentCategoriesStep`, `4: SubcategoriesStep`, then Languages 5,
    Deliverables 6, Photos 7, Portfolio 8, Username 9.
  - Shift `step={N}` in `LanguagesStep` (→5), `DeliverablesStep` (→6),
    `PhotosStep` (→7), `PortfolioStep` (→8), `UsernameStep` (→9). Steps 1–3 keep
    their numbers.
  - New `scenes/creator-onboarding/steps/SubcategoriesStep.tsx` (`step={4}`): own
    `useForm` seeded from `contentCategories`. For each selected category in
    selection order — real category → `ContentCategoryAccordion` (or a lighter
    checklist) over `getSubcategories(value)`, `others` entry → a single
    `ControlledTextField` "Please specify" bound to `subcategoryOthersText`.
    `Next` disabled until `subcategoriesStepSchema` passes; on submit dispatch
    `saveSubcategories` then `saveAndContinue()`. Back → step 3. If
    `categories` is empty (shouldn't happen — step 3 gates ≥1), render a
    "Go back and pick a category" message with the header Back and `Next`
    disabled. Header title/description e.g. "Which subcategories fit?" /
    "Pick at least one under each category you chose".
  - `utils/onboardingPayload.ts`: read the renamed fields; for the `others`
    entry contribute `categoryOthersText` as its label and
    `subcategoryOthersText` (fallback `categoryOthersText`) as its lone
    subcategory in both `formData` and `summary`. Keep the "not a backend
    contract" comment.
  - Tests: rewrite `utils/onboardingSchemas.test.ts` category cases for the two
    new schemas; update `slices/creatorOnboarding.slice.test.ts` and
    `utils/onboardingPayload.test.ts` for the new action names / field names /
    step-9 constant; add `SubcategoriesStep.test.tsx`; sweep every remaining
    `"X of 8"` → `"X of 9"` and every shifted `advances to step N` /
    `currentStep).toBe(N)` / `returns to step N` in `CreatorOnboarding.test.tsx`
    and the `LanguagesStep` / `DeliverablesStep` / `PhotosStep` / `PortfolioStep`
    / `UsernameStep` / `BasicInformationStep` / `LocationStep` tests.
  - **Done when:** `npm run test` green; `npx tsc --noEmit` clean; the wizard
    walks 1→9 with a "step 4 – Subcategories" screen and the progress bar reads
    "N of 9". ✅
  - **Deviation:** `SubcategoriesStep` uses a plain `SelectableRow` checklist per
    category (not `ContentCategoryAccordion`). The accordion was purpose-built
    for the combined 20c step and its select-checkbox is meaningless once every
    category is already chosen, so it plus its test were **deleted**
    (`components/elements/ContentCategoryAccordion/`). Reviewer may prefer
    collapsible groups if the screen feels long with many categories.
  - Folded into this step (not a separate one): the `ContentCategoriesStep` trim
    and the doc/comment cleanup — the slice action rename forces all three
    together to keep the tree compiling under `stepReview: feature`.

- [x] **2. Trim the Categories step to selection only.**
  - Rewrite `scenes/creator-onboarding/steps/ContentCategoriesStep.tsx`: a plain
    multi-select checkbox list of `CONTENT_CATEGORY_OPTIONS` (no accordion, no
    subcategory body, no `expanded` state). Selecting `OTHERS_CATEGORY_VALUE`
    reveals the "Please specify" `ControlledTextField` bound to
    `categoryOthersText`. `Next` disabled until `categoriesStepSchema` passes; on
    submit dispatch `saveCategories` (keep each still-selected entry's existing
    `subcategories` so Back from step 4 doesn't lose picks) then
    `saveAndContinue()`. Keep `step={3}`, `totalSteps` from the hook.
  - Deselecting a category still drops its entry (and thus its subcategories) —
    requirements §3 "deselecting a category auto-clears its subcategory
    selections".
  - Update `ContentCategoriesStep.test.tsx`: assert `"3 of 9"`, category
    selection gates `Next`, no subcategory testIDs, Others text gates `Next`,
    a valid submit stores `{ categories: [{ value, subcategories: [] }], categoryOthersText: '' }`
    and advances to step 4, Back → step 2.
  - **Done when:** `npm run test` green; step 3 shows only category checkboxes +
    the Others field; step 4 now receives empty `subcategories` and collects them.

- [x] **3. Docs and comment cleanup.**
  - `creator-onboarding-requirements.md`: §2 table → 9 rows (Content Category
    split into "Content Category" and "Subcategories"), progress text `X of 9`,
    §3 add a "Screen 4 — Subcategories" heading and renumber the rest.
  - Fix step-number comments: `ContentCategoriesStep` header comment,
    `SubcategoriesStep`, `LanguagesStep` ("Step 5"), `DeliverablesStep`
    ("Step 6"), `PhotosStep`, `PortfolioStep`, `UsernameStep`, plus
    `data/onboardingOptions.ts` and `data/contentCategories.ts` header comments
    and the `ONBOARDING_TOTAL_STEPS` comment in the slice.
  - **Done when:** `npm run lint` and `npm run test` green; no stale "step 4 =
    Languages" / "eight steps" text remains.

## Files / areas

| Area                 | Files                                                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema               | `utils/onboardingSchemas.ts`, `utils/onboardingSchemas.test.ts`                                                                                                                        |
| Slice                | `slices/creatorOnboarding.slice.ts`, `slices/creatorOnboarding.slice.test.ts`                                                                                                          |
| Shell / hook         | `scenes/creator-onboarding/CreatorOnboarding.tsx`, `CreatorOnboarding.test.tsx` (hook needs no change — reads `ONBOARDING_TOTAL_STEPS`)                                                |
| Step 3               | `scenes/creator-onboarding/steps/ContentCategoriesStep.tsx` (+ test)                                                                                                                   |
| Step 4 (new)         | `scenes/creator-onboarding/steps/SubcategoriesStep.tsx` (+ test)                                                                                                                       |
| Renumbered steps     | `steps/LanguagesStep.tsx`, `DeliverablesStep.tsx`, `PhotosStep.tsx`, `PortfolioStep.tsx`, `UsernameStep.tsx` (+ their tests), `BasicInformationStep.test.tsx`, `LocationStep.test.tsx` |
| Payload              | `utils/onboardingPayload.ts`, `utils/onboardingPayload.test.ts`                                                                                                                        |
| Reuse (no edit)      | `components/elements/ContentCategoryAccordion`, `ProfileStepHeader`, `ControlledTextField`, `Checkbox`, `Button`                                                                       |
| Data (comments only) | `data/contentCategories.ts`, `data/onboardingOptions.ts`                                                                                                                               |
| Docs                 | `creator-onboarding-requirements.md`                                                                                                                                                   |

## Data / contracts

- **Draft (`creatorOnboarding` slice, `contentCategories`):**

  ```ts
  {
    categories: { value: string; subcategories: string[] }[]; // selection order, not sorted
    categoryOthersText?: string;    // custom category name; required iff an entry.value === 'others'
    subcategoryOthersText?: string; // custom subcategory name; required iff the 'others' entry is present
  }
  ```

  `OTHERS_TEXT_MAX_LENGTH` (60) and `.trim()` apply to both texts, matching the
  existing Languages/Deliverables Others handling.

- **Step machine:** `currentStep` 1..9, `clampStep` upper bound follows
  `ONBOARDING_TOTAL_STEPS`. `completeOnboarding` still marks
  `ONBOARDING_TOTAL_STEPS` (now 9) complete.
- **Submission payload (`buildOnboardingSubmission`):** not a backend contract
  (keep the existing disclaimer). `categories` JSON keeps `{value,subcategories}`
  entries; the `others` entry's `value`/subcategory are replaced with the
  write-in texts. `summary.categories` maps to display labels.
- **No network calls added.** The only real request in the flow stays the
  step-9 handle-availability check.

## Testing

- Unit gate is on (`npm run test`, jest-expo + RNTL). Every changed scene/slice/
  schema/util keeps or gains co-located coverage.
- New `SubcategoriesStep.test.tsx`: renders `"4 of 9"`; shows a subcategory
  checklist for each category chosen on step 3; `Next` disabled until each real
  category has ≥1 subcategory; the `others` category shows the specify field and
  gates `Next` on it; a valid submit stores `subcategories` / `subcategoryOthersText`
  and advances to step 5; Back → step 3.
- Renumber sweep must leave the whole suite green — no skipped/`.only` tests.
- No browser-test harness in this repo; none added. No live/visual evidence
  claimed.

## Notes for the AI

- Each step "owns its own react-hook-form seeded from the saved draft" — keep
  that: `SubcategoriesStep` re-seeds from `contentCategories` on mount so a
  step-3 category change is reflected when the user returns.
- `SubcategoriesStep` should iterate `contentCategories.categories`, not the full
  `CONTENT_CATEGORY_OPTIONS` list — only chosen categories get a subcategory
  list. Use `CONTENT_CATEGORY_OPTIONS`/`getSubcategories` for labels/options.
- Preserve the disabled-until-valid `Next`, pink progress bar, `X of N` counter,
  one-line subtext, header Back-on-every-step-after-1 pattern (requirements §5).
- Free-text is rendered only inside RN `<Text>` / `TextField` — no HTML sink —
  but still route validation errors through the existing `error` props so the
  message is associated with the field (as `ContentCategoryAccordion` /
  `ControlledTextField` already do).
- Keep `PlaceholderStep` as the `?? PlaceholderStep` fallback only; all 9 slots
  are real.
- Don't renumber build-plan 20a–20g or rename shipped files beyond the one new
  `SubcategoriesStep`.

## Open questions

1. **"Other" on the subcategory screen.** The spec surfaces the write-in only
   for the dedicated **"Others" category** (faithful to requirements §3, which
   has a single "Others" row). Item 20h's wording ("Categories and Subcategories
   screen have other option") could instead mean an "Other" write-in under
   _every_ selected category. Confirm the narrower reading is what you want.
2. **One Others text or two.** Spec keeps two inputs (`categoryOthersText` on
   step 3, `subcategoryOthersText` on step 4). If the custom category and its
   custom subcategory should always be the same string, say so and step 4 drops
   its input.
3. **Requirements doc.** Spec updates `creator-onboarding-requirements.md` to the
   9-screen flow. Confirm that manual source doc should track this change.
