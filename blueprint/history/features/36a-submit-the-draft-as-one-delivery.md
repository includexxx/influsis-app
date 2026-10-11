# Current Feature

**Branch:** `feature/submit-the-draft-as-one-delivery`

**Status:** verified

Build-plan item **36a. Submit the draft as one delivery (backend 18r1, 18r3)**,
the first half of item 36.

## Goal

A creator delivers every piece of an accepted engagement together as one
**draft round**. The business reviews the round as a whole.

- **Deliverables screen:** shows the delivery's stage and what to do next.
- **"Submit delivery" screen:** collects a link or an image (plus an optional
  caption) for every piece and sends them in one request.
- **After changes are requested:** the creator sees the business's reason and
  per-piece comments, keeps unchanged pieces without re-uploading, and sees
  how many revisions are left.
- **Escalated deliveries:** shown as "In dispute" with no actions.

This replaces item 25's per-piece submit flow. The backend already returns
`404` for it (`CI2`/`CI3`/`CI4`), and 18r3 removed the per-piece counters the
app still reads.

## In scope

- **Delivery read:** `GET /engagements/:id/delivery` becomes the source of
  the stage, budgets, escalation, pieces and rounds.
- **Deliverables screen**, reworked per stage:
  - `awaiting_draft`:
    - copy "Deliver every piece together as one draft."
    - primary **Submit delivery** button
  - `draft_in_review`:
    - info banner "Draft submitted. Waiting for the business's review."
    - the round's submitted date
    - no actions
  - `draft_changes_requested`:
    - warning card "The business asked for changes" with the round's
      `reviewReason`
    - `formatRevisionsLeft(revisionsRemaining)`
    - primary **Submit revised draft** button
  - `awaiting_final`, `final_in_review`, `final_changes_requested`:
    - read-only banner "Draft approved. Final delivery is coming soon."
    - no actions; 36b replaces this
  - `delivered`:
    - success banner "Delivered. This campaign is complete."
    - never "paid"
  - `escalated`:
    - error card "In dispute" with the copy below and "Disputes aren't
      available yet."
    - no actions
  - `null` (not in delivery): today's empty state
- **Escalation copy**, from the engagement's counts:
  - `finalChangeRequests >= 2`: "The business requested changes to the final
    delivery twice."
  - else `draftChangeRequests >= 3`: "The business requested changes to the
    draft {n} times."
  - else (for example a legacy conversion): "This delivery was escalated to a
    dispute."
  - The server's `escalationReason` is internal wording and is not shown.
- **Piece rows:**
  - list `delivery.pieces` (title, status badge, due date, "Overdue")
  - drop the per-piece "revisions left"
  - tapping a row still opens the piece screen
- **New Submit delivery screen** (`(details)/engagement/[id]/submit-delivery`),
  one slot per non-cancelled piece. Each slot shows:
  - the piece title and its due date
  - in `draft_changes_requested`, the business's `reviewComment` for that
    piece, from the latest round
  - a source choice:
    - **Keep previous** (`reuseItemId` = the piece's item in the latest
      round). Offered and selected by default only when a previous round
      exists. A previous image shows as "Uploaded image", since there is no
      URL to preview.
    - **Link** (http(s), ≤ 2048)
    - **Image** (picked with `expo-image-picker`, then uploaded with
      `POST /media` on submit)
  - an optional caption (≤ 2000). With Keep previous, the old caption is the
    placeholder, and an empty caption keeps it.
  - hint copy: "Videos are shared as links."
- **Submitting:**
  - Submit stays disabled until every slot is valid.
  - On submit, upload the picked images, then send one
    `POST /engagements/:id/delivery/rounds`.
  - On success, go back to the Deliverables screen, which now shows
    `draft_in_review`.
  - The screen is usable only in `awaiting_draft` and
    `draft_changes_requested`. In any other stage it shows a short "Nothing
    to submit right now" state with Back.
- **Errors:**
  - `409`: show the server message in a banner and refetch the delivery.
  - `422`: put `items[i]`, `items[i].pieceId|mediaId|reuseItemId|externalUrl`
    and `items[i].caption` on slot `i`, and `items` on the form.
  - Upload `413`/`422`: "That image is too large (max 5 MB)." or "That image
    type isn't supported." on its slot. Nothing is sent.
  - Network or anything else: a generic banner.
