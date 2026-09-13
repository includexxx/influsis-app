# Feature: Username step + finish (20g)

**From build-plan:** feature 20g (seventh and final leaf of item 20, "Creator
onboarding wizard"). Archived 2026-09-10. Completing 20g checks the parent
item 20.

**Branch:** `feat/creator-onboarding` (the umbrella branch for all of item 20,
as used for 20a-20f; not merged per sub-item - one squash-merge into `develop`
now that the wizard is done. Config's `featureBranchPrefix` is `feature/`, but
every item-20 sub-feature shared `feat/creator-onboarding`.)

**Status:** verified - `npx tsc --noEmit`, `npm run lint` (0 errors; 1
pre-existing warning in `app/_layout.tsx`), and `npm run test` (108 suites /
436 tests, 33 new) pass. Committed on `feat/creator-onboarding`.

> The last item-20 sub-feature (20a-20f were committed here, unmerged). After
> this, the whole wizard squash-merges into `develop`.

## Goal

Build **Step 8 of the creator onboarding wizard - Username + Finish**
(build-plan 20g, `creator-onboarding-requirements.md` §3 "Username" + "Check
Handle Availability Backend API"). An `@`-prefixed handle input with:

- client-side format rules (lowercase letters, digits, `_`, `.`; 3-20 chars; no
  leading/trailing `.` or `_`),
- a **debounced live availability check** against the one real endpoint this app
  calls - `GET /api/v1/handles/{handle}/availability` (public) - with a green
  tick / red cross / spinner indicator,
- auto-suggested alternative handles when the chosen one is taken,
- a `Finish` CTA (enabled only when the format is valid **and** the handle is
  available) that assembles the full onboarding draft into a `FormData`
  submission, `console.log`s a readable summary of it, and shows a completion
  screen with a button into the main app.

**No network submit** - there is no create-profile endpoint yet; Finish builds
and logs the payload only. The completion screen's button does
`router.replace('/home')`.

## Design reference

Inherited wizard pattern: pink progress track, `8 of 8` counter, 26px title,
grey subtext, full-width pink CTA - from `ProfileStepHeader` and
`buttonStyle.primary`. The completion screen reuses `SuccessHero` (confetti +
tick + title/description) the way `scenes/main/WithdrawSuccess.tsx` composes it,
then a `Button`. The `@` prefix uses `TextField`'s `leftAdornment`. No Figma
node is specified for these onboarding screens; do not invent one.

## In scope

- `utils/onboardingSchemas.ts`:
  - `handleSchema` - `z.string()` with `.min(3)` / `.max(20)` ("Use 3-20
    characters"), `.regex(/^[a-z0-9._]+$/, ...)` ("Lowercase letters, numbers,
    . and _ only"), `.refine(h => !/^[._]|[._]$/.test(h), ...)` ("Can't start or
    end with . or \_").
  - `usernameFormSchema = z.object({ handle: handleSchema })`,
    `UsernameFormValues`.
  - `HandleAvailabilityData = { available: boolean; reason?: 'taken' |
'reserved' }` type (the unwrapped `data` of the 200 response).
- `data/handleSuggestions.ts` (new) - `generateHandleSuggestions(name?: string,
city?: string): string[]`: a deterministic heuristic (slugified name +
  `1` / `_<citySlug>` / `.creator`), filtered to `handleSchema`-valid, deduped,
  never equal to the taken handle, capped at 3, `[]` when the name yields no
  usable slug.
- `hooks/useHandleAvailability.ts` (new) - `useHandleAvailability(handle:
string, enabled: boolean, debounceMs = 400)`. When `enabled` and `handle`
  non-empty: after `debounceMs` of no change, `request<HandleAvailabilityData>({
url: \`/handles/\${encodeURIComponent(handle)}/availability\`, method: 'GET',
  skipAuth: true })`. Ignores superseded responses (cancelled-flag in the
effect cleanup). Returns
`{ state: 'idle' | 'checking' | 'available' | 'taken' | 'reserved' |
  'invalid' | 'error' }`:
  - 200 `available: true` -> `available`
  - 200 `available: false` -> `reason` (`taken` / `reserved`)
  - `ApiError` `statusCode === 422` -> `invalid` (server format check)
  - any other `ApiError` -> `error`
  - not `enabled`, or `handle` empty -> `idle` (and no request)
- `utils/onboardingPayload.ts` (new) - `buildOnboardingSubmission(state:
CreatorOnboardingState): { formData: FormData; summary: Record<string,
unknown> }`. `formData` carries the flat text fields (`name`, `gender`,
  `dateOfBirth`, `country`, `division`, `city`, `zip`, `categories` (JSON),
  `languages` (JSON), `deliverables` (JSON), `portfolio` (JSON of `{url,
platform}`), `handle`) plus file parts (`profilePhoto`, `coverPhoto`,
  `portfolioThumbnail_<entryId>`) as RN `{ uri, name, type }` objects. `summary`
  is a plain, log-safe object (counts + field values, file parts reduced to
  `{ fileName, mimeType }`). **Field naming is not a backend contract** - no
  endpoint consumes it yet; it is the simplest flat shape and is expected to be
  revised when the submit endpoint lands.
- `slices/creatorOnboarding.slice.ts`: add `handle?: string` and
  `completed: boolean` to state + `initialState` (`completed: false`); add
  `saveHandle` (`PayloadAction<string>`) and `completeOnboarding`
  (no payload -> `state.completed = true`, also `markStepComplete(8)` inline via
  pushing 8) reducers; export both; add to the destructured `slice.actions`
  export; `reset` already returns `initialState` so it clears both.
- `scenes/creator-onboarding/steps/UsernameStep.tsx` (new, step 8):
  `useForm<UsernameFormValues>` (`zodResolver(usernameFormSchema)`,
  `mode: 'onChange'`, `defaultValues: { handle: handle ?? '' }`). A `TextField`
  with `leftAdornment={<Text>@</Text>}`, `autoCapitalize="none"`,
  `autoCorrect={false}`; the `onChangeText` lower-cases and strips a leading
  `@`. A status row under the field driven by `useHandleAvailability(handle,
formatValid)`: spinner + "Checking..." / green Feather `check` + "Available" /
  red Feather `x` + "That handle is taken" / "That handle is reserved" /
  "Check that format" (invalid) / "Couldn't check right now" (error). When
  `state` is `taken` or `reserved`, render tappable suggestion chips from
  `generateHandleSuggestions(basics?.name, location?.city)` (tap -> set the
  handle -> a fresh check runs). `Finish` `Button` (`testID="onboarding-next"`,
  `disabled` unless `formState.isValid && state === 'available'`) -> `onFinish`:
  `dispatch(saveHandle(handle))`, `const { summary } =
buildOnboardingSubmission(getState-equivalent)`, `console.log('[creator-onboarding]
submission', summary)`, `dispatch(completeOnboarding())`. Header `step={8}`,
  title "Claim your username", description "This is your public handle -
  platform.com/@you. It doesn't change if you rename your profile later.",
  `onBack={back}`.
- `scenes/creator-onboarding/OnboardingComplete.tsx` (new): `SuccessHero`
  ("You're all set", "Your creator profile is ready to go") + a `Button`
  "Explore Influsis" -> `router.replace('/home')`. Composed like
  `WithdrawSuccess` (SafeAreaView + ScrollView).
- `scenes/creator-onboarding/CreatorOnboarding.tsx`: `if (completed) return
<OnboardingComplete/>` (inside the themed `SafeAreaView`); add
  `8: UsernameStep` to `STEP_COMPONENTS`.
- `scenes/creator-onboarding/steps/PlaceholderStep.tsx`: empty `STEP_META` to
  `{}` (every step 1-8 is now real; it stays only as the unreachable
  `?? PlaceholderStep` fallback).
- `scenes/creator-onboarding/index.ts`: export `OnboardingComplete` if a test
  imports it via the barrel (otherwise import directly).
- Unit tests: schema, `generateHandleSuggestions`, `useHandleAvailability`,
  `buildOnboardingSubmission`, `UsernameStep`, `OnboardingComplete`.

## Out of scope

- Any create-profile / submit endpoint and the post-submit behaviour (a later
  build-plan item). Finish logs the summary and stops at the completion screen.
- Server-side handle reservation / claiming (the GET is a read-only check; two
  creators could pass the check and collide - that is the backend's job at
  submit time).
- Debounced re-checking of the **suggested** handles before showing them (they
  are shown unchecked; tapping one runs the normal check).
- Social account connection / follower capture (explicitly removed from
  onboarding per requirements §4).
- A redux-persist / resume-after-reload story for the draft (the slice is
  in-memory; a fresh registration gets a fresh session).
- Editing the handle from `EditProfile` or the public profile.
- Changing `ONBOARDING_TOTAL_STEPS` or the step-machine navigation contract.

## Build steps

- [x] **1. Schema + suggestion helper + slice.**
- [x] **2. `useHandleAvailability` hook.**
- [x] **3. `buildOnboardingSubmission` helper.**
- [x] **4. `UsernameStep` scene + wizard wiring.**
- [x] **5. `OnboardingComplete` screen + completion wiring.**

## Files / areas

- `utils/onboardingSchemas.ts` (+test), `data/handleSuggestions.ts` (new,
  +test), `hooks/useHandleAvailability.ts` (new, +test), `hooks/index.ts`,
  `utils/onboardingPayload.ts` (new, +test)
- `slices/creatorOnboarding.slice.ts` (+test)
- `scenes/creator-onboarding/steps/UsernameStep.tsx` (new, +test),
  `scenes/creator-onboarding/OnboardingComplete.tsx` (new, +test),
  `scenes/creator-onboarding/CreatorOnboarding.tsx` (+test),
  `scenes/creator-onboarding/steps/PlaceholderStep.tsx`

## Data / contracts

- **Real endpoint (read-only):** `GET /api/v1/handles/{handle}/availability`,
  public, `skipAuth: true`. Base URL is `config.apiUrl` (`.../api/v1`), so the
  request URL is `/handles/${handle}/availability`. `request()` unwraps the
  envelope: success -> `HandleAvailabilityData`; non-2xx -> throws `ApiError`.
  Unavailability is **HTTP 200** with `available: false`, never an error status.
  `reason` is `taken` or `reserved`. Documented in
  `platform-context/api-contracts/auth.md`.
- **Handle storage:** the bare string without `@`, lower-cased. Client format:
  `/^[a-z0-9._]{3,20}$/` and no leading/trailing `.`/`_`. **Divergence:** the
  backend claim regex (`profiles.md`) is `/^[a-z0-9_]{3,30}$/i` - no period -
  so a `.`-containing handle passes the availability check but will be rejected
  at claim time. Flagged in `platform-context/integration/backend-mobile.md`
  for the later submit item.
- **`completed` flag:** in-memory slice boolean, set by `completeOnboarding`;
  drives `CreatorOnboarding`'s completion render. Not persisted; a fresh
  session starts it `false`.
- **Submission payload:** `FormData` shape defined in
  `utils/onboardingPayload.ts`, **not a backend contract** - chosen as the
  simplest flat mapping and expected to change when the submit endpoint is
  built. `summary` (log-safe object) is what Finish `console.log`s.
- **Routing:** `authGate` has **no onboarding-completion gate** - an
  authenticated creator is `ALLOW`ed into `(main)`, so
  `router.replace('/home')` from the completion screen is terminal.

## Testing

`npm run test` (Jest + `jest-expo` + RNTL) is the gate. Mocks `@/services/http`'s
`request` for the hook and step tests; `jest.useFakeTimers()` for the debounce;
`jest.mock('expo-router')` for the completion screen. No live backend call is
made in tests. No `Browser tests` command exists; no live/visual evidence is
claimed.

## Implementation notes

- **`generateHandleSuggestions` gained an optional 3rd param `takenHandle`**
  (In scope showed a 2-arg signature). `UsernameStep` passes the current
  `handle` so the taken value is never suggested back, satisfying the spec's
  "never equal to the taken handle" clause deterministically rather than
  structurally.
- **`OnboardingComplete` is just a `ScrollView`** (not its own `SafeAreaView`):
  `CreatorOnboarding` already renders it inside the shell's themed
  `SafeAreaView`, per the In-scope wiring line.
- **Format validity** in `UsernameStep` is computed from
  `usernameFormSchema.safeParse(...).success || isValid` rather than RHF's
  `isValid` alone (which is `false` until the first change), mirroring
  `PortfolioStep`'s direct-parse pattern. It gates both the availability
  request (`enabled`) and the `Finish` button.
- **`useHandleAvailability` sets `checking` synchronously** when
  enabled + non-empty (before the debounce window elapses) so the indicator is
  responsive while typing; the request itself still fires only after
  `debounceMs`.
- **422 vs `VALIDATION_FAILED`:** the hook maps HTTP `422` to `invalid`, but
  the backend's server-side format check is documented as "reserved for a
  future" validator and not currently wired. The client gates the request
  behind its own format check, so this branch is effectively unreachable
  today. Flagged in `backend-mobile.md`.
- **CreatorOnboarding coverage** was added as a new `CreatorOnboarding.test.tsx`
  (in-progress renders the active step; `completed: true` renders
  `OnboardingComplete`).
- 33 new tests: `onboardingSchemas` (+4 `handleSchema`), `handleSuggestions`
  (5), `creatorOnboarding.slice` (+4), `useHandleAvailability` (5),
  `onboardingPayload` (4), `UsernameStep` (7), `OnboardingComplete` (2),
  `CreatorOnboarding` (2).

## Open questions

None blocking. Noted for the later submit item: the `FormData` field names in
`utils/onboardingPayload.ts` are a placeholder mapping, and the client handle
format (allows `.`) is looser than the backend claim regex - both to be
reconciled when the create-profile endpoint exists.
