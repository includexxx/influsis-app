# Current Feature

## 25. Deliver the work

**Type:** Feature
**Status:** verified
**Branch:** feature/25-deliver-the-work

### Implementation notes (deviations from the spec, all recorded here)

- **Routes.** Expo Router already pairs `campaign/[id].tsx` with
  `campaign/[id]/apply.tsx`, so `engagement/[id]/deliverables.tsx` and
  `…/deliverables/[pieceId].tsx` sit beside the existing Offer route without
  moving it.
- **Navigation helper.** `scenes/campaigns/utils/openDeliverables.ts` is
  shared by the Offer screen, Live Campaigns and Home. `JoinedCampaignCard` /
  `ActiveCampaignsSection` now pass the whole engagement to `onPress`, not
  the campaign id. Home's other `onCampaignPress` (the Campaigns list) still
  opens campaign details.
- **Dispatch type.** `submitDeliverable.ts` also exports
  `invalidateAfterSubmit(dispatch, engagementId)`, typed with
  `Dispatch` from `@/utils/store` (this repo's name).
- **Styles.** One shared `deliverables.style.ts` serves both screens.
- **Test counts:**
  - `utils/deliverables.test.ts`: 11;
  - API: +4;
  - `DeliverablesScreen.test.tsx`: 6;
  - `DeliverablePieceScreen.test.tsx`: 7;
  - `OfferScreen.test.tsx`: +2;
  - `ActiveCampaignsSection.test.tsx`: updated for the new callback.

  The full suite is 801/801 (152 suites), and lint has 0 errors.

### Goal

Let the creator deliver what they agreed to, and follow the business's
review. Once an engagement is accepted, backend 18e/18l creates one
deliverable piece for each unit of the negotiated scope. The creator can:

- see those pieces (`CI1`);
- submit each one as an image upload or a link, with an optional caption
  (`CI2`);
- read the business's change request and resubmit;
- record the live post URL once a piece is approved (`CI4`).

When the business approves the last piece, the engagement shows as
completed. No copy says "paid", because there is no escrow until backend
item 19.

### In scope

- Types for `CI1`/`CI2`/`CI4`, plus pure helpers with Jest tests.
- API:
  - `getEngagementDeliverables` (`CI1`) and `recordPosted` (`CI4`) on
    `campaignFeedApi`;
  - `submitDeliverable` (`CI2`) through `request()`: multipart for an image
    (the same approach as `services/mediaUpload.ts`), JSON for a link. It
    invalidates the deliverables and engagement tags afterwards.
- **Deliverables screen** (`app/(details)/engagement/[id]/deliverables.tsx`):
  - a campaign title and a "View campaign" link;
  - the engagement status, with a "Completed — all deliverables approved"
    banner;
  - one row per piece (label · piece number, status badge, due date with an
    "Overdue" flag, revisions left);
  - loading, empty and error+Retry states.
- **Piece screen** (`app/(details)/engagement/[id]/deliverables/[pieceId].tsx`):
  - the submission history, newest first: revision, date, "Late" tag,
    content (a link, or an "Uploaded image" tile), caption, and the
    business's decision and reason;
  - status-dependent actions:
    - Submit or Resubmit, choosing **Upload image** or **Share link**, with
      an optional caption;
    - "In dispute" for an escalated piece, with no actions;
    - "Approved", plus a **Live post link** form.
- Entry points:
  - the Offer screen shows **Deliver work** when the engagement is
    `accepted` or `completed`;
  - Live Campaigns rows and Home's Active Campaigns rows open that
    engagement's Deliverables screen instead of the campaign details (the
    Deliverables screen links to the campaign).

### Out of scope

- Work-progress steps (`CH1`/`CH2`), escrow and payouts, disputes, messaging.
- The mock `Order` tab (`scenes/order`, `data/orders.ts`), for both campaigns
  and gigs. It stays as it is; wiring it is a later item.
- Uploading video. `CI2`'s file part accepts images only (JPEG/PNG/GIF/WebP);
  videos are delivered as links.
- Previewing a submitted image. The backend returns only `mediaId`.

### Build loop

`workflow.stepReview: "feature"`, `checkpointCommits: "disabled"`: build all
steps in order, verifying each, then hand over **one** review packet.
`/complete` makes the single feature commit.

