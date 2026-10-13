# Current Feature

**Feature:** 37a. Rate the business after the campaign completes (backend 23a `CK1`, `CK2`; 23b `CK8`)

**Branch:** feature/rate-the-business-after-the-campaign-completes

**Status:** verified

## Goal

Once an engagement is `completed`, the creator can rate the business (0-5 in
half-star steps plus a required 10-2000 character message), see where their
review stands under the blind reveal, and read the business's review of them
once it is visible. Pending reviews are surfaced on Home, on the engagement
(Offer) screen, and on the Deliverables screen's delivered stage.

## In scope

- `campaignFeedApi`: `getEngagementReviews` (CK1), `submitEngagementReview`
  (CK2), `getPendingReviews` (CK8), with typed responses and cache tags.
- `StarRating` renders half stars; new `StarRatingInput` element.
- New route `app/(details)/engagement/[id]/review.tsx` ->
  `scenes/campaigns/ReviewBusinessScreen.tsx`: write form, submitted state,
  both reviews once revealed, "Hidden by Influsis" note.
- A CK1-driven review card on the Offer screen (`/engagement/[id]`) for a
  completed engagement.
- A "Reviews to write" section on Home (hidden when empty), included in
  pull-to-refresh.
- A "Rate {business}" button on the Deliverables screen's `delivered` stage.

## Out of scope

- 37b (own reputation, portfolio `CK6`/`CK7`, own reviews `CK3`) and 37c
  (reviews on other profiles, `CK4`/`CK5`, directory `reputation`).
- Editing or deleting a review (the backend forbids both), notifications,
  the business side (`web` item 47), admin moderation (`CK9`/`CK10`).
- Changing `services/http.ts` to expose `meta` (see Notes).
- The Completed Campaigns tab (`a6480f2`, outside the plan) is left as is.

## Build loop

`workflow.stepReview: "feature"`: build all steps, each leaving the app
working with `npm run test` green, then one review packet for the whole
feature. `workflow.checkpointCommits: "disabled"`: no per-step commits;
`/complete` creates the feature commit. Run `npm run lint` and
`npm run format` before the review packet.

## Build steps

- [x] **1. Review API and types.** Add `scenes/campaigns/types/review.ts`
  (`EngagementReview`, `EngagementReviewState`, `PendingReview`,
  `SubmitReviewArgs`) per Data / contracts. In `campaignFeedApi.ts` add a
  `'EngagementReviews'` and a `'PendingReviews'` tag type and:
  `getEngagementReviews({ engagementId })` -> `GET
  /engagements/:engagementId/reviews`, provides `{ type: 'EngagementReviews',
  id }`; `submitEngagementReview({ engagementId, rating, message })` -> `POST`
  same URL with body `{ rating, message }`, invalidates that id tag,
  `'PendingReviews'` and `{ type: 'MyEngagement', id }` (not on error);
  `getPendingReviews({ page, limit })` -> `GET /me/reviews/pending`, provides
  `'PendingReviews'`. Export the hooks.
  **Done when** `campaignFeedApi.test.ts` asserts each URL, method, params
  and body, and that a successful submit refetches a subscribed CK1; tests
  pass.

- [x] **2. Half stars in `StarRating`.** Round `rating` to the nearest 0.5,
  render `floor` full stars plus one half star (the filled icon clipped to
  half its width) when a half remains and fewer than `maxStars` stars are
  shown. `maxStars={1}` callers (Creator Profile header) are unchanged.
  **Done when** `StarRating.test.tsx` covers 4 -> 4 full, 4.5 -> 4 full + 1
  half, 0 -> none, `maxStars={1}` with 4.5 -> 1 full; existing callers'
  tests still pass.

- [x] **3. `StarRatingInput` element.** New
  `components/elements/StarRatingInput/` (`StarRatingInput.tsx`, `index.ts`,
  test). Props: `value: number | null`, `onChange(value)`, `starSize?`,
  `disabled?`, `testID?`. Five stars, each split into two pressable halves
  (left = n - 0.5, right = n), empty stars drawn in a muted theme color,
  filled/half as in `StarRating`. Accessibility: one element with
  `accessibilityRole="adjustable"`, label "Rating", `accessibilityValue`
  `{ min: 0, max: 5, now, text }` ("4.5 out of 5 stars" / "No rating"),
  `increment`/`decrement` actions in 0.5 steps clamped to 0-5 (increment
  from `null` -> 0.5, decrement from 0.5 -> 0). Colors from `@/theme`.
  **Done when** tests show tapping the left/right half sets 2.5/3, the
  increment/decrement actions step and clamp, `disabled` ignores input, and
  the value text updates; tests pass.

