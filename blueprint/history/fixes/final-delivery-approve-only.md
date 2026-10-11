# Fix - Final delivery can't be sent back; auto-approved after 72 hours

_Archived on completion. Merged from `fix/final-delivery-approve-only`._

**Type:** Fix

**Status:** verified - `npm run lint` 0 errors, `npm run test` 168 suites / 988 tests green, `tsc` clean for the changed code (two unrelated pre-existing auth test errors). Not yet checked on a device against the running backend.

**Branch:** `fix/final-delivery-approve-only` — cut from
`feat/campaign-negotiation` (36a/36b aren't on `dev` yet).

## The problem

Backend fix 2026-10-11 (`backend` commit `41d27b4`,
`platform-context/api-contracts/campaigns.md` Group CI) made the **final**
delivery approve-only:

- The business can no longer send the final back.
- If the business doesn't approve it within **72 hours** of submission (the
  round's `reviewDueAt`), the system approves it and completes the
  engagement. The round reads `autoApproved: true`.
- Removed from the API: `finalRevisionsRemaining`, `finalChangeRequests` and
  the `final_changes_requested` stage.

The app still models a sent-back final:

- the `final_changes_requested` stage view ("Resend final delivery")
- `finalRevisionsRemaining` on Submit delivery
- the "requested changes to the final delivery twice" escalation copy

While a final is in review, it also doesn't tell the creator when the final
will be approved automatically.

## The fix

- **Types:**
  - remove `final_changes_requested`, `finalRevisionsRemaining` and
    `finalChangeRequests`
  - add `autoApproved` to `DeliveryRound`
- **Helpers** (`utils/delivery.ts`):
  - `submitPhase` maps only `awaiting_final` to the final phase
  - `escalationCopy` counts draft change requests only
  - `deliveryStatusView` drops the final change-request case
  - `final_in_review` says the business approves it, or it's approved
    automatically on the round's `reviewDueAt` date
  - `delivered` says "Approved automatically" when the final was
    auto-approved
- **Submit delivery:** revising applies to drafts only, so it reads only
  `revisionsRemaining`.
- **Must not break:** the draft flow (revisions, Keep previous, image upload),
  final-item validation, and the in-dispute view for draft escalation.

## Build steps

- [x] 1. Types, helpers, screens and their tests. **Done when** `npm run test`
     passes with updated delivery, Deliverables and Submit delivery tests.
- [x] 2. Docs: `docs/screen/deliverables/README.md` and
     `blueprint/context/project-overview.md`. **Done when** no doc says the final
     can be sent back.

## Verify

- `npm run format` (check), `npm run lint`, `npm run test`.
- Manual check, against the backend on `feat/campaign-negotiation`:
  1. Send the final delivery. Deliverables shows "Final delivery submitted"
     with the auto-approval date.
  2. After approval (manual or automatic), it shows "Delivered".
