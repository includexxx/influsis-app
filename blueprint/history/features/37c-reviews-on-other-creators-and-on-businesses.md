# Current Feature

**Feature:** 37c. Reviews on other creators and on businesses (backend 23b `CK3`, `CK4`; 23c `CK5`, E1/E3 `reputation`)

**Branch:** feature/reviews-on-other-creators-and-on-businesses

**Status:** verified

## Goal

A creator can judge other creators and businesses by real reputation: a
creator's public profile shows their rating, completed projects, reviews and
Campaign work; a business's page shows its rating summary and the reviews
creators wrote; the Top Creators and Businesses directory cards show the
rating brief.

## In scope

- Types and API: `reputation` on E1/E3 directory rows (brief) and E2 business
  profile (full); `CK4` (business reviews) in `businessDirectoryApi`; `CK5`
  (public Campaign work) in `creatorDirectoryApi`.
- Make 37b's review list and Campaign work list reusable (read-only mode,
  tappable reviewers) and keep My Profile working on them.
- `CreatorProfile`: Rating and Projects from E4 `reputation`, a "Reviews"
  section (`CK3`), a read-only "Campaign work" section (`CK5`).
- `BusinessDetails`: a rating summary (E2 `reputation`) and a "Reviews from
  creators" section (`CK4`).
- `CreatorDirectoryCard` and `BusinessCard`: the `{ averageRating,
  reviewCount }` brief.

## Out of scope

- Writing or moderating reviews, notifications, the business side (`web`).
- A "see all reviews" screen (lists page in place with "Show more").
- The "Member since" column and the self-reported portfolio grid on
  `CreatorProfile` (unchanged).
- Sorting or filtering the directories by rating.

## Build loop

`workflow.stepReview: "feature"`: build every step with `npm run test` green
after each, then one review packet. `workflow.checkpointCommits: "disabled"`:
no per-step commits; `/complete` makes the feature commit. Run `npm run lint`
and Prettier on changed files before the packet.

## Build steps

- [x] **1. Types and API.** `ReputationBrief { averageRating: number | null;
  reviewCount: number }`; `reputation?: ReputationBrief` on
  `CreatorDirectoryItem` and `BusinessDirectoryItem`; `reputation?:
  CreatorReputation` (the full shape from 37b, moved to a shared spot or
  re-exported) on `BusinessProfilePublic`. `PublicPortfolioEntry =
  Omit<PortfolioEntry, 'hidden'>`. `businessDirectoryApi.getBusinessReviewsPage({
  userId, page, limit })` -> `GET /business-profiles/:userId/reviews`
  (`skipAuth`), rows typed `ProfileReview`.
  `creatorDirectoryApi.getCreatorCampaignPortfolioPage({ userId, page, limit
  })` -> `GET /creator-profiles/:userId/campaign-portfolio` (`skipAuth`).
  **Done when** API tests assert URL, params and no bearer for both; tests
  pass.

