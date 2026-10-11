# Screen Specs — Deliverables (deliver the work)

Three screens for the creator's side of an accepted engagement. Since
build-plan item 36 (backend 18r1-18r3) every piece is delivered **together as
one round** and reviewed as a whole - draft rounds (36a), then the final
round (36b): the Deliverables overview, the Submit delivery screen, and one
piece's read-only history.

- `app/(details)/engagement/[id]/deliverables.tsx` → `scenes/campaigns/DeliverablesScreen.tsx`
- `app/(details)/engagement/[id]/submit-delivery.tsx` → `scenes/campaigns/SubmitDeliveryScreen.tsx`
- `app/(details)/engagement/[id]/deliverables/[pieceId].tsx` → `scenes/campaigns/DeliverablePieceScreen.tsx`

No Figma frame — built from existing components (`ScreenHeader`,
`StatusBadge`, `Button`, `TextField`, `CampaignsEmptyState`,
`AgreementSheet`) and theme tokens, in the app's redesigned visual language:
a brand-pink gradient summary card, rounded elevated cards, Feather icons and
pill buttons. Styles: `deliverables.style.ts` (overview),
`submitDelivery.style.ts` (slot extras) and `deliverablePiece.style.ts`
(piece, plus the cards, segmented control, preview and notices the Submit
delivery screen reuses). The platform → icon mapping is shared in
`scenes/campaigns/utils/platformIcon.ts`; the stage and slot logic lives in
`scenes/campaigns/utils/delivery.ts`.

## Purpose

Once price and deliverables are agreed (items 23-24), acceptance creates one
piece per unit of the negotiated scope ("2 × Instagram Reels" → pieces 1 and
2). The creator delivers **every piece at once** as a **draft round**; the
business approves it or requests changes with an overall reason and a comment
per piece. Original + 2 revisions; the 3rd change request escalates the whole
engagement to a dispute. After the draft is approved comes the **final round**:
a link per piece — a link to the final files (UGC Content) or the live post on
the piece's platform (Brand Awareness). The final can be sent back once; the
2nd final change request escalates. Approving the final completes the
engagement. **Nothing here says "paid"** — there is no escrow until backend
item 19.

## User flow

```text
Live Campaigns row / Home Active Campaigns card / Offer screen "Deliver work"
  └─ Deliverables (status card for the stage + one row per piece)
       ├─ awaiting_draft          → "Submit delivery"      → Submit delivery
       ├─ draft_in_review         → "Draft submitted", no action
       ├─ draft_changes_requested → reason + revisions left → "Submit revised draft"
       ├─ awaiting_final          → "Draft approved"           → "Send final delivery"
       ├─ final_in_review         → "Final delivery submitted", no action
       ├─ final_changes_requested → reason + revisions left  → "Resend final delivery"
       ├─ delivered               → "Delivered. This campaign is complete."
       ├─ escalated               → "In dispute", no actions
       ├─ "View agreement" → read-only agreement sheet (feature 34)
       └─ tap a piece → Piece (read-only history)
```

## Deliverables screen

| # | Section | Content |
|---|---|---|
| 1 | Header | Back + "Deliverables" |
| 2 | Summary card | Gradient card: "CAMPAIGN" eyebrow, a stage chip (To deliver / In review / Changes requested / Final due / Completed / In dispute), title (route param `title`), "Content deadline · {date}" (or "No deadline set") from CB2 — left out when CB2 fails, e.g. `404` once the campaign isn't live — and "Approval progress": "{approved} of {n} approved" with a progress bar (cancelled pieces don't count) |
| 3 | Actions | Two half-width pills: "View campaign" (`/campaign/[campaignId]`) and "View agreement" (the agreement sheet in `confirmed` mode) |
| 4 | Status card | One card for the stage (`utils/delivery.ts` `deliveryStatusView`): title, body, "Submitted {date}" while a draft or the final is in review, "{n} revision(s) left" while changes are requested (draft: 2 → 0; final: 1 → 0), and the primary **Submit delivery** / **Submit revised draft** / **Send final delivery** / **Resend final delivery** button when the creator can submit. Escalated: "In dispute" with "The business requested changes to the draft {n} times." / "…to the final delivery twice." / "This delivery was escalated to a dispute.", then "Disputes aren't available yet." The backend's `escalationReason` wording is never shown |
| 5 | Pieces | "Your deliverables" + count chip, then one elevated card per piece: platform icon tile, "Instagram Reels · 2" (a custom piece shows its title), status badge, "Due {date}" (+ red "Overdue" and a red border while not approved or cancelled), chevron |

Status badges: To deliver (`pending`), In progress, Awaiting review
(`submitted`), Changes requested, Approved, Cancelled. Pieces never escalate on
their own (backend 18r3) — the engagement does.

States: two skeleton rows while loading; `CampaignsEmptyState` error with
retry; a dashed card "No deliverables yet. They appear once the offer is
accepted." when there are no pieces; a `404` redirects to Live Campaigns.

Data: the delivery read (`GET /engagements/:id/delivery`) for the stage,
budgets, escalation, pieces and rounds; CF3 for the campaign id and the
agreement; CB2 for the content deadline and the agreement's business /
deadline rows.

## Submit delivery screen

