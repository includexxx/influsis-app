# Feature: Profile + cover photo step (20e)

**From build-plan:** feature 20e (fifth leaf of item 20, "Creator onboarding
wizard"). Archived 2026-09-10.

**Branch:** `feat/creator-onboarding` (the umbrella branch for all of item 20,
as used for 20a-20d; not merged per sub-item - one squash-merge when the wizard
is done. Supersedes the derived `feature/profile-cover-photo-step`.)

**Status:** verified - `tsc --noEmit`, `expo lint`, and `npm run test`
(99 suites / 382 tests, 12 new) pass. Committed on `feat/creator-onboarding`.

> Continues the item-20 branch (20a-20d are committed here, unmerged). Config's
> `featureBranchPrefix` is `feature/`, but every item-20 sub-feature shares
> `feat/creator-onboarding`; the whole wizard squash-merges once 20g lands.

## Goal

Build **Step 6 of the creator onboarding wizard - Profile + cover photo**
(build-plan 20e, `creator-onboarding-requirements.md` §3 Screens 6-7, combined
into one wizard screen). Two single-image pickers - a profile photo and a cover
photo - both **recommended but optional**, with copy explaining they drive the
discovery card and add verification credibility. Each picked image is held as a
descriptor (`{ uri, mimeType?, fileName? }`) so 20g can drop it straight into
`FormData`. `Next` is always enabled (nothing to validate); a picked image can
be replaced or removed before continuing. No network call. No new route.

## Design reference

Visual pattern is inherited: pink progress track, `6 of 8` counter, 26px title,
grey subtext, full-width pink CTA - from `ProfileStepHeader` and
`buttonStyle.primary`, as steps 1-5 use them. Each picker is the existing
`components/elements/ImageUploader` (dashed pink drop-zone when empty; 148x148
preview + green success badge + "Change Image" when filled - Figma
"\_File upload base", nodes 6525:6049 / 6525:6135). No Figma node is specified
for this onboarding screen specifically; do not invent one.

## In scope

- Extend `components/elements/ImageUploader`:
  - `onChange` becomes `(uri: string, asset?: PickedImageAsset) => void` - it
    still passes the `uri` first (existing `CreateGigBasics` caller keeps
    working), and now also passes `{ uri, mimeType, fileName }` from the picked
    asset.
  - new optional `aspect?: [number, number]` prop (default `[1, 1]`, so
    `CreateGigBasics` is unchanged) forwarded to
    `ImagePicker.launchImageLibraryAsync`.
- `utils/onboardingSchemas.ts`: `pickedImageSchema` (`{ uri: non-empty string;
mimeType?: string; fileName?: string }`), `photosSchema` (`{ profilePhoto?:
pickedImageSchema; coverPhoto?: pickedImageSchema }`, all-optional so an empty
  object is valid), and `PhotosValues` + `PickedImageAsset` types.
- `creatorOnboarding` slice: `profilePhoto?: PickedImageAsset` and
  `coverPhoto?: PickedImageAsset` draft fields + a single `savePhotos` action
  taking `PhotosValues` (sets both, `undefined` clears).
- `PhotosStep` (step 6) scene: header + explanatory copy, a "Profile photo"
  `ImageUploader` (`aspect={[1, 1]}`) and a "Cover photo" `ImageUploader`
  (`aspect={[16, 9]}`), each with a "Remove photo" text button shown only when
  that image is set, an always-enabled `Next` that dispatches `savePhotos` and
  advances, and header Back. Wired into `CreatorOnboarding` as step 6.
- Remove step 6 from `PlaceholderStep`'s `STEP_META`.
- Unit tests: schema, slice action, the widened `ImageUploader`, and the step
  (RNTL, mirroring `LanguagesStep.test.tsx`, with `expo-image-picker` mocked as
  in `ImageUploader.test.tsx`).

## Out of scope

- Steps 20f-20g (portfolio, username, Finish) and the `FormData` payload
  assembly - the descriptors are only persisted to the draft here.
- Image cropping/compression beyond what `ImagePicker` already does
  (`quality: 0.8`, `allowsEditing: true` are already set in `ImageUploader`).
- Camera capture (`launchCameraAsync`), multi-select, remote upload, EXIF
  stripping, and any size/dimension limit enforcement - none are in the
  requirements and there is no backend to enforce against.
- A separate "Skip" control - the step communicates skippability through copy
  and an always-enabled `Next`; `useCreatorOnboardingStep.skip()` is not used.
- Surfacing these images in `scenes/main/EditProfile.tsx` or the public
  profile.

## Build loop

`workflow.stepReview` is `feature` and `checkpointCommits` is `disabled`:
implement all build steps in one pass, no per-step approval pauses or checkpoint
commits. After the last step, present one review packet. `/complete` makes the
single feature commit on `feat/creator-onboarding` (not merged - item 20 keeps
stacking until 20g). Run `npx tsc --noEmit`, `npm run lint`, and `npm run test`
before the review packet. **Do not run `npm run format`** - it is a repo-wide
`prettier --write` that rewrites unrelated files; use `npx prettier --write` on
the touched files only.

## Build steps

- [x] **1. Schema + types + slice.**
  - `utils/onboardingSchemas.ts`:

    ```text
    export type PickedImageAsset = { uri: string; mimeType?: string; fileName?: string };

    pickedImageSchema = z.object({
      uri: z.string().min(1),
      mimeType: z.string().optional(),
      fileName: z.string().optional(),
    })

    photosSchema = z.object({
      profilePhoto: pickedImageSchema.optional(),
      coverPhoto: pickedImageSchema.optional(),
    })

    export type PhotosValues = z.infer<typeof photosSchema>;
    ```

  - `slices/creatorOnboarding.slice.ts`: add `profilePhoto?: PickedImageAsset`
    and `coverPhoto?: PickedImageAsset` to state + `initialState`; add a
    `savePhotos` reducer taking `PayloadAction<PhotosValues>` that assigns
    `state.profilePhoto = payload.profilePhoto` and
    `state.coverPhoto = payload.coverPhoto`; export it and add it to the
    destructured `slice.actions` export; update the state comment
    (`20f+ add \`portfolio\` and \`handle\``).
  - Tests: extend `utils/onboardingSchemas.test.ts` (`photosSchema` accepts
    `{}`, accepts one or both photos, rejects a photo with a blank `uri`).
    Extend `slices/creatorOnboarding.slice.test.ts` (`savePhotos` stores both;
    `savePhotos({})` clears both; `reset` clears; initial state has both
    `undefined`).
  - **Done when:** `npm run test` passes for the changed schema and slice specs
    and `npx tsc --noEmit` is clean; no UI change yet.

- [x] **2. Widen `ImageUploader`.**
  - `onChange: (uri: string, asset?: PickedImageAsset) => void`; in `handlePick`,
    after a successful non-cancelled pick call
    `onChange(a.uri, { uri: a.uri, mimeType: a.mimeType, fileName: a.fileName })`
    where `a = result.assets[0]`.
  - Add `aspect?: [number, number]` prop, default `[1, 1]`, passed to
    `launchImageLibraryAsync({ ..., aspect })`.
  - Import `PickedImageAsset` from `@/utils/onboardingSchemas` (or re-declare a
    local structural type if that creates an import cycle - check).
  - Update `ImageUploader.test.tsx`: the existing "calls onChange with the
    picked image uri" test still asserts the first arg is the `uri`; add an
    assertion that the second arg carries `mimeType` / `fileName` when the mock
    asset provides them.
  - **Done when:** `ImageUploader` tests pass, `CreateGigBasics` still
    type-checks (its `onChange={uri => ...}` ignores the new second arg), and
    `npx tsc --noEmit` is clean.

- [x] **3. `PhotosStep` scene + wizard wiring.**
  - `scenes/creator-onboarding/steps/PhotosStep.tsx`: `useForm<PhotosValues>`
    with `zodResolver(photosSchema)`, `mode: 'onChange'`, `defaultValues:
{ profilePhoto, coverPhoto }` read from the slice. Two labelled
    `ImageUploader`s driven by `watch` + `setValue(name, asset, {
shouldValidate: true })`; `imageUri` comes from
    `watch('profilePhoto')?.uri` / `watch('coverPhoto')?.uri`. A "Remove photo"
    `Pressable`/text button under each uploader, rendered only when that value
    is set, calls `setValue(name, undefined, { shouldValidate: true })`.
  - `ProfileStepHeader` `step={6}`, title "Add your photos", description
    "Your profile and cover photo power your discovery card and help verify
    you're a real creator" (refine the current `PlaceholderStep` step-6 copy;
    keep it one line). Add a short secondary line, e.g. "Recommended - you can
    add or change these later."
  - Bottom `Next` `Button` (`testID="onboarding-next"`, never disabled) →
    `handleSubmit(onSubmit)`; `onSubmit` dispatches `savePhotos(values)` then
    `saveAndContinue()`. Layout matches `LanguagesStep` (ScrollView + fixed
    bottom button, `layoutStyle` / `profileStepStyle`).
  - `scenes/creator-onboarding/CreatorOnboarding.tsx`: add `6: PhotosStep` to
    `STEP_COMPONENTS`; update the "Steps 7-8 are placeholders" comment.
  - `scenes/creator-onboarding/steps/PlaceholderStep.tsx`: delete the `6:`
    entry from `STEP_META`; update the `20e-20g` comment to `20f-20g`.
  - `PhotosStep.test.tsx` (mock `expo-image-picker` like `ImageUploader.test.tsx`):
    renders "6 of 8"; `Next` is enabled from the start; picking a profile photo
    shows its preview and stores the descriptor; a submit dispatches `savePhotos`
    and advances to step 7 with the descriptor in the draft; "Remove photo"
    clears it; submitting with no photos advances to step 7 with both
    `undefined`; header Back returns to step 5.
  - **Done when:** `npm run test`, `npm run lint`, and `npx tsc --noEmit` pass,
    and the wizard runs ... Deliverables -> **Photos** -> (placeholder) step 7,
    with Back restoring the picked images.

