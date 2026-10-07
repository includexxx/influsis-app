# Screen Specs — Deliverables (deliver the work)

Two screens for the creator's side of an accepted engagement (build-plan item
25, backend 18g/18h/18m): the list of pieces to deliver, and one piece's
submit / resubmit / live-post screen.

- `app/(details)/engagement/[id]/deliverables.tsx` → `scenes/campaigns/DeliverablesScreen.tsx`
- `app/(details)/engagement/[id]/deliverables/[pieceId].tsx` → `scenes/campaigns/DeliverablePieceScreen.tsx`

No Figma frame — built from existing components (`ScreenHeader`,
`StatusBadge`, `Button`, `ControlledTextField`, `CampaignsEmptyState`,
`AgreementSheet`) and theme tokens, in the app's redesigned visual language:
a brand-pink gradient summary card, rounded elevated cards, Feather icons and
pill buttons. Styles: `deliverables.style.ts` (list) and
`deliverablePiece.style.ts` (piece); the platform → icon mapping is shared in
`scenes/campaigns/utils/platformIcon.ts`.

## Purpose

Once the business and the creator agree price and deliverables (items 23-24),
acceptance creates one piece per unit of the negotiated scope ("2 × Instagram
Reels" → pieces 1 and 2). The creator submits each piece, reads the
business's change requests, resubmits, and after approval records where the
content went live. When the business approves the last piece the engagement
completes. **Nothing here says "paid"** — there is no escrow until backend
item 19.

## User flow

```text
Live Campaigns row / Home Active Campaigns card / Offer screen "Deliver work"
  └─ Deliverables (one row per piece)
       ├─ "View agreement" → read-only agreement sheet (feature 34)
       └─ tap a piece → Piece
            ├─ Submit / Resubmit (image or link + caption)      → CI2
            ├─ changes requested → reason shown above the form → Resubmit
            ├─ escalated → "In dispute" notice, no actions
            └─ approved → "Approved on …" + Live post link form  → CI4
```

## Deliverables screen

| # | Section | Content |
|---|---|---|
| 1 | Header | Back + "Deliverables" |
| 2 | Summary card | Gradient card: "CAMPAIGN" eyebrow, "In progress" / "Completed" chip, title (route param `title`), "Content deadline · {date}" (or "No deadline set") from CB2 — left out when CB2 fails, e.g. `404` once the campaign isn't live — and "Approval progress": "{approved} of {n} approved" with a progress bar (cancelled pieces don't count) |
| 3 | Actions | Two half-width pills: "View campaign" (`/campaign/[campaignId]`) and "View agreement" (the agreement sheet in `confirmed` mode; shown once the engagement is accepted) |
| 4 | Completed banner | Check icon + "All deliverables approved. This campaign is complete." when the engagement is `completed` |
| 5 | Pieces | "Your deliverables" + count chip, then one elevated card per piece: platform icon tile, "Instagram Reels · 2", status badge, "Due {date}" (+ red "Overdue" and a red border while still submittable), "{n} revisions left" while submittable, chevron |

Status badges: To deliver (`pending`), In progress, Awaiting review
(`submitted`), Changes requested, Approved, In dispute (`escalated`),
Cancelled.

States: two skeleton rows while loading; `CampaignsEmptyState` error with
retry; a dashed card "No deliverables yet. They appear once the offer is
accepted." when empty; a `404` redirects to Live Campaigns.

Data: CI1 for the pieces, CF3 for the status, campaign id and the agreement,
and CB2 (`GET /feed/campaigns/:id`) for the content deadline and the
agreement's business / deadline rows.

## Piece screen

| # | Section | Content |
|---|---|---|
| 1 | Summary card | Gradient card: platform icon, "DELIVERABLE" eyebrow, title, status badge, and chips for the due date, "Overdue" (red) and revisions left |
| 2 | Change request | Amber notice "The business asked for changes" + the latest reason (plain text), when `changes_requested` |
| 3 | Escalated / cancelled / approved notice | Icon notices per status: "In dispute" (red), "Cancelled" (grey), "Approved" with the date (green) |
| 4 | Submit form | While submittable, a card ("Submit your work" / "Submit a new revision"): a pill **Share link** / **Upload image** switch; the link field (link icon) or a dashed image drop area → a large preview with **Change** / **Remove**; caption with a `n/2000` counter; success / error banner; Submit (first) or Resubmit |
| 5 | Live post link | When approved, a card: URL field (pre-filled when recorded) + "Save link" |
| 6 | Submissions | "Submissions" + count chip, then a timeline, newest first: a status-coloured dot per revision, card with revision, date, status tag, "Late" tag, the link (opens only when `http(s)`) or "Uploaded image", caption, and the business's decision + reason |

## Actions and endpoints

| Action | Shown when | Endpoint |
|---|---|---|
| List pieces | always | `GET /engagements/:id/deliverables` (CI1) |
| Submit / Resubmit | piece not approved / escalated / cancelled | `POST /engagements/:id/deliverables/:pieceId/submissions` (CI2) — multipart `file` (image) **or** JSON `{ externalUrl }`, plus `caption?` |
| Save live post link | piece approved | `POST /engagements/:id/deliverables/:pieceId/posted` `{ livePostUrl }` (CI4) |

**Forms** use react-hook-form + zod (`scenes/campaigns/utils/deliverableSchemas.ts`,
which wraps the backend-mirroring rules in `utils/deliverables.ts`, so the
messages have one source). Validation before sending: a link must be a full
`http(s)://` URL ≤2048 characters; image mode needs a picked image
(JPEG/PNG/GIF/WebP — videos are shared as links); caption ≤2000; the live post
link must be a full URL. Errors show under their field once it's been touched
or on submit, and clear as soon as the value is fixed; switching link / image
clears the other mode's error. A late submission is allowed (the backend flags
it).

Server errors (`applySubmissionError` / `applyLivePostError`): `409` (e.g.
`DELIVERABLE_NOT_SUBMITTABLE`, "not approved yet") shows the server message in
a banner and refetches; `422` puts field messages on the link / caption /
image (and the live post URL) plus the summary in a banner; a network failure
says "Cannot reach the server…"; anything else shows a generic message. A
denied photo permission shows "Allow photo access in Settings to upload an
image."; a picker failure shows "Couldn't open your photos." Inputs and the
switch are locked while submitting.

## Scope notes

- **Submitted images can't be previewed** — the backend returns only
  `mediaId` for an upload; the history shows "Uploaded image".
- **`reviewDueAt` isn't shown** — nothing enforces it yet (backend item 19),
  so the app never suggests an auto-release.
- **The Order tab stays mock** (`scenes/order`, `data/orders.ts`); wiring it
  is a later item.