The draft stages (`awaiting_draft`, `draft_changes_requested`) and the final
stages (`awaiting_final`, `final_changes_requested`) can submit; any other
stage shows "Nothing to submit right now." with **Back**.

| # | Section | Content |
|---|---|---|
| 1 | Header | Back + "Submit delivery" |
| 2 | Intro card | Campaign title, one line of guidance, and — after changes were requested — an amber "The business asked for changes" notice with the round's reason plus "{n} revision(s) left". Hint: "Videos are shared as links. Images can be JPEG, PNG, GIF or WebP up to 5 MB." |
| 3 | Slots | One card per non-cancelled piece: title, due date, the business's comment for that piece (amber, from the latest round), a pill **Keep previous** / **Link** / **Image** switch, the field for the chosen source, and an optional caption (≤2000). **Keep previous** is offered — and pre-selected — only when the latest round has an item for the piece; it shows the earlier link or "Uploaded image", and its caption field shows the old caption as the placeholder (left empty, the old caption is kept) |
| 4 | Error banner | A `409` server message, a `422` form-level message, or a generic / network message |
| 5 | Submit | **Submit delivery** / **Submit revised draft** (draft) or **Send final delivery** / **Resend final delivery** (final), disabled until every slot is ready (a full `http(s)` link ≤2048, a picked image, or a kept item; captions ≤2000) |

**Final mode.** A final item is always a link (`pieces[].finalKind`, set by
the backend): there is no **Image** option, and **Keep previous** is offered
only when the piece's item in the latest round is a link — the approved draft
round while awaiting the final, the final round after a change request. It's
pre-selected only when the kept link passes the checks below; a draft upload
can't be kept, so that piece starts on **Link**. Per slot:

- `file_link` — "Link to your files", hint "Share the final files, e.g. a
  Google Drive or Dropbox link."; any `http(s)` link.
- `live_post` — "Live post URL", hint "Post it on {Platform}, then paste the
  live post link." The host must be the platform's domain or a subdomain of
  it (`facebook.com`/`fb.com`/`fb.watch`, `instagram.com`, `tiktok.com`,
  `youtube.com`/`youtu.be`), else "Paste the {Platform} post link." A custom
  piece takes any `http(s)` link ("Post it, then paste the link to the live
  post."). The server re-checks and its `422` lands on the slot.

On submit, picked images are uploaded one by one (`POST /media`); a `413`
shows "That image is too large (max 5 MB)." and a `422` "That image type
isn't supported." on that slot, and nothing is sent. Then one
`POST /engagements/:id/delivery/rounds` sends an item per slot, in slot order
— exactly one of `externalUrl` / `mediaId` / `reuseItemId`, plus `caption`
only when non-empty. On success the screen goes back and the Deliverables
screen refetches into `draft_in_review`. A `409` shows the server message and
refetches the delivery; a `422` puts `items[i]…` messages on slot `i` (and
`items` on the banner), cleared as soon as that slot is edited. A denied photo
permission shows "Allow photo access in Settings to upload an image." on the
slot. Inputs are locked while sending.

## Piece screen (read-only)

| # | Section | Content |
|---|---|---|
| 1 | Summary card | Gradient card: platform icon, "DELIVERABLE" eyebrow, title, status badge, and chips for the due date and "Overdue" (red) |
| 2 | Change request | Amber notice "The business asked for changes" + the latest reason (plain text), when `changes_requested` |
| 3 | Notices | "Cancelled" (grey), "Approved" with the date (green), or — while the piece still needs work — "Delivered together: Submit or update this piece from the Deliverables screen." |
| 4 | Submissions | "Submissions" + count chip, then a timeline, newest first: a status-coloured dot per revision, card with revision, date, status tag, "Late" tag, a green "Live post" tag when the item recorded a live post (a Brand Awareness final), the link (opens only when `http(s)`) or "Uploaded image", caption, and the business's decision + reason |

Data: CI1 (`GET /engagements/:id/deliverables`), read-only.

## Actions and endpoints

| Action | Shown when | Endpoint |
|---|---|---|
| Read the delivery | Deliverables, Submit delivery | `GET /engagements/:id/delivery` |
| Upload an image | Submit, per image slot | `POST /media` (multipart `file`, 5 MB) → `id` |
| Submit a round | `awaiting_draft` / `draft_changes_requested` (draft), `awaiting_final` / `final_changes_requested` (final — no `mediaId`) | `POST /engagements/:id/delivery/rounds` `{ items: [{ pieceId, externalUrl \| mediaId \| reuseItemId, caption? }] }` |
| Piece history | Piece | `GET /engagements/:id/deliverables` (CI1) |

The per-piece `CI2` (submit), `CI3` (review) and `CI4` (record posted) were
removed by the backend (`404`) and are no longer called. A live post is now
recorded as a Brand Awareness final item.

## Scope notes

- **Submitted images can't be previewed** — the backend returns only
  `mediaId` for an upload; the app shows "Uploaded image".
- **Carry-over reuses the latest round only** — earlier, superseded per-piece
  submissions aren't offered.
- **The post itself isn't checked** — only the link's host, as on the
  backend.
- **`reviewDueAt` isn't shown** — nothing enforces it yet (backend item 19),
  so the app never suggests an auto-release.
- **The Order tab stays mock** (`scenes/order`, `data/orders.ts`); wiring it
  is a later item.
