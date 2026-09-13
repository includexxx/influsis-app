# Current Feature

**Status:** verified — `npx tsc --noEmit` clean; `npm run test` 109 suites / 451
tests green; `npm run lint` 0 errors (2 pre-existing warnings outside this
feature). Bio is **required**, **20–300 chars**, stored as `bio`.

**Branch:** feat/creator-onboarding _(continues the item 20 onboarding-wizard branch)_

## Plan addition (approved)

Added to `blueprint/build-plan.md` as item 21:

```markdown
## Creator bio step

- [ ] 21. **Creator bio onboarding step** - a new step 2 (between Basic
      Information and Location) with a multi-line text field for the creator's
      public bio: 20-300 characters, with a live "N characters left" counter
      under the input. Location..Username shift down one, so the wizard becomes
      ten steps. Bio flows into the Finish payload; no submit endpoint yet.
```

No `project-plan.md` change: §4 already lists `bio` in the creator data model and
§3 notes the retired profile-verification wizard captured a bio — this restores a
field the onboarding rewrite dropped. `/overview` should be re-run after the plan
edit (it is already stale from the interrupted 20h run).

## Goal

Insert a **Bio** step as step 2 of the creator onboarding wizard, between
`BasicInformationStep` (1) and `LocationStep` (now 3). One multi-line text field
for the creator's public bio, hard-capped at **300 characters**, with a live
counter beneath it showing how many characters remain. Every later step shifts
down by one; the wizard goes from 9 to **10 steps**.

## In scope

- `ONBOARDING_TOTAL_STEPS` 9 → 10 and the shell step map
  (`scenes/creator-onboarding/CreatorOnboarding.tsx`), `BioStep` at position 2.
- New `BioStep` scene with the shared header / form / CTA pattern, a `multiline`
  `TextField` (reusing `profileStepStyle.bioInput`), `maxLength={300}`, and a
  "`{300 - length}` characters left" line under the input.
- `bioStepSchema` + `BIO_MAX_LENGTH` in `utils/onboardingSchemas.ts`.
- `bio?: string` draft field + `saveBio` action in
  `slices/creatorOnboarding.slice.ts`.
- `bio` appended to the Finish payload (`utils/onboardingPayload.ts`).
- Renumber `step={N}` props (Location→3 … Username→10), the step-number comments,
  and every hard-coded `"X of 9"` / `advances to step N` / `currentStep).toBe(N)`
  / `returns to step N` / `goToStep(N)` in the onboarding tests.
- `creator-onboarding-requirements.md` §2 table + §3 — add "Screen 2 — Bio",
  renumber the rest, `X of 10`.

## Out of scope

- Wiring bio into `scenes/main/EditProfile.tsx` / `slices/profile.slice.ts`
  (neither references bio today).
- A real onboarding submit endpoint (Finish still `console.log`s).
- Rich-text, formatting, or @mentions in the bio — plain text only.
- A reusable `CharacterCounter` component (one call site; inline `Text`).

## Build loop

`blueprint/config.json`: `workflow.stepReview: "feature"`,
`checkpointCommits: "disabled"`. Build all steps, keep the tree green after each,
present one review packet, then `/complete` makes the single commit. Verify with
`npm run test` + `npx tsc --noEmit` + `npm run lint`. Do **not** run
`npm run format` (repo-wide `prettier --write`); `prettier --check` the feature's
own files instead.

## Build steps

