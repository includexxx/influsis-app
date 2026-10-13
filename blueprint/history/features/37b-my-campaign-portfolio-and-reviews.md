# Current Feature

**Feature:** 37b. My campaign portfolio and reviews (backend 23b `CK3`, `reputation`; 23c `CK6`, `CK7`)

**Branch:** feature/my-campaign-portfolio-and-reviews

**Status:** verified

## Goal

The creator's own profile (`MyProfile`) shows their real rating and completed
project count, a "Campaign work" section of every completed campaign with a
Hide/Show toggle for the public profile, and a read-only "Reviews" section of
what businesses wrote about them.

## In scope

- `reputation` on the E4 public profile type; `CK3` (reviews received) in
  `creatorDirectoryApi`; `CK6` (own portfolio) and `CK7` (hide/show, optimistic)
  in `campaignFeedApi`.
- `MyProfile` stat strip: Rating from `reputation.averageRating`, Projects from
  `reputation.completedEngagements` (E4 `GET /creator-profiles/:ownUserId`).
- "Reviews" section from `CK3`.
- When the creator is not discoverable: no E4/CK3 calls, the note "Turn on
  discoverability to show your rating and reviews" in their place.
- "Campaign work" section from `CK6` with a Hide/Show toggle per entry.

## Out of scope

- 37c (other creators' and businesses' profiles, `CK4`/`CK5`, directory
  `reputation` on cards).
- A discoverability toggle on this screen (Edit Profile owns profile fields).
- Changing the "Response time" column (stays "—") or the self-reported
  `portfolio[]` grid (unchanged, kept separate from Campaign work).
- Any backend own-reviews read for non-discoverable creators (not planned).

## Build loop

`workflow.stepReview: "feature"`: build all steps with `npm run test` green
after each, then one review packet. `workflow.checkpointCommits: "disabled"`:
no per-step commits; `/complete` makes the feature commit. Run `npm run lint`
and Prettier on changed files before the packet.

## Build steps

- [x] **1. Types and API.** `scenes/creator/types/creatorDirectory.ts`: add
  `CreatorReputation { averageRating: number | null; reviewCount: number;
  completedEngagements: number }` and `reputation?: CreatorReputation` on
  `CreatorProfilePublic`, plus `ProfileReview` (CK3 row). In
  `creatorDirectoryApi`: `getCreatorReviewsPage({ userId, page, limit })` ->
  `GET /creator-profiles/:userId/reviews` (`skipAuth: true`, like E4),
  provides `{ type: 'CreatorReviews', id: userId }`. New
  `scenes/campaigns/types/portfolio.ts` (`PortfolioEntry`, `PortfolioPiece`).
  In `campaignFeedApi`: `getMyCampaignPortfolioPage({ page, limit })` ->
  `GET /me/campaign-portfolio`, provides `'CampaignPortfolio'`;
  `setPortfolioEntryHidden({ engagementId, hidden })` -> `PATCH
  /me/campaign-portfolio/:engagementId` with `{ hidden }`, optimistic via
  `onQueryStarted` + `updateQueryData` on every cached
  `getMyCampaignPortfolioPage` entry holding that engagement (undo on
  error), no tag invalidation on success (the server echo matches).
  **Done when** API tests assert each URL, method, params/body, that the
  optimistic flip shows in the cached page before the response, and that a
  `409` restores the previous value; tests pass.

- [x] **2. Display logic.** `scenes/profile/utils/reputation.ts`:
  `profileStats({ discoverable, reputation, isLoading })` -> `{ rating,
  ratingLabel, projects }` (`averageRating` -> e.g. "4.5" / label "Rating";
  `null` -> "New" / label "No ratings yet"; not discoverable, loading or no
  `reputation` -> "—"; projects = `completedEngagements` or "—").
  `scenes/profile/utils/campaignWork.ts`: `portfolioPieceView(piece,
  objective)` -> `{ label, link: string | null, privately: boolean }` (label
  via `scopeItemLabel`, custom pieces by `title`; `link` only for a
  `live_post` piece whose `livePostUrl` is http(s); a `file_link` piece or a
  missing URL -> `privately: true`), and `isHttpUrl`.
  **Done when** `reputation.test.ts` and `campaignWork.test.ts` cover every
  branch, including 0 as a real average ("0" not "New"), a non-http
  `livePostUrl`, and a custom piece title; tests pass.

- [x] **3. Stats and Reviews on MyProfile.** Read `account.id` from
  `useAuthSlice()`. When `profile.isDiscoverable`: E4
  `useGetCreatorProfileQuery({ userId })` for `reputation` and CK3 page 1
  (`limit` 10, "Show more" for the next page when a page came back full, via
  the exported paging hook, see Notes). Stat strip uses `profileStats`. New
  "Reviews" `Section` after Social platforms: rows with the existing
  `ReviewCard` (reviewer avatar via `resolveMediaUrl` or the default avatar,
  `displayName`, `rating`, `formatOfferDate(submittedAt)`, `message` as plain
  text) plus the campaign title; empty -> "No reviews yet. Reviews appear
  once a business's review of you is visible."; error -> inline "Couldn't
  load your reviews" with Try again; a `404` from E4 or CK3 -> the
  discoverability note. When not discoverable: skip both queries and show
  the note in the Reviews section; Rating and Projects show "—".
  **Done when** `MyProfile.test.tsx` (store gains the creator directory API,
  campaign feed API and auth reducers) covers: rating and projects from
  `reputation`; "New" with no ratings; reviews listed; empty reviews; a
  non-discoverable profile makes no E4/CK3 request and shows the note; an E4
  `404` shows the note; tests pass.