- **Piece screen** (`(details)/engagement/[id]/deliverables/[pieceId]`)
  becomes **read-only**. It keeps the hero, status, due date, "Overdue", the
  latest change request and the submission history (`CI1`), and adds a hint
  to submit from the Deliverables screen. It loses:
  - the submit form (`CI2`)
  - the live-post form (`CI4`, also a `404` now)
  - the per-piece escalation notice and the revisions chip
- **Cleanup:**
  - delete `api/submitDeliverable.ts` and the `recordPosted` endpoint
  - delete the CI2/CI4 types and schemas
  - remove the five 18r3 fields from `DeliverablePiece`
  - remove `escalated` from `DeliverablePieceStatus`
  - remove `formatEscalationReason(rejectionCount)` (the previous fix's
    helper; its data is gone)
- **Docs:** `docs/screen/deliverables/README.md` (Deliverables and Piece
  sections), plus a short section for Submit delivery.

## Out of scope

- **36b: the final round.**
  - submitting in `awaiting_final` / `final_changes_requested`
  - `finalKind` link rules and live-post host checks
  - final revisions
  - "Delivered" reached through the app's own final flow (the `delivered`
    banner here only reflects the server)
- Disputes (backend item 20; no endpoint), escrow and payment copy.
- The business review (`web`).
- Video upload: drafts take links.
- Reusing items from before the latest round, such as superseded legacy
  per-piece submissions.
- Notifications.

**Note on the plan wording:** dropping `CI4` "record posted" is listed under
36b in the build plan. 36a removes its UI and endpoint because the piece
screen turns read-only and the call already returns `404`. 36b still owns
recording live posts, as Brand Awareness final items.

## Build loop

`workflow.stepReview: "feature"`, `checkpointCommits: "disabled"`:

- Build all steps in order, each leaving the app working with its tests
  green.
- Then present one review packet for the whole feature.
- No checkpoint commits. `/complete` makes the single feature commit.
- Branch from the current `feat/campaign-negotiation` tip.
- Run Prettier only on the files you change. Never run the repo-wide
  `npm run format`.

## Build steps

