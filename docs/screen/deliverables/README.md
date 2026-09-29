# Screen Specs — Deliverables (deliver the work)

Two screens for the creator's side of an accepted engagement (build-plan item
25, backend 18g/18h/18m): the list of pieces to deliver, and one piece's
submit / resubmit / live-post screen.

- `app/(details)/engagement/[id]/deliverables.tsx` → `scenes/campaigns/DeliverablesScreen.tsx`
- `app/(details)/engagement/[id]/deliverables/[pieceId].tsx` → `scenes/campaigns/DeliverablePieceScreen.tsx`

No Figma frame — built from existing components (`ScreenHeader`,
`StatusBadge`, `Button`, `TextField`, `CampaignsEmptyState`) and theme
tokens.

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
| 2 | Campaign | Title (route param `title`) + "View campaign" link (`/campaign/[campaignId]`) |
| 3 | Completed banner | "All deliverables approved. This campaign is complete." when the engagement is `completed` |
| 4 | Pieces | Per piece: "Instagram Reels · 2", status badge, "Due {date}" (+ "Overdue" while still submittable), "{n} revisions left" while submittable |

Status badges: To deliver (`pending`), In progress, Awaiting review
(`submitted`), Changes requested, Approved, In dispute (`escalated`),
Cancelled.

States: two skeleton rows while loading; `CampaignsEmptyState` error with
retry; "No deliverables yet. They appear once the offer is accepted." when
empty; a `404` redirects to Live Campaigns.

## Piece screen

| # | Section | Content |
|---|---|---|
| 1 | Header | Title, status badge, due date, revisions left |
| 2 | Change request | "The business asked for changes:" + the latest reason (plain text), when `changes_requested` |
| 3 | Escalated / cancelled / approved notice | Per status (below) |
| 4 | Submit form | While submittable: **Upload image** / **Share link** toggle, caption, Submit (first) or Resubmit |
| 5 | Live post link | When approved: URL field (pre-filled when recorded) + "Save link" |
| 6 | Submissions | Newest first: revision, status, date, "Late" tag, the link (opens only when `http(s)`) or "Uploaded image", caption, the business's decision + reason |

## Actions and endpoints

| Action | Shown when | Endpoint |
|---|---|---|
| List pieces | always | `GET /engagements/:id/deliverables` (CI1) |
| Submit / Resubmit | piece not approved / escalated / cancelled | `POST /engagements/:id/deliverables/:pieceId/submissions` (CI2) — multipart `file` (image) **or** JSON `{ externalUrl }`, plus `caption?` |
| Save live post link | piece approved | `POST /engagements/:id/deliverables/:pieceId/posted` `{ livePostUrl }` (CI4) |

Validation before sending: a link must be a full `http(s)://` URL ≤2048
characters; image mode needs a picked image (JPEG/PNG/GIF/WebP — videos are
shared as links); caption ≤2000. A late submission is allowed (the backend
flags it). Errors: `409` (e.g. `DELIVERABLE_NOT_SUBMITTABLE`, "not approved
yet") shows the server message and refetches; `422` puts field messages on
the link / caption / image; anything else shows a generic message.

## Scope notes

- **Submitted images can't be previewed** — the backend returns only
  `mediaId` for an upload; the history shows "Uploaded image".
- **`reviewDueAt` isn't shown** — nothing enforces it yet (backend item 19),
  so the app never suggests an auto-release.
- **The Order tab stays mock** (`scenes/order`, `data/orders.ts`); wiring it
  is a later item.
