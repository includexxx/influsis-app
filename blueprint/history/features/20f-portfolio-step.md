# Feature: Portfolio step (20f)

**From build-plan:** feature 20f (sixth leaf of item 20, "Creator onboarding
wizard"). Archived 2026-09-10.

**Branch:** `feat/creator-onboarding` (the umbrella branch for all of item 20,
as used for 20a-20e; not merged per sub-item - one squash-merge when the wizard
is done. Supersedes the derived `feature/portfolio-step`.)

**Status:** verified - `tsc --noEmit`, `expo lint`, and `npm run test`
(102 suites / 404 tests, 22 new) pass. Committed on `feat/creator-onboarding`.

> Continues the item-20 branch (20a-20e are committed here, unmerged). Config's
> `featureBranchPrefix` is `feature/`, but every item-20 sub-feature shares
> `feat/creator-onboarding`; the whole wizard squash-merges once 20g lands.

## Goal

Build **Step 7 of the creator onboarding wizard - Portfolio** (build-plan 20f,
`creator-onboarding-requirements.md` §3 Screen "Portfolio"). A repeatable list of
entry cards, each with a **content link**, a **platform tag** (auto-detected
from the URL, manually overridable to Instagram / YouTube / TikTok / Others),
and an optional **thumbnail** image (manual upload - there is no backend
auto-fetch, so the manual path is the only path today). `+ Add Another` appends
a card; each card has a delete control. A malformed link shows an inline error;
a duplicate link shows a non-blocking warning; continuing with zero entries
shows a soft nudge but is **never blocked**. `Next` is enabled when the list is
empty or every entry has a valid link. No network call. No new route.

## Design reference

Visual pattern is inherited: pink progress track, `7 of 8` counter, 26px title,
grey subtext, full-width pink CTA - from `ProfileStepHeader` and
`buttonStyle.primary`, as steps 1-6 use them. Reuse `AddItemButton` for
`+ Add Another` (Figma "Frame 260" ghost add link), `ImageUploader` for the
thumbnail, `CategoryChip` for the platform picker, `TextField` for the link.
No Figma node is specified for this onboarding screen; do not invent one.

## In scope

- `data/portfolioPlatforms.ts` (new):
  - `PORTFOLIO_PLATFORM_VALUES = ['instagram', 'youtube', 'tiktok', 'others']`,
    `PortfolioPlatform` type, `PORTFOLIO_PLATFORM_OPTIONS` (`{ value; label }[]`).
  - `detectPlatform(url: string): PortfolioPlatform` - lowercase host match
    (`instagram.` / `youtube.` | `youtu.be` / `tiktok.`), else `'others'`.
  - `isLikelyPortfolioUrl(value: string): boolean` - the shared link check.
  - `normalizePortfolioUrl(value: string): string` - for duplicate comparison.
- `utils/onboardingSchemas.ts`: `portfolioEntrySchema`
  (`{ id: string; url: <isLikelyPortfolioUrl or message "This link doesn't look
valid">; platform: enum(PORTFOLIO_PLATFORM_VALUES); thumbnail:
pickedImageSchema.optional() }`), `portfolioFormSchema =
z.object({ entries: z.array(portfolioEntrySchema) })` (empty array is valid),
  and `PortfolioEntry` + `PortfolioFormValues` types.
- `creatorOnboarding` slice: `portfolio?: PortfolioEntry[]` draft field + a
  `savePortfolio` action taking `PortfolioEntry[]`.
- `PortfolioEntryCard` element component: link `TextField` (with inline error
  and a separate duplicate-warning line), a `CategoryChip` row for the four
  platforms, an `ImageUploader` thumbnail, and a delete control
  (`@expo/vector-icons` Feather `trash-2`, as `FileUploadItem` uses Feather).
- `PortfolioStep` (step 7) scene: `useFieldArray` list of `PortfolioEntryCard`s,
  `AddItemButton` "+ Add Another", the zero-entry nudge text, `Next` gated on
  `formState.isValid`, save-and-advance, header Back. Wired into
  `CreatorOnboarding` as step 7.
- Remove step 7 from `PlaceholderStep`'s `STEP_META`.
- Unit tests: data helpers, schema, slice action, `PortfolioEntryCard`, and the
  step (RNTL, `expo-image-picker` mocked as in `ImageUploader.test.tsx`).

## Out of scope

- Step 20g (username + `Finish` + `FormData` assembly) - the entries are only
  persisted to the draft here; 20g reads `portfolio` for the payload.
- **Backend thumbnail auto-fetch / link preview / oEmbed** - there is no backend
  and no scraping service; the build-plan line's "when auto-fetch is
  unavailable" is the current reality, so only the manual `ImageUploader` path
  exists. A "generic platform icon" fallback for a failed fetch is not built
  because nothing fetches.
- Camera capture, multi-image per entry, per-entry reordering, a hard maximum
  entry count, remote upload.
- URL reachability / HTTP validation - the link check is a client-side format
  check only.
- Surfacing portfolio in `scenes/main/EditProfile.tsx` or the public profile.

## Build loop

`workflow.stepReview` is `feature` and `checkpointCommits` is `disabled`:
implement all build steps in one pass, no per-step approval pauses or checkpoint
commits. After the last step, present one review packet. `/complete` makes the
single feature commit on `feat/creator-onboarding` (not merged - item 20 keeps
stacking until 20g). Run `npx tsc --noEmit`, `npm run lint`, and `npm run test`
before the review packet. **Do not run `npm run format`** (repo-wide
`prettier --write`); use `npx prettier --write` on the touched files only.

## Build steps

- [x] **1. Data helpers + schema + slice.**
  - `data/portfolioPlatforms.ts`:

    ```text
    PORTFOLIO_PLATFORM_VALUES = ['instagram', 'youtube', 'tiktok', 'others']
    PORTFOLIO_PLATFORM_OPTIONS = [
      { value: 'instagram', label: 'Instagram' },
      { value: 'youtube',   label: 'YouTube' },
      { value: 'tiktok',    label: 'TikTok' },
      { value: 'others',    label: 'Others' },
    ]

    isLikelyPortfolioUrl(v):
      /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i.test(v.trim())

    normalizePortfolioUrl(v):
      v.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '')

    detectPlatform(v):
      s = v.toLowerCase()
      s includes 'instagram.'            -> 'instagram'
      s includes 'youtube.' or 'youtu.be'-> 'youtube'
      s includes 'tiktok.'               -> 'tiktok'
      else                               -> 'others'
    ```

    Values written literally.

  - `utils/onboardingSchemas.ts`: add

    ```text
    portfolioEntrySchema = z.object({
      id: z.string(),
      url: z.string().refine(isLikelyPortfolioUrl, "This link doesn't look valid"),
      platform: z.enum(PORTFOLIO_PLATFORM_VALUES),
      thumbnail: pickedImageSchema.optional(),
    })
    portfolioFormSchema = z.object({ entries: z.array(portfolioEntrySchema) })

    export type PortfolioEntry = z.infer<typeof portfolioEntrySchema>;
    export type PortfolioFormValues = z.infer<typeof portfolioFormSchema>;
    ```

    Import the three helpers from `@/data/portfolioPlatforms`. Reuse
    `pickedImageSchema`.

  - `slices/creatorOnboarding.slice.ts`: add `portfolio?: PortfolioEntry[]` to
    state + `initialState`; add a `savePortfolio` reducer taking
    `PayloadAction<PortfolioEntry[]>` (`state.portfolio = payload`); export it
    and add it to the destructured `slice.actions` export; update the state
    comment (`20g adds \`handle\``).
  - Tests: `data/portfolioPlatforms.test.ts` (`detectPlatform` for an
    Instagram / YouTube / `youtu.be` / TikTok / unknown URL; `isLikelyPortfolioUrl`
    accepts `instagram.com/p/x`, `https://youtu.be/x`, rejects `not a link` and
    `''`; `normalizePortfolioUrl` strips scheme + trailing slash + case).
    Extend `utils/onboardingSchemas.test.ts` (`portfolioFormSchema` accepts
    `{ entries: [] }`; accepts a valid entry; rejects an entry with a blank or
    malformed `url` on the `entries.0.url` path; `platform` off-list fails).
    Extend `slices/creatorOnboarding.slice.test.ts` (`savePortfolio` stores the
    array; `savePortfolio([])` clears to `[]`; `reset` clears; initial state has
    `portfolio: undefined`).
  - **Done when:** `npm run test` passes for the new/changed data, schema, and
    slice specs and `npx tsc --noEmit` is clean; no UI change yet.

- [x] **2. `PortfolioEntryCard` component.**
  - `components/elements/PortfolioEntryCard/` (`.tsx`, `.test.tsx`, `index.ts`),
    following the folder/style/`useTheme` conventions of `FileUploadItem` /
    `ContentCategoryAccordion`.
  - Props: `entry: PortfolioEntry`, `onChangeUrl(url: string)`,
    `onChangePlatform(p: PortfolioPlatform)`, `onChangeThumbnail(asset?:
PickedImageAsset)`, `onDelete()`, `urlError?: string`, `duplicate?: boolean`,
    `index: number`, `testID?`.
  - Layout: a bordered card - a header row ("Sample {index + 1}" + a delete
    `Pressable` with Feather `trash-2`, `accessibilityLabel="Remove sample"`);
    a link `TextField` (`label="Content link"`, `autoCapitalize="none"`,
    `keyboardType="url"`, `error={urlError}`); when `duplicate`, a warning
    `Text` "You've already added this link" under the field; a wrapping
    `CategoryChip` row for `PORTFOLIO_PLATFORM_OPTIONS` (selected =
    `entry.platform`); an `ImageUploader` (`imageUri={entry.thumbnail?.uri}`,
    `aspect={[1, 1]}`) with an optional helper line "Add a thumbnail (optional)".
  - **Done when:** the component test passes - renders the link value and
    platform selection, calls `onChangeUrl` / `onChangePlatform` /
    `onChangeThumbnail` / `onDelete`, shows `urlError` and the duplicate warning
    only when their props are set.

- [x] **3. `PortfolioStep` scene + wizard wiring.**
  - `scenes/creator-onboarding/steps/PortfolioStep.tsx`:
    `useForm<PortfolioFormValues>` with `zodResolver(portfolioFormSchema)`,
    `mode: 'onChange'`, `defaultValues: { entries: portfolio ?? [] }`;
    `useFieldArray({ control, name: 'entries' })`.
  - `+ Add Another` (`AddItemButton`) calls `append({ id: nanoid(), url: '',
platform: 'others', thumbnail: undefined })` (`nanoid` from
    `@reduxjs/toolkit`, as `createGig.slice` / `ApplyCampaign` use it).
  - Each card: URL via `Controller` on `entries.${i}.url` (its
    `onChange` also `setValue(\`entries.${i}.platform\`, detectPlatform(text))`
    **only while the user has not manually overridden** - track overridden
    indices in local state; a manual `CategoryChip` tap sets the override and
    `setValue`s the platform); thumbnail via `setValue(\`entries.${i}.thumbnail\`)`;
delete via `remove(i)`.
  - Duplicate detection: compute in the component from
    `normalizePortfolioUrl` over the watched entries; an entry is `duplicate`
    when an earlier entry normalizes to the same non-empty value. Warning only,
    never blocks.
  - Zero-entry nudge: when `fields.length === 0`, render the copy "Adding at
    least one sample helps you get 3x more responses." `Next` stays enabled.
  - `ProfileStepHeader` `step={7}`, title "Show your best work", description
    "Add a few links to content you're proud of - this is optional but helps you
    stand out" (refine the current `PlaceholderStep` step-7 copy). `onBack={back}`.
  - Bottom `Next` `Button` (`testID="onboarding-next"`,
    `disabled={!formState.isValid}` - empty list is valid, a blank/malformed
    entry is not) → `onSubmit` dispatches `savePortfolio(values.entries)` then
    `saveAndContinue()`. Layout matches `PhotosStep` (ScrollView + fixed bottom
    button).
  - `CreatorOnboarding.tsx`: add `7: PortfolioStep` to `STEP_COMPONENTS`; update
    the placeholder comment (`Step 8 is a placeholder until 20g`).
  - `PlaceholderStep.tsx`: delete the `7:` entry from `STEP_META`; update the
    `20f-20g` comment to `20g`.
  - `PortfolioStep.test.tsx` (mock `expo-image-picker`): renders "7 of 8" with
    the zero-entry nudge and `Next` enabled; `+ Add Another` adds a card and
    (with a blank link) disables `Next`; typing a valid Instagram link
    auto-selects the Instagram chip and enables `Next`; tapping the YouTube chip
    overrides the platform and a later link edit does not revert it; a second
    card with the same link shows the duplicate warning but `Next` stays enabled
    once both links are valid; delete removes a card; a valid submit stores the
    entries and advances to step 8; header Back returns to step 6.
  - **Done when:** `npm run test`, `npm run lint`, and `npx tsc --noEmit` pass,
    and the wizard runs ... Photos -> **Portfolio** -> (placeholder) step 8,
    with Back restoring the entered cards.

## Files / areas

- `data/portfolioPlatforms.ts` (new), `data/portfolioPlatforms.test.ts` (new)
- `utils/onboardingSchemas.ts`, `utils/onboardingSchemas.test.ts`
- `slices/creatorOnboarding.slice.ts`, `slices/creatorOnboarding.slice.test.ts`
- `components/elements/PortfolioEntryCard/` (new: `.tsx`, `.test.tsx`, `index.ts`)
- `scenes/creator-onboarding/steps/PortfolioStep.tsx` (new) + `.test.tsx` (new)
- `scenes/creator-onboarding/CreatorOnboarding.tsx`,
  `scenes/creator-onboarding/steps/PlaceholderStep.tsx`
- Reuse only: `ProfileStepHeader`, `TextField`, `CategoryChip`, `ImageUploader`,
  `AddItemButton`, `Button`, `@expo/vector-icons` Feather, `layoutStyle`,
  `buttonStyle`, `profileStepStyle`, `useCreatorOnboardingStep`, `nanoid` from
  `@reduxjs/toolkit`

## Data / contracts

- **No API contract.** 20g assembles the `FormData` ("portfolio thumbnail
  files").
- **Draft field** (`creatorOnboarding.portfolio`): `PortfolioEntry[]` where
  `PortfolioEntry = { id: string; url: string; platform: 'instagram' |
'youtube' | 'tiktok' | 'others'; thumbnail?: PickedImageAsset }`. In-memory
  only, no stored data or external compatibility today; safe to revise in 20g.
- **`id`**: `nanoid()` from `@reduxjs/toolkit`, generated when a card is added.
  Nondeterministic, but it is only a list/`FormData` key with no persisted or
  external meaning yet - tests assert on `url` / `platform` / length, never the
  `id`, so no test seam is needed.
- **Link format rule**: `isLikelyPortfolioUrl` -
  `/^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i` on the trimmed value.
  A client-side format check only; scheme optional so `instagram.com/p/x` is
  accepted. The stored `url` is the raw user text (not normalized) - 20g / the
  backend can canonicalize.
- **Duplicate rule**: two entries collide when `normalizePortfolioUrl` (trim,
  lowercase, strip `http(s)://`, strip trailing slashes) is equal and non-empty.
  Warning only; the entry is still saved.
- **Platform**: `detectPlatform(url)` seeds the tag on each URL change until the
  user taps a chip; after a manual override the tag is not recomputed for that
  entry.

## Testing

`npm run test` (Jest + `jest-expo` + RNTL) is the gate. Add:

- **Data:** `detectPlatform` (instagram / youtube / `youtu.be` / tiktok /
  unknown); `isLikelyPortfolioUrl` (accepts bare-host and `https://` links,
  rejects `''` and free text); `normalizePortfolioUrl` (scheme + trailing slash
  - case).
- **Schema:** `portfolioFormSchema` accepts `{ entries: [] }`; accepts a valid
  entry; rejects blank / malformed `url` on `entries.0.url`; rejects an
  off-list `platform`.
- **Slice:** `savePortfolio` stores; `savePortfolio([])` clears to `[]`;
  `reset` clears; initial state has `portfolio: undefined`.
- **Component:** `PortfolioEntryCard` renders url + platform, fires each
  callback, shows `urlError` / duplicate warning only when set.
- **Step:** the scenarios in build step 3.

No browser test (no `Browser tests` command). No live/visual evidence claimed.

## Notes for the AI

- Match `PhotosStep.tsx` structure: `<>` wrapping a `ScrollView`
  (`layoutStyle.screen` / `layoutStyle.scrollContent`) then a fixed
  `<View style={layoutStyle.scrollContent}>` with the `Next` `Button`
  (`testID="onboarding-next"`).
- Persist only on submit (`dispatch(savePortfolio(values.entries))` then
  `saveAndContinue()`), like steps 1-6. Seed `useForm` from the slice so Back
  restores the cards.
- `formState.isValid` starts `true` here because `{ entries: [] }` passes the
  resolver - that is intended (the step is optional). A blank card added via
  `append` immediately fails `entries.i.url` and disables `Next` until the user
  fills or deletes it.
- Track "platform manually overridden" per entry in component-local state
  (`Set<number>` or a ref keyed by `field.id`); do not store the override flag
  in the form or slice.
- `CategoryChip` fills solid pink when selected - fine for the 4-chip platform
  row.
- User-entered link text renders only inside `TextField` / a warning `Text`;
  RN `Text` escapes it. Store the raw trimmed string.
- Mock `expo-image-picker` in `PortfolioStep.test.tsx` and
  `PortfolioEntryCard.test.tsx` exactly as `ImageUploader.test.tsx` does.
- **Do not run `npm run format`.** Use `npx prettier --write` on the specific
  files you changed.

## Open questions

None blocking.