## Files / areas

- `utils/onboardingSchemas.ts`, `utils/onboardingSchemas.test.ts`
- `slices/creatorOnboarding.slice.ts`, `slices/creatorOnboarding.slice.test.ts`
- `components/elements/ImageUploader/ImageUploader.tsx`, `ImageUploader.test.tsx`
- `scenes/creator-onboarding/steps/PhotosStep.tsx` (new) + `PhotosStep.test.tsx`
  (new)
- `scenes/creator-onboarding/CreatorOnboarding.tsx`,
  `scenes/creator-onboarding/steps/PlaceholderStep.tsx`
- Reuse only: `ProfileStepHeader`, `ImageUploader`, `Button`, `layoutStyle`,
  `buttonStyle`, `profileStepStyle`, `useCreatorOnboardingStep`,
  `expo-image-picker` (already a dependency, `~17.0.11`)

## Data / contracts

- **No API contract.** No backend endpoint consumes this yet; 20g assembles the
  `FormData`.
- **Draft fields** (`creatorOnboarding.profilePhoto`,
  `creatorOnboarding.coverPhoto`): `PickedImageAsset =
{ uri: string; mimeType?: string; fileName?: string }`, taken from
  `ImagePicker.ImagePickerAsset`. In-memory only, no stored data or external
  compatibility today; `mimeType`/`fileName` are optional because the picker
  does not always populate them. Safe to revise in 20g.
