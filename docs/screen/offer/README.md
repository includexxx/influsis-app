# Screen Specs — Offer (negotiation)

| | |
|---|---|
| **Figma node** | None — no negotiation design exists; built from the existing design-system components (feature 23) |
| **Route** | `/engagement/[id]` (`app/(details)/engagement/[id].tsx`), params `id` (engagement id) and `title` (campaign title) |
| **Scene** | `scenes/campaigns/OfferScreen.tsx` (+ `offerScreen.style.ts`) |
| **Logic** | `scenes/campaigns/utils/negotiation.ts` (`getOfferScreenState`, `parseCounterAmount`, `formatOfferDate`) |
| **Data** | Campaign API group CF3 `GET /me/engagements/:id` — the engagement with its whole offer thread |
| **Components used** | `ScreenHeader`, `StatusBadge`, `SummaryRow`, `Button`, `TextField`, `ConfirmDialog`, `CampaignRequestCardSkeleton`, `CampaignsEmptyState` (all existing) |

## Purpose

The creator's side of a price negotiation with one business, for one campaign
engagement — an application the creator sent or an invitation they received.
Shows every offer so far, how many rounds are left, and lets the creator
accept, counter, decline, or withdraw. Business side: the web app's Offer
dialog. Rules: `../backend/docs/features/campaign/NEGOTIATION_AND_DELIVERABLES_BRIEF.md`.

## User flow

```
/applications  (Applied or Request tab)
  │  tap a row
  ▼
/engagement/[id]
  ├─ "View campaign" → /campaign/[campaignId]
  ├─ Accept → confirm → CF4 (the business's pending offer, by offerId)
  ├─ Counter → amount (BDT) + optional note → CG2
  ├─ Withdraw my offer → confirm → CG3
  ├─ Decline (invitations) → optional reason → confirm → CF5
  ├─ Withdraw application (own requests) → optional reason → confirm → CF6
  └─ back chevron → router.back()
```

## Sections (top to bottom)

| # | Section | Content |
|---|---|---|
| 1 | Header | Back chevron + "Offer" (`ScreenHeader`) |
| 2 | Campaign | Campaign title (route param, fallback "Campaign") + engagement status badge; "View campaign" link |
| 3 | Offers | One card per round, oldest first: "Round N · You/Business", offer status, amount, note, date. Countered / withdrawn / expired rounds are dimmed with the amount struck through |
| 3b | Deliverables | The engagement's own negotiated list (`scope`, backend 18l): "2 × Instagram Reels" per line. Rounds whose `scopeChanged` is true carry a "Changed deliverables" tag in section 3 |
| 4 | Rounds | "Rounds left: N" while negotiable, plus "Waiting for the business to respond." (own offer pending) or "This is the final offer — accept or decline." (no rounds left, business's offer pending) |
| 5 | Accepted summary | Agreed price and "The business has until {date} to fund escrow." The licensing markup is the business's cost and isn't shown |
| 6 | Error banner | Server message after a failed action (`accessibilityRole="alert"`) |
| 7 | Form (when open) | Counter: amount (pre-filled with the latest offer) + note + "Change deliverables" (`DeliverablesEditor`, pre-filled from the current list; "Keep current deliverables" closes it). Decline / Withdraw application: optional reason |
| 8 | Actions | Only the actions allowed right now (table below) |

## Actions

| Action | Shown when | Endpoint |
|---|---|---|
| Accept | `pending`/`countered`, pending offer from the business | `POST /me/engagements/:id/accept` `{ offerId }` (CF4) |
| Counter | `pending`/`countered`, rounds left > 0, pending offer isn't the creator's own | `POST /engagements/:id/offers` `{ amountMinor, note?, scope? }` (CG2) |
| Withdraw my offer | `pending`/`countered`, pending offer is the creator's own | `POST /engagements/:id/offers/:offerId/withdraw` (CG3) |
| Decline | `pending`/`countered`, `origin: invited` | `POST /me/engagements/:id/decline` `{ reason }` (CF5) |
| Withdraw application | `pending`/`countered`, `origin: requested` | `POST /me/engagements/:id/withdraw` `{ reason }` (CF6) |

The rules mirror the backend (18d/18e/18k): one pending offer at a time; a
round is one offer, the opening one included (default cap 3 per engagement);
no countering your own pending offer (withdraw it instead — the round stays
used); accept only the business's offer; nothing once the engagement is
closed. The server still decides: a `409` shows its message and refetches the
engagement, a `422` shows field messages, anything else "Couldn't update the
offer. Please try again." After a successful action the screen refetches and
stays open. Every action invalidates the engagement, the Applications lists and
the campaign feed.

**Deliverables in a counter (backend 18l).** `scope` replaces the whole
list and is sent only when it differs from the current one (order ignored),
so a deliverables-only counter re-sends the pre-filled amount and still costs
a round (cap and turn rule apply). The editor keeps 1-30 rows, count 1-50,
one row per platform + type; "Add deliverable" opens an `OptionSheet` (a
sibling of the ScrollView) with the catalog items not yet listed. A `422`'s
`scope[i]` message shows under its row.

## States

- **Loading:** two row skeletons under the header.
- **Load error:** `CampaignsEmptyState` error variant with "Try again".
- **Busy:** all action buttons disabled while one request is in flight.

## Scope notes

- **No Figma frame.** Built from existing components and tokens; revisit when a
  negotiation design lands.
- **Campaign title comes from the list** (route param) because CF3 returns no
  campaign summary.
- **Escrow funding** (backend item 19) and offers inside Messaging (backend 22)
  are out of scope. Offer expiry isn't shown — the offer summary has no
  `expiresAt`.