- [x] **2. Reusable lists and display logic.** Turn
  `scenes/profile/components/MyReviewsSection.tsx` into a generic
  `ReviewsList` (props: the page query hook, its args, `emptyText`,
  `reviewer: 'business' | 'creator'`) and `CampaignWorkSection.tsx` into
  `CampaignWorkList` (query hook, args, `emptyText`, `editable`);
  `CampaignWorkCard` gains `editable` (no toggle row and no "hidden" styling
  when false; `entry.hidden` optional). A reviewer row is tappable only when
  `handle` is non-null and opens `/business/:userId` or `/creator/:userId`
  (a "Former Influsis member" or non-discoverable reviewer has `handle: null`
  and is plain). New `scenes/profile/utils/reputation.ts` helpers:
  `reputationBrief(brief)` -> `{ text, accessibilityLabel }` ("4.5 (12)" /
  "Rated 4.5 from 12 reviews"; `averageRating: null` -> "New" / "No ratings
  yet"; `reviewCount` 1 -> "review"), `reviewerHref(reviewer, kind)`. My
  Profile keeps its copy (its own empty text, `editable` Campaign work).
  **Done when** tests cover `reputationBrief` (incl. 0 average, 1 review,
  null), `reviewerHref` (handle null -> null), a tappable vs plain reviewer
  row, and the read-only card (no toggle); the existing `MyProfile.test.tsx`
  still passes unchanged in behavior.

- [x] **3. Creator profile.** `CreatorProfile` stat strip: Rating and
  Projects via `profileStats({ discoverable: true, reputation })` (a public
  profile exists only while discoverable; no `reputation` -> "—"). After
  Social platforms: "Reviews" (`ReviewsList` on CK3, reviewer `business`,
  empty "No reviews yet.") and "Campaign work" (`CampaignWorkList` on CK5,
  read-only, empty "No campaign work to show yet."). Both lists show their
  own inline error with Try again; CK3/CK5 404 only when E4 does, which the
  screen already redirects.
  **Done when** `CreatorProfile.test.tsx` (mocks routed by URL) covers
  rating/projects from `reputation`, "New", reviews with a tappable business
  reviewer, a "Former Influsis member" that isn't tappable, Campaign work
  without a toggle, and the empty states; tests pass.

- [x] **4. Business details.** Under the name/description: a rating summary
  from E2 `reputation` - stars + "4.5 · 12 reviews · 14 campaigns completed"
  (`completedEngagements`), or "New - no ratings yet" (still showing the
  completed count) when `averageRating` is null; nothing when `reputation`
  is absent. After the "Ongoing Campaign" section: "Reviews from creators"
  (`ReviewsList` on CK4, reviewer `creator`, empty "No reviews from creators
  yet."), styled with the screen's existing `sectionTitle`.
  **Done when** a new `scenes/business/BusinessDetails.test.tsx` covers the
  summary, "New", a missing `reputation`, the reviews list and its empty
  state; tests pass.

- [x] **5. Directory cards.** `CreatorDirectoryCard` and `BusinessCard`
  (both `stack` and `grid`) show a star with `reputationBrief(...).text` in
  the meta area when `reputation` is present, and include its
  `accessibilityLabel` in the card's label; nothing when absent.
  **Done when** card tests (in `TopCreators.test.tsx` / `Businesses.test.tsx`
  or new card tests) cover "4.5 (12)", "New", and absent; full `npm run test`
  and `npm run lint` pass.

## Files / areas

- `scenes/creator/types/creatorDirectory.ts`, `scenes/creator/api/creatorDirectoryApi.ts` (+ test)
- `scenes/business/types/businessDirectory.ts`, `scenes/business/api/businessDirectoryApi.ts` (+ test)
- `scenes/campaigns/types/portfolio.ts`
- `scenes/profile/components/` (`ReviewsList`, `CampaignWorkList`, `CampaignWorkCard`), `scenes/profile/utils/reputation.ts` (+ tests), `scenes/profile/MyProfile.tsx`
- `scenes/creator/CreatorProfile.tsx` (+ test)
- `scenes/business/BusinessDetails.tsx` (+ new test), `scenes/business/businessDetails.style.ts`
- `scenes/creator/components/CreatorDirectoryCard.tsx`, `scenes/business/components/BusinessCard.tsx` (+ tests)

## Data / contracts

Source: `../backend/docs/features/campaign/implementations/CK_REVIEWS_AND_PORTFOLIO.md`.
All reads here are public (`skipAuth`), except the directories E1/E3 which
already require a bearer.

- **Reputation, single profile** (E2 `GET /business-profiles/:userId`, E4
  `GET /creator-profiles/:userId`): `{ averageRating: number | null,
  reviewCount, completedEngagements }`. For a business,
  `completedEngagements` counts completed engagements across its campaigns.
  `null` average: "New - no ratings yet", never 0 stars.
- **Reputation, directory rows** (E1 `GET /business-profiles`, E3 `GET
  /creator-profiles`): `{ averageRating: number | null, reviewCount }`.
- **CK3** `GET /creator-profiles/:userId/reviews` and **CK4** `GET
  /business-profiles/:userId/reviews`: `?page=&limit=` (default 10, max 50),
  newest first, visible non-hidden only; rows `{ id, rating, message,
  submittedAt, reviewer { userId, displayName, handle | null, avatarUrl |
  null }, campaign { id, title } }`. CK4 404s for an unknown id or a
  non-business; CK3 exactly when E4 404s. Reviewer fallbacks: gone account
  -> "Former Influsis member" with `handle`/`avatarUrl` null; a
  non-discoverable creator reviewer keeps name and avatar but `handle: null`.
- **CK5** `GET /creator-profiles/:userId/campaign-portfolio?page=&limit=`:
  the non-hidden entries, `PortfolioEntry` without `hidden`; `404` exactly
  when E4 404s.
- Messages are plain text: `<Text>` only. Live-post links open only for
  http(s) (`portfolioPieceView`, 37b).

## Testing

`npm run test` (Jest + RNTL); no Verify command. The full suite last passed
at `ed6509d` (1078 tests, the pre-commit hook in this session). New tests per
step as listed. No live backend, device or visual evidence is claimed.

## Notes for the AI

- Keep 37b's behavior on My Profile byte-for-byte in copy and test IDs where
  possible (`my-profile-review-*`, `campaign-work-*`), passing them in as
  props/prefixes if the generic components need different IDs per screen.
- `profileStats` (37b) already maps `reputation` to the Rating/Projects
  columns; reuse it on `CreatorProfile`.
- Routes: `app/(details)/creator/[id]` and `app/(details)/business/[id]`
  exist (`router.push('/creator/' + id)` / `'/business/' + id`).
- CK3 and CK5 are mounted only after E4 has loaded (the profile screen
  renders them in its content), so a hidden profile never calls them.

## Open questions

None blocking. Decided here (reversible): the card brief reads "4.5 (12)";
reviewer rows are tappable only with a non-null `handle`; Business Details
shows its reviews after "Ongoing Campaign".