- [x] **1. Delivery types, API and pure helpers**
  - **Types:** new `scenes/campaigns/types/delivery.ts` holding:
    - `DeliveryStage`, `DeliveryPhase`, `DeliveryRoundStatus`
    - `DeliveryPiece`, `DeliveryRoundItem`, `DeliveryRound`,
      `EngagementDelivery`
    - `SubmitRoundItem`, `SubmitRoundArgs`, `SubmitRoundResult` (round +
      `meta`)

    Field lists are under Data / contracts.
  - **API** (`api/campaignFeedApi.ts`):
    - Add the tag `'Delivery'`.
    - `getEngagementDelivery` query (`GET /engagements/:id/delivery`).
    - `submitDeliveryRound` mutation (`POST .../delivery/rounds`, JSON). On
      success it invalidates `Delivery`, `Deliverables` and `MyEngagement`
      for that id. Nothing is invalidated on error.
  - **Media upload:** add `uploadMediaImage(asset)` to
    `services/mediaUpload.ts`, returning the `POST /media` response `id`
    (the round's `mediaId`). `uploadPickedImage` keeps returning `key`.
  - **Pure helpers** (new `scenes/campaigns/utils/delivery.ts`):
    - `latestRound(delivery)` (the newest final, else the newest draft)
    - `deliveryStatusView(delivery)`: banner kind, title, body, CTA label or
      none, and whether the creator can submit (`awaiting_draft` |
      `draft_changes_requested` in 36a)
    - `escalationCopy(delivery)`
    - `initialSlots(delivery)`: one slot per non-cancelled piece, Keep
      previous pre-selected when the latest round has an item for the piece
    - `validateSlot(slot)`: reuses `validateSubmission`'s link, image and
      caption rules
    - `toRoundItems(slots, mediaIds)`: builds the `items[]` body. Exactly
      one of `mediaId` / `externalUrl` / `reuseItemId`; `caption` trimmed
      and sent only when non-empty.
    - `roundErrorsFromApi(errors, slotCount)`: maps `items[i]…` keys to
      `{ slots: Record<number, string>, form: string | null }`, first
      message per slot
  - **Tests:** `delivery.test.ts` and API tests in `campaignFeedApi.test.ts`
    (URLs, bodies, tags), plus `mediaUpload.test.ts` for
    `uploadMediaImage`.
  - **Done when:** `npm run test` passes. Nothing user-facing changes yet.

- [x] **2. Deliverables screen on the delivery read**
  - `DeliverablesScreen.tsx` reads `getEngagementDelivery`.
    - **Loading:** skeleton. **Error:** the empty state with Retry.
    - **`404`:** redirect to `/live-campaign`, as today.
  - The hero status, banner/card and CTA come from `deliveryStatusView`.
  - The CTA pushes `/engagement/[id]/submit-delivery` with `id` and `title`.
  - **Rows** come from `delivery.pieces`:
    - keep the title, badge, due date and "Overdue"
    - drop "revisions left"
    - the progress bar counts `approved` among non-cancelled pieces
  - Keep "View campaign", "View agreement" and the CB2 deadline line.
  - The view stops calling `CI1`. The piece screen still uses it.
  - Remove the `escalated` badge entry from `PIECE_STATUS_BADGE`.
  - **Tests:** rewrite `DeliverablesScreen.test.tsx` around the delivery
    read. Cover:
    - each stage's banner and CTA (or none)
    - the escalation copy in all three variants
    - "1 revision left" in `draft_changes_requested`
    - "Delivered…" and no "paid"
    - row tap opens the piece
    - `404` redirect, loading, error with Retry
  - **Done when:** tests pass, and the screen renders every stage from
    fixtures.

- [x] **3. Submit delivery screen**
  - **New route:** `app/(details)/engagement/[id]/submit-delivery.tsx`,
    re-exporting `SubmitDeliveryScreen` from `scenes/campaigns` (same
    pattern as `deliverables.tsx`).
  - **Scene:** `scenes/campaigns/SubmitDeliveryScreen.tsx` plus
    `submitDelivery.style.ts`.
    - Reads `getEngagementDelivery` and builds `initialSlots`.
    - Each slot is a card with the source segmented control (Keep previous /
      Link / Image), the field for that source, a caption input and the
      piece comment.
    - Reuse the existing image picker and preview pattern from the current
      piece `SubmitForm`, moved here, including the permission-denied
      message.
  - **Submit:**
    - Disabled (`accessibilityState.disabled`) until every slot passes
      `validateSlot`.
    - On press:
      1. Upload each picked image with `uploadMediaImage`, sequentially, so
         a failure names its slot.
      2. Call `submitDeliveryRound`.
      3. On success, `router.back()`.
    - While sending, the button shows loading and every input is disabled.
  - **Errors:** exactly as listed under In scope.
    - Slot errors render under the slot with `accessibilityRole="alert"`.
    - Editing a slot clears its error.
  - **Other stages:** the "Nothing to submit right now" state.
  - **Tests:** `SubmitDeliveryScreen.test.tsx` covers:
    - Submit disabled until every slot is filled
    - a link-only round sends the right `items`
    - an image is uploaded first and its `id` is sent as `mediaId`
    - after changes requested: Keep previous is pre-selected, sends
      `reuseItemId`, and shows each piece's comment
    - a new caption on a kept piece is sent; an empty one is omitted
    - `409` banner plus refetch
    - `422` `items[1].externalUrl` lands on slot 1
    - an upload `413` shows on its slot and sends no round
    - a non-submittable stage shows the empty state
  - **Done when:** tests pass, and the route resolves from the Deliverables
    CTA.

- [x] **4. Read-only piece screen and cleanup**
  - **`DeliverablePieceScreen.tsx`:**
    - Remove `SubmitForm`, `LivePostForm`, the escalated notice, the
      revisions chip, and the `useRecordPostedMutation` /
      `submitDeliverable` usage.
    - Keep the hero, status, due date/"Overdue", the latest change request
      and `SubmissionItem` history.
    - Add a hint card "Submit or update this piece from the Deliverables
      screen."
  - **Delete:**
    - `api/submitDeliverable.ts`
    - the `recordPosted` endpoint and hook
    - `SubmitDeliverableArgs` and `RecordPostedArgs`
    - `submissionSchema`/`livePostSchema` and their error mappers in
      `deliverableSchemas.ts` (delete the file if it ends up empty)
    - `validateLivePostUrl` if unused
    - `formatEscalationReason`
  - **Types:**
    - Remove `revisionCount`, `rejectionCount`, `revisionsRemaining`,
      `escalatedAt`, `escalationReason` and the `escalated` status from
      `types/deliverables.ts`.
    - Keep `formatRevisionsLeft`, which step 2 uses.
  - **Tests:**
    - Update `DeliverablePieceScreen.test.tsx`: read-only content and no
      submit or live-post controls.
    - Prune the tests for deleted helpers.
  - **Docs:** update `docs/screen/deliverables/README.md` (Deliverables
    stages, read-only Piece, new Submit delivery section).
  - **Done when:**
    - `npm run test` and `npm run lint` pass with 0 errors.
    - The changed files pass `npx prettier --check`.
    - `grep` finds no `revisionsRemaining`/`rejectionCount` reads on pieces,
      and no `/submissions` or `/posted` calls.

## Files / areas

- **New:**
  - `scenes/campaigns/types/delivery.ts`
  - `scenes/campaigns/utils/delivery.ts` (+ test)
  - `scenes/campaigns/SubmitDeliveryScreen.tsx` (+ test)
  - `scenes/campaigns/submitDelivery.style.ts`
  - `app/(details)/engagement/[id]/submit-delivery.tsx`
- **Changed:**
  - `scenes/campaigns/api/campaignFeedApi.ts` (+ test)
  - `services/mediaUpload.ts` (+ test)
  - `scenes/campaigns/DeliverablesScreen.tsx` (+ test),
    `deliverables.style.ts`
  - `scenes/campaigns/DeliverablePieceScreen.tsx` (+ test),
    `deliverablePiece.style.ts`
  - `scenes/campaigns/types/deliverables.ts`
  - `scenes/campaigns/utils/deliverables.ts` (+ test)
  - `scenes/campaigns/utils/deliverableSchemas.ts` (+ test)
  - `scenes/campaigns/index.ts` (export the new scene)
  - `docs/screen/deliverables/README.md`
- **Deleted:** `scenes/campaigns/api/submitDeliverable.ts`

## Data / contracts

Sources: backend
`docs/features/campaign/implementations/CI_DELIVERY_ROUNDS.md` and
`../platform-context/api-contracts/campaigns.md` Group CI (~L1406-1540).
Both are illustrative, not live-captured.

### `GET /engagements/:engagementId/delivery`

Either party may read it. A non-party, or no such engagement, gets `404`.
`data`:

- `stage`: `'awaiting_draft' | 'draft_in_review' | 'draft_changes_requested' |
  'awaiting_final' | 'final_in_review' | 'final_changes_requested' |
  'delivered' | 'escalated' | null`. It is computed on read, and `escalated`
  wins over every other stage.
- `objective`: `'ugc_content' | 'brand_awareness' | null`
- `revisionsRemaining` (int, draft, 2 → 0), `draftChangeRequests` (int)
- `finalRevisionsRemaining` (int, 1 → 0), `finalChangeRequests` (int)
- `escalatedAt` (ISO | null), `escalationReason` (string | null; not shown)
- `pieces[]`: `{ id, scopeItemId, platform, type, title (string|null),
  pieceNo, dueDate (YYYY-MM-DD|null), status ('pending'|'in_progress'|
  'submitted'|'changes_requested'|'approved'|'cancelled'), finalKind
  ('file_link'|'live_post') }`
- `rounds[]` lists drafts, then finals, each oldest first:
  - `{ id, phase ('draft'|'final'), roundNo, status ('submitted'|'approved'|
    'changes_requested'), converted (bool), submittedAt, isLate, reviewDueAt,
    reviewDecision, reviewReason, reviewedAt, reviewedByUserId, items[] }`
  - each item: `{ id, pieceId, revisionNo, mediaId (string|null),
    externalUrl (string|null), livePostUrl (string|null), caption
    (string|null), reviewComment (string|null), status,
    reusedFromSubmissionId }`
- `externalUrl`, `caption` and `reviewComment` are user text. Render text
  escaped (as a `Text` child), and open links only when they are http(s)
  (`safeHttpUrl`).

### `POST /engagements/:engagementId/delivery/rounds`

The engagement's creator only; anyone else gets `404`. Body:

```json
{ "items": [ { "pieceId": "…", "externalUrl": "https://…" },
             { "pieceId": "…", "mediaId": "<POST /media id>" },
             { "pieceId": "…", "reuseItemId": "<earlier item id>", "caption": "…" } ] }
```

- **Items:** one per non-cancelled piece. Each has exactly one of
  `mediaId` / `externalUrl` / `reuseItemId`.
- **`caption`:** optional, ≤ 2000. Omitted on a reuse item, the earlier
  caption is kept.
- **Phase:** the server picks it from the stage. A draft in 36a.
- **Success:** `201` with `data` = the new round and `meta: { stage,
  revisionsRemaining, finalRevisionsRemaining }`.
- **`409`:**
  - `CONFLICT` "This engagement is not in delivery." /
    "A delivery is already awaiting review."
  - `DELIVERABLE_NOT_SUBMITTABLE` "This delivery is escalated to a dispute."
- **`422 VALIDATION_FAILED`**, all problems at once:
  - `items`: missing pieces
  - `items[i]`: not exactly one source
  - `items[i].pieceId`, `items[i].mediaId` ("unknown media"),
    `items[i].reuseItemId`, `items[i].externalUrl`, `items[i].caption`

### `POST /media`

- Multipart `file`: JPEG, PNG, GIF or WebP, 5 MB cap.
- `201` returns `{ id, key, url, fileType, fileSize, createdAt }`. The
  round's `mediaId` is `id`.
- `413 MEDIA_TOO_LARGE`; `422 MEDIA_INVALID_TYPE` (`errors.file`).

### `CI1` pieces (piece screen)

The 18r3 removals apply: no `revisionCount`, `rejectionCount`,
`revisionsRemaining`, `escalatedAt` or `escalationReason`, and no `escalated`
status. Each submission keeps `reviewReason`, `livePostUrl` and `postedAt`.

### Revision rules (server-enforced; the client only displays them)

- **Draft:** original + 2 revisions, so `revisionsRemaining` counts 2 → 1 →
  0. The 3rd change request escalates the engagement.
- **Approval:** approving the draft moves the delivery to `awaiting_final`
  (36b).

## Testing

- Jest + RNTL via `npm run test`.
  - Logic: `delivery.test.ts`, API tests, `mediaUpload.test.ts`.
  - Scenes: `DeliverablesScreen`, `SubmitDeliveryScreen` and
    `DeliverablePieceScreen` tests, mocking `request` as the existing scene
    tests do.
- `npm run lint`, and `npx prettier --check` on changed files.
- No browser-test command exists. Nothing live is claimed: the shapes come
  from the backend doc and the contract. A manual check against a local
  18r backend is optional (`/check`).

## Notes for the AI

- **Allowed requests:** never call `CI2`/`CI3`/`CI4`. Only
  `GET .../delivery`, `POST .../delivery/rounds`, `POST /media` and the
  existing `CI1`/`CF3`/`CB2`.
- **Hide forbidden stages:** in 36a, don't offer submission outside
  `awaiting_draft` / `draft_changes_requested`, even though the server would
  accept a final round. Final items have their own rules (36b).
- **Index alignment:** build `items` in the same order as the slots, so the
  `items[i]` error keys map straight to slot `i`.
- **Reuse means reuse:** a reused item never uploads anything. Don't
  re-send the old `externalUrl` instead of `reuseItemId`; the server tracks
  the carry-over.
- **Money copy:** the "Delivered" and approved copy never says "paid" or
  "payment".
- **OptionSheet placement:** if one is used, keep it a sibling of the scene's
  ScrollView (existing pattern).
- **Comments:** follow the existing comment style, citing the backend rule a
  helper mirrors.