- [x] **4. Campaign work section.** New
  `scenes/profile/components/CampaignWorkCard.tsx` and a "Campaign work"
  `Section` after Reviews, reading CK6 page by page (same paging hook, "Show
  more"). Card: campaign cover (or a placeholder), title, business
  `displayName`, completed date, pieces (label; "View live post" opens
  `Linking.openURL` for an http(s) link; otherwise "Files delivered
  privately"), the business's `review` (stars + plain-text message) when
  present, and a `Toggle` "Show on public profile" (on = shown). A hidden
  entry renders at reduced opacity with "Hidden from your public profile".
  Toggling calls CK7; on error the optimistic change is undone and
  `Alert.alert("Couldn't update", message)` shows the backend message (`409`
  "Only completed campaigns are in your portfolio.", `404`, or the network
  message). The toggle is disabled while its request is in flight. Empty ->
  "Your completed campaigns will show up here."; error -> inline retry.
  Shown regardless of discoverability.
  **Done when** tests cover: entries render with their pieces (live link vs
  privately), toggling sends CK7 and dims the card, a `409` reverts and
  alerts, the empty state; full `npm run test` and `npm run lint` pass.

## Files / areas

- `scenes/creator/types/creatorDirectory.ts`, `scenes/creator/api/creatorDirectoryApi.ts` (+ test)
- `scenes/campaigns/types/portfolio.ts` (new), `scenes/campaigns/api/campaignFeedApi.ts` (+ test)
- `scenes/campaigns/hooks/useCampaignsFeed.ts` (export the paging hook)
- `scenes/profile/utils/reputation.ts`, `campaignWork.ts` (+ tests, new)
- `scenes/profile/MyProfile.tsx` (+ test), `scenes/profile/myProfile.style.ts`
- `scenes/profile/components/CampaignWorkCard.tsx` (new), `ProfileSections.tsx` only if a shared piece is needed

## Data / contracts

Source: `../backend/docs/features/campaign/implementations/CK_REVIEWS_AND_PORTFOLIO.md`.

- **E4 `reputation`** (`GET /creator-profiles/:userId`, public):
  `{ averageRating: number | null (0-5, one decimal), reviewCount: number,
  completedEngagements: number }`. `null` average = no visible reviews: "New",
  never 0 stars. Only visible, non-hidden reviews count. `404` when the
  creator isn't discoverable.
- **CK3** `GET /creator-profiles/:userId/reviews?page=&limit=` (public;
  default 10, max 50; newest first) -> rows `{ id, rating, message,
  submittedAt, reviewer { userId, displayName, handle | null, avatarUrl |
  null }, campaign { id, title } }`. Visible, non-hidden only. `404` exactly
  when E4 404s. "Former Influsis member" when the reviewer is gone.
- **CK6** `GET /me/campaign-portfolio?page=&limit=` (Bearer,
  `campaign.apply`; default 10, max 50; newest `completedAt` first; `[]` when
  none; not affected by discoverability) -> `PortfolioEntry { engagementId,
  completedAt, hidden: boolean, campaign { id, title, objective
  ('ugc_content' | 'brand_awareness' | null), coverUrl | null }, business {
  userId, displayName, handle | null, avatarUrl | null }, pieces:
  PortfolioPiece[], review: { rating, message, submittedAt } | null }`.
  `PortfolioPiece { platform, type, title | null, finalKind ('file_link' |
  'live_post'), livePostUrl | null }`; a UGC file link is never returned.
- **CK7** `PATCH /me/campaign-portfolio/:engagementId` `{ hidden: boolean }`
  -> `200` the updated entry. Repeating the current value is a `200` no-op.
  Errors in order: `422 VALIDATION_FAILED` (`errors.hidden`), `404` (not this
  creator's engagement), `409 CONFLICT` "Only completed campaigns are in your
  portfolio." Hiding never removes the review from CK3, and hidden entries
  still count in `completedEngagements`.
- The creator's own user id comes from the session (`useAuthSlice().account.id`);
  the server authorizes CK6/CK7 from the bearer token, never from a client id.

## Testing

`npm run test` (Jest + RNTL); no Verify command. The full suite last passed
at `00e165e` (1053 tests, the pre-commit hook in this session). New tests:
API (step 1), stats and piece logic (2), MyProfile stats/reviews (3),
Campaign work and toggle (4). No live backend, device or visual evidence is
claimed.

## Notes for the AI

- Paging: export `useCampaignFeedPages` from
  `scenes/campaigns/hooks/useCampaignsFeed.ts` (it already accumulates pages
  and detects the last page by a short page) and drive "Show more" with its
  `loadMore`/`hasMore`, like `BusinessCampaignsSection`. Page size 10
  (`CAMPAIGNS_FEED_PAGE_SIZE`).
- The optimistic CK7 patch must update the page caches the hook reads
  (`currentData`), which the hook re-merges into its page list.
- Review and portfolio messages are user text: `<Text>` only, never
  `RichText`. Open only http(s) live-post URLs.
- `MyProfile` is behind the auth gate, so `account` is set; if it is
  somehow null, skip E4/CK3 and show "—".
- `signOut` resets only `profilesApi` today; leave that as is (not this
  feature).

## Open questions

None blocking. Decided here (reversible): "New - no ratings yet" renders as
value "New" with the label "No ratings yet"; Projects shows "—" when the
creator isn't discoverable (E4 is the only source of `completedEngagements`).
