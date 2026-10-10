# Current Feature

## Deliverable copy still assumes three change requests

**Type:** Fix

**Status:** verified

**Branch:** `fix/deliverable-copy-still-assumes-three-change-requests`

## The problem

Backend commit `703e233` ("escalate on the 2nd rejection instead of the 3rd")
changed item 25's revision rule. A piece now auto-escalates on its **second**
`changes_requested` decision: the creator gets the original plus one
revision, and `revisionsRemaining` counts 2 → 1 → 0
(`MAX_DELIVERABLE_REJECTIONS = 2` in
`../backend/src/campaign-engagement/domain/deliverable-rules.ts`).

The mobile app still assumes the old limit of three:

- **Dispute notice is wrong.** On the Deliverable piece screen, the "In
  dispute" notice says "The business requested changes three times."
  It now escalates after two
  ([DeliverablePieceScreen.tsx:184](../../scenes/campaigns/DeliverablePieceScreen.tsx)).
- **Comment is stale.** The `revisionsRemaining` comment says
  `max(0, 3 - rejectionCount)`
  ([types/deliverables.ts:62](../../scenes/campaigns/types/deliverables.ts)).
- **Bad plural.** The counts come from the server and are correct, but the
  copy is always plural, so the new last step reads "1 revisions left". This
  appears in the piece screen's hero chip
  ([DeliverablePieceScreen.tsx:167](../../scenes/campaigns/DeliverablePieceScreen.tsx))
  and on the Deliverables list row
  ([DeliverablesScreen.tsx:283](../../scenes/campaigns/DeliverablesScreen.tsx)).

## The fix

Stop hard-coding the limit and pluralize from the server's numbers.

- **Revisions-left copy.** Add `formatRevisionsLeft(n)` to
  `scenes/campaigns/utils/deliverables.ts`:
  - `1` → "1 revision left"
  - `0` → "No revisions left"
  - otherwise → "{n} revisions left"

  Use it for the hero chip and the list row.
- **Dispute notice.** Build the text from `piece.rejectionCount`, which `CI1`
  already returns:
  - "The business requested changes once."
  - "The business requested changes twice."
  - "The business requested changes {n} times."

  It keeps "Disputes aren't available yet." The copy is then right whatever
  the backend's threshold is.
- **Comment.** Update the type comment to the backend's rule:
  `max(0, MAX_DELIVERABLE_REJECTIONS - rejectionCount)`, currently 2, set by
  backend `703e233`.
- **Docs.** Update `docs/screen/deliverables/README.md` if it states a count
  or the plural form. Today it shows "{n} revisions left", which stays
  accurate.

**Must not break:**

- The `submittable` gating of the chip and row stays as it is.
- The badge labels (`PIECE_STATUS_BADGE`) and every other piece state stay as
  they are.
- No submit, record-posted or network behaviour changes.

**Out of scope:**

- **Stale contract.** `../platform-context/api-contracts/campaigns.md`
  (~L1426, L1632) still documents `max(0, 3 - rejectionCount)`. That repo is
  backend-owned, so flag it in the completion note and don't edit it from
  here.
- **Item 36.** Its "original + 2 revisions" per-round rule belongs to the
  future backend 18r and is not touched.

## Build steps

- [x] **1. Copy helpers and screens**
  - Add `formatRevisionsLeft` and `formatEscalationReason(rejectionCount)`
    (the dispute sentence) to `utils/deliverables.ts`, with tests in
    `deliverables.test.ts`. Cover 0, 1, 2 and 3 for both.
  - Use the helpers in `DeliverablePieceScreen.tsx` and
    `DeliverablesScreen.tsx`.
  - Fix the type comment.
  - Extend the screen tests:
    - `DeliverablesScreen.test.tsx`: a piece with `revisionsRemaining: 1`
      shows "1 revision left". The existing "2 revisions left" assertion
      stays.
    - `DeliverablePieceScreen.test.tsx`: an escalated piece with
      `rejectionCount: 2` shows "The business requested changes twice." and
      no longer says "three times".
  - **Done when:** `npm run test` and `npm run lint` pass, and the changed
    files pass `npx prettier --check`. Do not run the repo-wide
    `npm run format`.

## Verify

- **Automated:** `npm run test` (the deliverables util and both screen
  suites).
- **Manual** (against a local backend with `703e233`):
  1. Request changes once on a piece. Its row and hero chip read "1 revision
     left".
  2. Request changes a second time. The piece shows "In dispute" with "The
     business requested changes twice."