- [x] **4. Review form logic.** `scenes/campaigns/utils/review.ts`: a zod
  schema (rating required, 0-5, multiple of 0.5 -> "Choose a rating";
  message trimmed, 10-2000 -> "Write at least 10 characters" / "Keep it under
  2000 characters"), `toReviewPayload` (trims the message), a `422` mapper
  that puts `errors.rating` / `errors.message` on the matching field (follow
  `utils/applyErrors.ts`), and `reviewCardState(state, now)` returning one of
  `none` (not completed) | `write` | `write-theyReviewed` | `submitted-blind`
  (mine, theirs null; carries `mine.visibleAt` / `isVisible`) | `revealed`
  (theirs present), plus `canReview`.
  **Done when** `utils/review.test.ts` covers trimming, bounds, half steps, 0
  accepted, null rejected, the 422 mapping, and every `reviewCardState`
  branch including a hidden review and "theirs visible after 7 days while
  `canReview`"; tests pass.

- [x] **5. Review screen.** Route `app/(details)/engagement/[id]/review.tsx`
  (thin re-export) -> `ReviewBusinessScreen` (exported from
  `scenes/campaigns/index.ts`, styles in `reviewBusiness.style.ts`). Params:
  `id`, `title` (campaign), `business` (name; falls back to "the business").
  Reads CK1. States: loading skeleton; CK1 `404` -> `<Redirect href="/home"
  />` (the ApplyCampaign pattern); other error -> `CampaignsEmptyState
  variant="error"` with retry; `engagementStatus !== 'completed'` -> notice
  "Reviews open once the engagement is completed."; `canReview` -> form;
  `mine` present -> submitted state. Form: `StarRatingInput`, message field
  (`ControlledTextField`, multiline, `maxLength={2000}`, live `n/2000`
  counter), the note "Reviews can't be edited or deleted after you submit.",
  Submit (loading while sending, disabled while submitting). Field errors show
  under their field with `accessibilityRole="alert"` and clear when the field
  changes. On `409 ALREADY_EXISTS` or `409 CONFLICT` refetch CK1 (the screen
  then shows the submitted state or the "not completed" notice); any other
  error shows the backend message as a root alert. Submitted state: "Your
  review" (stars, message, date), the visibility line (`isVisible` ? "Visible
  to {business}" : "{business} can see it on {revealAt date}, or sooner if
  they review you"), and when `theirs` is present "{business}'s review of
  you". A review with `hidden: true` keeps its content and shows "Hidden by
  Influsis". Messages render as plain `<Text>`.
  **Done when** `ReviewBusinessScreen.test.tsx` (mocked `request`, the
  `Applications.test.tsx` pattern) covers: form submit sends the trimmed
  body; client validation blocks submit without a request; a 422 lands on
  the field; 409 ALREADY_EXISTS refetches into the submitted state; the
  revealed state shows both reviews; a hidden review shows the note; a
  not-completed engagement shows the notice. Tests pass.

- [x] **6. Review card on the Offer screen.** On `OfferScreen`, when the
  engagement (CF3) `status === 'completed'`, read CK1 (skip the query
  otherwise) and render a review section under the status summary following
  `reviewCardState`: `write` -> "How was working with {business}?" with
  "Write a review"; `write-theyReviewed` -> "{business} reviewed you. Write
  yours to see it." with "Write a review"; `submitted-blind` -> "Review
  submitted" with the visibility line; `revealed` -> both ratings with "Read
  reviews"; a CK1 error shows nothing (the rest of the screen is
  unaffected). Every button opens `/engagement/[id]/review` with `title` and
  `business` (`campaign.data?.business?.businessName`, already read by the
  screen). Put the card in a feature component
  `scenes/campaigns/components/EngagementReviewCard.tsx`.
  **Done when** `OfferScreen.test.tsx` gains cases for `write`,
  `submitted-blind` and `revealed`, and a non-completed engagement makes no
  CK1 request; tests pass.