- [x] **1. Schema + slice + payload.**
  - `utils/onboardingSchemas.ts`: `export const BIO_MIN_LENGTH = 20;` and
    `export const BIO_MAX_LENGTH = 300;` and
    `bioStepSchema = z.object({ bio: z.string().trim().min(BIO_MIN_LENGTH, 'Write at least 20 characters').max(BIO_MAX_LENGTH, 'Keep it under 300 characters') })`;
    export `BioStepValues`.
  - `slices/creatorOnboarding.slice.ts`: `ONBOARDING_TOTAL_STEPS = 10`; add
    `bio?: string` to `CreatorOnboardingState` + `initialState`; add
    `saveBio: (state, { payload }: PayloadAction<string>) => { state.bio = payload; }`;
    export it and include it in `useCreatorOnboardingSlice`. Update the
    "nine steps" comment.
  - `utils/onboardingPayload.ts`: `appendText('bio', bio)` alongside the other
    text fields (destructure `bio` from state).
  - Tests: `onboardingSchemas.test.ts` — a `bioStepSchema` block (rejects empty
    / whitespace / under 20 chars, rejects > 300, accepts a 20+ char bio, trims
    before the length check);
    `creatorOnboarding.slice.test.ts` — `saveBio` stores the value, add `bio` to
    the reset/initial-state assertions, bump `ONBOARDING_TOTAL_STEPS`-derived
    expectations, rename "step 9"→"step 10"; `onboardingPayload.test.ts` — add
    `bio` to the full-state fixture and the expected summary.
  - **Done when:** `npm run test` for those files green, `npx tsc --noEmit` clean.

- [x] **2. BioStep scene + shell wiring + renumber sweep.**
  - New `scenes/creator-onboarding/steps/BioStep.tsx` (`step={2}`): `useForm`
    seeded from `slice.bio`, `zodResolver(bioStepSchema)`, `mode: 'onChange'`.
    `ProfileStepHeader` (title e.g. "Tell businesses about you", description e.g.
    "A short intro shown on your public profile and discovery card"). A
    `ControlledTextField` `name="bio"` with `multiline`, `maxLength={BIO_MAX_LENGTH}`,
    `inputStyle={profileStepStyle.bioInput}`, `textAlignVertical="top"`,
    `testID="onboarding-bio"`. Directly below it, a right-aligned
    `<Text testID="onboarding-bio-counter">{`${BIO_MAX_LENGTH - (watch('bio')?.length ?? 0)} characters left`}</Text>`
    in `palette.gray[300]`. `Next` disabled until `isValid` (needs 20+ trimmed
    chars); on submit `dispatch(saveBio(values.bio.trim()))` then
    `saveAndContinue()`. Header `onBack={back}` (step 2 has a Back).
  - `scenes/creator-onboarding/CreatorOnboarding.tsx`: import `BioStep`; map is
    `1: BasicInformationStep, 2: BioStep, 3: LocationStep, 4: ContentCategoriesStep,
5: SubcategoriesStep, 6: LanguagesStep, 7: DeliverablesStep, 8: PhotosStep,
9: PortfolioStep, 10: UsernameStep`; update the "step 1-9" comment.
  - Shift `step={N}` + the "Step N" header comment in `LocationStep` (→3),
    `ContentCategoriesStep` (→4), `SubcategoriesStep` (→5), `LanguagesStep` (→6),
    `DeliverablesStep` (→7), `PhotosStep` (→8), `PortfolioStep` (→9),
    `UsernameStep` (→10). `BasicInformationStep` stays `step={1}`.
  - New `BioStep.test.tsx`: renders "2 of 10"; `Next` disabled empty and with a
    < 20 char bio; a 20+ char bio enables `Next`; counter shows `300 - length`
    and updates on change; a valid submit stores the trimmed bio and advances to
    step 3; Back → step 1.
  - Renumber sweep in the other tests: every `"X of 9"` → `"X of 10"`, every
    `goToStep(N)` seed and `currentStep).toBe(N)` / `advances to step N` /
    `returns to step N` for steps that moved (Location onward: +1), in
    `CreatorOnboarding.test.tsx`, `LocationStep`, `ContentCategoriesStep`,
    `SubcategoriesStep`, `LanguagesStep`, `DeliverablesStep`, `PhotosStep`,
    `PortfolioStep`, `UsernameStep`, `BasicInformationStep` tests.
    `BasicInformationStep` still advances to step 2 (now BioStep) — number
    unchanged, no edit needed there beyond the counter string if present.
  - **Done when:** `npm run test` green (full suite), `npx tsc --noEmit` clean,
    the wizard walks 1→10 with a Bio screen at step 2 and "N of 10" throughout.