- `savePhotos` payload is the whole `{ profilePhoto?, coverPhoto? }` object, so
  one dispatch sets the step's full state and `savePhotos({})` clears it.
- **`aspect`**: `[1, 1]` for the profile photo, `[16, 9]` for the cover photo -
  a UX choice (no design spec); `ImageUploader` defaults to `[1, 1]` so the
  `CreateGigBasics` cover picker is unaffected.

## Testing

`npm run test` (Jest + `jest-expo` + RNTL) is the gate. Add:

- **Schema:** `photosSchema` accepts `{}`; accepts `{ profilePhoto }` alone,
  `{ coverPhoto }` alone, and both; rejects `{ profilePhoto: { uri: '' } }`.
- **Slice:** `savePhotos` stores both descriptors; `savePhotos({})` clears both;
  `reset` clears; initial state has both `undefined`.
- **Component:** `ImageUploader` `onChange` passes `uri` first and a
  `{ uri, mimeType, fileName }` descriptor second; empty/filled render
  unchanged.
- **Step:** the scenarios in build step 3 (mock `expo-image-picker`; no
  bottom-sheet mocks needed).

No browser test (no `Browser tests` command). No live/visual evidence claimed.

## Notes for the AI

- Match `LanguagesStep.tsx` structure: `<>` wrapping a `ScrollView`
  (`layoutStyle.screen` / `layoutStyle.scrollContent`) then a fixed
  `<View style={layoutStyle.scrollContent}>` with the `Next` `Button`
  (`testID="onboarding-next"`).
- Persist only on submit (dispatch `savePhotos` then `saveAndContinue()`), like
  steps 1-5. Seed the form from the slice so Back restores the picked images.
- Mock `expo-image-picker` in `PhotosStep.test.tsx` exactly as
  `ImageUploader.test.tsx` does (`requestMediaLibraryPermissionsAsync`,
  `launchImageLibraryAsync`); drive a pick by firing press on the uploader's
  `testID` and resolving the mock with `{ canceled: false, assets: [{ uri,
mimeType, fileName }] }`.
- `ImageUploader` currently calls `onChange(result.assets[0].uri)`; keep the
  first positional arg identical so no other caller breaks.
- `Next` must never be `disabled` here - the step is optional. Do not add a
  schema rule that blocks an empty submit.
- User-supplied images are rendered only through `Image source={{ uri }}`;
  there is no text or HTML surface.
- **Do not run `npm run format`.** Use `npx prettier --write` on the specific
  files you changed. CI's `format` step is `prettier --write` and passes
  regardless.

## Open questions

None blocking.