Branch `feature/25-deliver-the-work` from `feat/campaign-negotiation` (which
holds items 23-24). The user's untracked `docs/implementations/` travels in
the working tree: never stage or discard it.

### Build steps

- [x] **1. Types + pure helpers.**
  - New `scenes/campaigns/types/deliverables.ts`: - `DeliverablePieceStatus` (7 values) and `DeliverableSubmissionStatus`
    (5); - `DeliverableSubmission`; - `DeliverablePiece` (with `scopeItemId`, nullable `deliverableId`,
    `revisionsRemaining`, `submissions[]`); - `SubmitDeliverableArgs`: `{ engagementId, pieceId, caption? }` plus
    either `{ kind: 'link', externalUrl }` or `{ kind: 'image', image:
PickedImageAsset }`; - `RecordPostedArgs`.
  - New `scenes/campaigns/utils/deliverables.ts`:
    - `PIECE_STATUS_BADGE` (label and colours per status, in the style of
      `OfferScreen`'s `STATUS_BADGE`);
    - `canSubmitPiece(status)`: the backend's `canSubmitToDeliverable`, i.e.
      not `approved`, `escalated` or `cancelled`;
    - `latestChangeRequest(piece)`: the newest `changes_requested` reason, or
      `null`;
    - `isOverdue(dueDate, now)` (`now` is a parameter);
    - `validateSubmission({ kind, externalUrl, image, caption })`: a link
      must be `http(s)://` and at most 2048 chars; an image is required in
      image mode; the caption is at most 2000;
    - `validateLivePostUrl(url)`: `http(s)://`, at most 2048;
    - `pieceTitle(piece)`: "Instagram Reels · 2", reusing `scopeItemLabel`.

  **Done when:** `utils/deliverables.test.ts` covers the submit gating for
  all 7 statuses, the latest change request (none, several), both sides of
  the overdue check, each validation branch, and the title. `npm run test`
  passes.

- [x] **2. API.** In `scenes/campaigns/api/campaignFeedApi.ts` add:
  - a `Deliverables` tag;
  - `getEngagementDeliverables({ engagementId })`
    (`GET /engagements/:id/deliverables`), providing
    `Deliverables:<engagementId>`;
  - `recordPosted({ engagementId, pieceId, livePostUrl })`
    (`POST /engagements/:id/deliverables/:pieceId/posted`), invalidating
    that tag.

  New `scenes/campaigns/api/submitDeliverable.ts` exports
  `submitDeliverable(args)`, which calls
  `POST /engagements/:id/deliverables/:pieceId/submissions` through
  `request()`:
  - an **image** is sent as `FormData` (a `file` part `{ uri, name, type }`,
    plus `caption` when set) with `Content-Type: multipart/form-data`;
  - a **link** is sent as JSON `{ externalUrl, caption? }`.

  Callers then dispatch
  `campaignFeedApi.util.invalidateTags([{ type: 'Deliverables', id }, { type: 'MyEngagement', id }])`.
  First confirm the engagement tag name used by `getMyEngagement`.
  **Done when:** API tests show the three request shapes (URL, method, body
  and headers) and the tag invalidation. `npm run test` passes.

- [x] **3. Deliverables screen.** Add
      `app/(details)/engagement/[id]/deliverables.tsx` →
      `scenes/campaigns/DeliverablesScreen.tsx` (+ `deliverablesScreen.style.ts`).
      It is reached with `id` and an optional `title` param, the same way the
      Offer screen gets its title.
  - It reads `useGetMyEngagementQuery` (status) and
    `useGetEngagementDeliverablesQuery`.
  - Each piece row shows `pieceTitle`, a `StatusBadge`, "Due {date}" with an
    "Overdue" flag (only while submittable), and "{n} revisions left".
    Tapping a row pushes `/engagement/{id}/deliverables/{pieceId}`.
  - Status handling:
    - a completed engagement shows a success banner: "All deliverables
      approved. This campaign is complete.";
    - an empty list reads "No deliverables yet. They appear once the offer
      is accepted.";
    - a load error shows `CampaignsEmptyState` error with Retry;
    - a `404` redirects back.

  **Done when:** `DeliverablesScreen.test.tsx` (RNTL, mocked `request`)
  shows the rows and their statuses, the completed banner, the empty state,
  the error+Retry, and navigation on tap. `npm run test` passes.

- [x] **4. Piece screen: submit & resubmit.** Add
      `app/(details)/engagement/[id]/deliverables/[pieceId].tsx` →
      `scenes/campaigns/DeliverablePieceScreen.tsx` (+ style). It reads the same
      `CI1` query and picks the piece by id; an unknown id shows a not-found
      state.
  - A header shows the piece title, status badge, due date and revisions
    left.
  - When the status is `changes_requested`, a highlighted card shows "The
    business asked for changes:" with the latest reason as plain text.
  - When `canSubmitPiece`, a form offers:
    - a two-option toggle, **Upload image** (`expo-image-picker`, images
      only, the same permission flow as `ImageUploader`, with a thumbnail of
      the picked local file) or **Share link** (a URL `TextField`);
    - an optional caption (≤2000);
    - **Submit**, or **Resubmit** when there are earlier submissions.

    It validates with `validateSubmission`, calls `submitDeliverable`, and
    on success clears the form, shows "Submitted for review" and refetches.

  - Errors:
    - `409 DELIVERABLE_NOT_SUBMITTABLE`: the server message plus a refetch;
    - `422`: field errors on `externalUrl` / `caption` / `file` (for
      example "unsupported image type");
    - any other error: "Couldn't submit. Please try again."
  - The submission history is shown newest first. Captions and reasons are
    plain `Text`. A link opens with `Linking.openURL` only when it is
    `http(s)`. An image submission shows a tile, "Uploaded image".

  **Done when:** `DeliverablePieceScreen.test.tsx` shows:
  - a link submit sends JSON;
  - an image submit sends multipart (with `expo-image-picker` mocked);
  - validation blocks a bad URL or a missing image;
  - the change-request reason is shown;
  - a `409` message appears.

  `npm run test` passes.

- [x] **5. Piece screen: escalated, approved & live post.** In
      `DeliverablePieceScreen`:
  - an **escalated** piece shows "In dispute — the business requested
    changes three times. Disputes aren't available yet." and no form;
  - a **cancelled** piece shows "Cancelled";
  - an **approved** piece shows "Approved on {date}", then a **Live post
    link** form: a URL field pre-filled with the current `livePostUrl` when
    one exists, and "Save link", which calls `CI4`. It validates with
    `validateLivePostUrl`, shows a `409` "not approved yet" message, and on
    success shows "Live post saved".

  **Done when:** tests cover the escalated notice (no form), the approved
  state with the live-post save request, and the invalid-URL message.
  `npm run test` passes.

- [x] **6. Entry points.**
  - `OfferScreen`: when `data.status` is `accepted` or `completed`, show a
    **Deliver work** button (`testID="offer-deliver-work"`) that pushes
    `/engagement/{id}/deliverables` with `title`.
  - `JoinedCampaignCard`: `onPress` receives the engagement, not just the
    campaign id. `LiveCampaign.tsx` and `home/components/ActiveCampaignsSection.tsx`
    push `/engagement/{engagement.id}/deliverables?title=…`.
  - Update their tests where they assert navigation.

  **Done when:** `OfferScreen.test.tsx` shows the button only for
  accepted/completed; the Live Campaign and Active Campaigns tests (and the
  `JoinedCampaignCard` test) assert the new route. `npm run test` passes.

- [x] **7. Docs + verify.**
  - Add `docs/screen/deliverables/README.md` (both screens: sections,
    actions and endpoints, states), following `docs/screen/offer/README.md`.
    Update the Live Campaigns and Offer docs for the new navigation.
  - Add a paragraph to `../platform-context/integration/backend-mobile.md`
    listing `CI1`/`CI2`/`CI4` and the no-preview gap. That repo is separate;
    leave it uncommitted.
  - `npm run lint` and `npm run test` pass.

  **Done when:** both commands pass, with output recorded in the review
  packet.

### Files / areas

- New:
  - `scenes/campaigns/types/deliverables.ts`;
  - `utils/deliverables.ts` (+ test);
  - `api/submitDeliverable.ts`;
  - `DeliverablesScreen.tsx` / `DeliverablePieceScreen.tsx` (+ styles and
    tests);
  - `app/(details)/engagement/[id]/deliverables.tsx` and
    `…/deliverables/[pieceId].tsx`;
  - `docs/screen/deliverables/README.md`.
- Changed:
  - `scenes/campaigns/api/campaignFeedApi.ts` (+ test);
  - `OfferScreen.tsx` (+ test);
  - `components/JoinedCampaignCard.tsx`;
  - `LiveCampaign.tsx`;
  - `scenes/home/components/ActiveCampaignsSection.tsx` (+ their tests).
- **Route check.** `app/(details)/engagement/[id].tsx` already exists. Add
  `engagement/[id]/deliverables.tsx` beside it, and first confirm Expo
  Router accepts both a `[id].tsx` file and an `[id]/` folder. If it
  doesn't, move the Offer route to `engagement/[id]/index.tsx` in the same
  step.
- `../platform-context/integration/backend-mobile.md`

### Data / contracts

Backend 18g/18h/18m (`platform-context/api-contracts/campaigns.md` Group CI):

- **`GET /engagements/:id/deliverables` (`CI1`).** Party only (404
  otherwise). It returns pieces, each with:
  - `id`, `scopeItemId`, `deliverableId|null`, `platform`, `type`,
    `pieceNo`;
  - `status` ∈ `pending|in_progress|submitted|changes_requested|approved|escalated|cancelled`;
  - `dueDate` (date or null), `revisionCount`, `rejectionCount`,
    `revisionsRemaining`;
  - `escalatedAt`, `approvedAt`;
  - `submissions[]`, ordered by `revisionNo` ascending. Each has `id`,
    `revisionNo`, `submittedAt`, `isLate`, `mediaId|null`,
    `externalUrl|null`, `caption`, `livePostUrl`, `postedAt`, `status`,
    `reviewDecision`, `reviewReason`, `reviewedAt` and `reviewDueAt`.
- **`POST /engagements/:id/deliverables/:pieceId/submissions` (`CI2`).**
  Creator only.
  - Body: either a multipart `file` part (JPEG/PNG/GIF/WebP) or
    `externalUrl` (`http(s)`, ≤2048), never both. `caption?` is ≤2000.
  - A late submission is allowed and flagged `isLate`.
  - Returns `201` with the submission.
  - Errors:
    - `409 DELIVERABLE_NOT_SUBMITTABLE` (the piece is approved, escalated
      or cancelled);
    - `422` (`externalUrl` required or not applicable, or an unsupported
      image type on `file`);
    - `404`.
- **`POST /engagements/:id/deliverables/:pieceId/posted` (`CI4`).** Creator
  only.
  - Body: `{ livePostUrl }` (`http(s)`, ≤2048).
  - Returns `200` with the submission.
  - Errors: `409` "This deliverable has not been approved yet.", `404`.

Rules the UI must hold:

- It must never say "paid" or "payment released". There is no escrow.
- It must not show or count down `reviewDueAt` as an auto-release.
- Captions, review reasons and URLs render as plain `Text`. Only `http(s)`
  links open, via `Linking.openURL`.

### Testing

- **Unit (Jest):** `utils/deliverables.test.ts`, and the API tests.
- **Screen (RNTL):** `DeliverablesScreen.test.tsx` and
  `DeliverablePieceScreen.test.tsx`, plus the entry-point test updates.
  `expo-image-picker` is mocked, as in `ImageUploader.test.tsx`.
- **Gates:** `npm run lint`, `npm run test`. No dev server.
- **Manual path** (backend on `feat/campaign-negotiation`, with the
  engagement accepted on web):
  1. Live Campaigns → the engagement → Deliverables → a piece. Share a link:
     it shows "Awaiting review", and web's Delivery tab lists it.
  2. The business requests changes on web. The reason appears here, and
     Resubmit works.
  3. The business approves. "Approved" appears; save the live post link.

### Notes for the AI

- Reuse `ScreenHeader`, `StatusBadge`, `Button`, `TextField`,
  `CampaignsEmptyState`, the theme tokens and the `*.style.ts` convention.
- Handle the multipart upload the way `services/mediaUpload.ts` does. RTK
  Query's base query can't override the content type.
- Keep `OfferScreen`'s negotiation behaviour untouched. Only add the
  button.
- Format only the files you touch.