- [x] **3. Docs + comment cleanup.**
  - `creator-onboarding-requirements.md`: §2 table gains a "Bio" row at #2,
    everything below shifts, progress text `X of 10`; §3 add "### Screen 2 — Bio"
    and renumber the following screen headers.
  - `data/onboardingOptions.ts` / `data/contentCategories.ts` header comments:
    bump the "(step N)" references.
  - **Done when:** `npm run lint` + `npm run test` green; no stale "nine steps" /
    "of 9" / wrong "step N" text in touched files.

## Files / areas

| Area            | Files                                                                                                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema          | `utils/onboardingSchemas.ts` (+ test)                                                                                                                                                               |
| Slice           | `slices/creatorOnboarding.slice.ts` (+ test)                                                                                                                                                        |
| Shell           | `scenes/creator-onboarding/CreatorOnboarding.tsx` (+ test)                                                                                                                                          |
| New step        | `scenes/creator-onboarding/steps/BioStep.tsx` (+ test)                                                                                                                                              |
| Renumbered      | `steps/LocationStep`, `ContentCategoriesStep`, `SubcategoriesStep`, `LanguagesStep`, `DeliverablesStep`, `PhotosStep`, `PortfolioStep`, `UsernameStep` (+ their tests), `BasicInformationStep.test` |
| Payload         | `utils/onboardingPayload.ts` (+ test)                                                                                                                                                               |
| Reuse (no edit) | `components/elements/TextField` (via `ControlledTextField`), `ProfileStepHeader`, `Button`; `profileStepStyle.bioInput`                                                                             |
| Docs            | `creator-onboarding-requirements.md`, `data/*` comment headers                                                                                                                                      |

## Data / contracts

- **Draft:** `creatorOnboarding.bio?: string` — the trimmed bio string, 20–300
  chars. `undefined` until the step is saved.
- **Schema:** `bioStepSchema` requires a post-trim bio of `BIO_MIN_LENGTH` (20)
  to `BIO_MAX_LENGTH` (300). Counter math uses the raw (untrimmed) length so it
  matches what the user sees while typing; `maxLength={300}` is the hard input
  cap.
- **Step machine:** `currentStep` 1..10, `clampStep` upper bound follows
  `ONBOARDING_TOTAL_STEPS`. `completeOnboarding` marks step 10.
- **Payload:** `buildOnboardingSubmission` adds `bio` via the existing
  `appendText` helper (skipped when empty). Not a backend contract (existing
  disclaimer stands).
- No network calls added.

## Testing

- Unit gate is on. New `BioStep.test.tsx`; schema/slice/payload tests extended;
  renumber sweep must leave the whole suite green (no `.only` / skips).
- No browser harness in this repo — none added. No live/visual evidence claimed.

## Notes for the AI

- `BioStep` re-seeds from `slice.bio` on mount so Back from step 3 restores the
  text (same pattern as every other step).
- Keep the disabled-until-valid `Next`, pink progress bar, `X of N` counter,
  one-line subtext, and header Back-on-every-step-after-1.
- The character counter is plain `<Text>`, right-aligned under the field; no new
  shared component. Announce nothing special for a11y beyond the visible text.
- `ControlledTextField` forwards `multiline` / `maxLength` / `inputStyle` to the
  underlying `TextField` → `TextInput` via `...others`. Confirm `inputStyle`
  reaches the `TextInput` (it does — `TextField` spreads `inputStyle` onto it).

## Decisions (resolved)

- **Required**, `Next` disabled until valid — matches the other mandatory steps.
- **Min 20 / max 300** trimmed characters.
- Stored as **`bio`** (matches `project-plan.md` §4 / overview `Creator.bio`).