- [x] **7. Deliverables "Rate {business}" and the Home section.**
  Deliverables screen: on `stage === 'delivered'`, read CK1 and when
  `canReview` show a primary "Rate {business}" button (falls back to "Rate
  the business") that opens the review screen. Home: new
  `scenes/home/components/ReviewsToWriteSection.tsx` reading
  `getPendingReviews({ page: 1, limit: CAMPAIGNS_PREVIEW_LIMIT })`, placed
  after `ActiveCampaignsSection`, rendering nothing while loading, on error,
  or when empty; otherwise a "Reviews to write" header and one row per
  pending review (counterparty avatar via `resolveMediaKeyOrUrl` with an
  initial fallback, "Rate {displayName}", campaign title, and "They've
  reviewed you" when `theirsSubmitted`), each opening the review screen with
  `title = campaign.title`, `business = counterparty.displayName`. Add the
  query to `useHomeRefresh`.
  **Done when** tests cover the section's hidden-when-empty and row-tap
  navigation, and the Deliverables screen shows the button only for a
  delivered engagement with `canReview`; full `npm run test`, `npm run lint`
  pass.

## Files / areas

- `scenes/campaigns/api/campaignFeedApi.ts` (+ test)
- `scenes/campaigns/types/review.ts` (new)
- `scenes/campaigns/utils/review.ts` (+ test, new)
- `components/elements/StarRating/` (+ test), `components/elements/StarRatingInput/` (new)
- `app/(details)/engagement/[id]/review.tsx` (new)
- `scenes/campaigns/ReviewBusinessScreen.tsx`, `reviewBusiness.style.ts` (+ test, new), `scenes/campaigns/index.ts`
- `scenes/campaigns/components/EngagementReviewCard.tsx` (new), `scenes/campaigns/OfferScreen.tsx` (+ test)
- `scenes/campaigns/DeliverablesScreen.tsx` (+ test)
- `scenes/home/components/ReviewsToWriteSection.tsx` (new), `scenes/home/components/index.ts`, `scenes/home/Home.tsx`, `scenes/home/hooks/useHomeRefresh.ts`

## Data / contracts

Source: `../backend/docs/features/campaign/implementations/CK_REVIEWS_AND_PORTFOLIO.md`.
All under `H-Bearer`; the creator holds `campaign.apply`. The backend derives
the reviewer and direction from the token; the client never sends either.

- **CK1** `GET /engagements/:engagementId/reviews` -> `EngagementReviewState`:
  `engagementStatus` (EngagementStatus), `completedAt` (ISO | null),
  `revealAt` (ISO | null; `completedAt` + 7 days), `canReview` (bool),
  `mine` (EngagementReview | null), `theirs` (EngagementReview | null; only
  once visible), `theirsSubmitted` (bool). A non-completed engagement:
  `canReview: false`, `revealAt: null`, both reviews null. Not a party ->
  `404`.
- **EngagementReview**: `id`, `direction` ('business_to_creator' |
  'creator_to_business'), `rating` (number 0-5, 0.5 steps), `message`
  (string, plain text), `submittedAt`, `visibleAt` (ISO), `isVisible`
  (bool), `hidden` (bool).
- **CK2** `POST /engagements/:engagementId/reviews` body `{ rating, message }`
  (message trimmed client-side; the backend trims too). `201` -> the new
  review. Errors in order: `422 VALIDATION_FAILED` (`errors.rating`,
  `errors.message`), `404`, `409 CONFLICT` "Reviews open once the engagement
  is completed.", `409 ALREADY_EXISTS` "You have already reviewed this
  engagement." No idempotency key: a retry gets `409 ALREADY_EXISTS`, treated
  as "already submitted".
- **CK8** `GET /me/reviews/pending?page=&limit=` -> `PendingReview[]`
  (newest `completedAt` first; empty is `200 []`): `engagementId`,
  `completedAt`, `theirsSubmitted`, `campaign { id, title }`, `counterparty
  { userId, displayName, avatarUrl (string | null) }`. A gone account shows
  as "Former Influsis member".
- `0` is a real rating. No review is not a 0-star review.

## Testing

`npm run test` (Jest + RNTL), no Verify command declared. Before this spec,
the full suite passed on this branch at `a6480f2` (168 suites, 1001 tests),
observed in this session. New tests: API endpoints (step 1), `StarRating`
half stars (2), `StarRatingInput` (3), `utils/review` (4),
`ReviewBusinessScreen` (5), Offer screen card (6), Home section and
Deliverables button (7). No live backend, device, or visual evidence is
claimed; check the screens with the dev server after step 7.

## Notes for the AI

- `services/http.ts` drops `meta`, so CK2's `meta.revealed` is not readable.
  The invalidated CK1 refetch returns `theirs` when both sides have reviewed,
  which shows both reviews at once; that is how "revealed" is honoured.
- The business name comes from CB2 (`campaign.data?.business?.businessName`),
  which 404s once a campaign isn't live, so always fall back to "the
  business". Pass it to the review screen as the `business` route param,
  like `title`.
- Review messages are user text: render with `<Text>` only, never through
  `RichText`/HTML.
- `theirs: null` with `theirsSubmitted: true` means "written, still blind",
  not "no review".
- A hidden review (`hidden: true`) is shown to both parties with the note; it
  is never removed from the UI.
- Reuse `CAMPAIGNS_PREVIEW_LIMIT` for CK8's Home page size; the section shows
  only the first page (no "see all" screen in 37a).
- If `Image` (expo-image) does not support `tintColor` for the empty-star
  tint, use a Feather `star` outline icon for empty stars instead.

## Open questions

- **0-star by touch (non-blocking).** The backend accepts 0, but the tap
  targets start at 0.5; 0 is reachable only through the accessibility
  decrement. Should sighted users be able to give 0 stars (for example a
  "0" chip or tapping the selected half again to clear)? The spec builds the
  0.5 minimum for touch until decided.
