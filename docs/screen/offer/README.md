# Screen Specs — Offer (negotiation)

|                     |                                                                                                                                                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma node**      | None — no negotiation design exists; built from the design-system components and theme tokens (features 23, 24, 34; redesigned in the same visual language as the Deliverables screens)                                                         |
| **Route**           | `/engagement/[id]` (`app/(details)/engagement/[id].tsx`), params `id` (engagement id), `title` (campaign title) and optional `review` (`'1'` opens the agreement sheet on load)                                                                 |
| **Scene**           | `scenes/campaigns/OfferScreen.tsx` (+ `offerScreen.style.ts`)                                                                                                                                                                                   |
| **Logic**           | `scenes/campaigns/utils/negotiation.ts` (`getOfferScreenState`, `parseCounterAmount`, `formatOfferDate`), `utils/scope.ts` (deliverables), `utils/agreement.ts` (`buildCreatorAgreement`, `licensingMarkupMinor`)                              |
| **Data**            | Campaign API group CF3 `GET /me/engagements/:id` — the engagement with its whole offer thread; CB2 `GET /feed/campaigns/:id` while the agreement sheet is open (licensing tier, content deadline, business)                                      |
| **Components used** | `ScreenHeader`, `StatusBadge`, `Button`, `TextField`, `ConfirmDialog`, `DeliverablesEditor`, `OptionSheet`, `CampaignRequestCardSkeleton`, `CampaignsEmptyState`, `AgreementSheet` (`scenes/campaigns/components/`)                          |

## Purpose

The creator's side of a price negotiation with one business, for one campaign
engagement — an application the creator sent or an invitation they received.
Shows every offer so far, how many rounds are left, and lets the creator
accept, counter, decline, or withdraw. Accepting is binding, so it always goes
through an **agreement sheet** that shows the terms first. Business side: the
web app's Offer dialog. Rules:
`../backend/docs/features/campaign/NEGOTIATION_AND_DELIVERABLES_BRIEF.md`.

## User flow

```text
/applications  (Applied or Request tab)
  │  tap a row                     → /engagement/[id]
  │  Request tab quick "Accept"    → /engagement/[id]?review=1  (sheet opens on load)
  ▼
/engagement/[id]
  ├─ "View campaign" → /campaign/[campaignId]
  ├─ Accept → Agreement sheet → "Accept & confirm" → CF4 (the offer the sheet shows)
  │                            → sheet turns into "Agreement confirmed"
  ├─ Counter → amount (BDT) + optional note (+ optional deliverables) → CG2
  ├─ Withdraw my offer → confirm → CG3
  ├─ Decline (invitations) → optional reason → confirm → CF5
  ├─ Withdraw application (own requests) → optional reason → confirm → CF6
  ├─ accepted: "View agreement" → read-only sheet; "Deliver work" → /engagement/[id]/deliverables
  └─ back chevron → router.back()
```

## Layout (top to bottom)

| #   | Section          | Content                                                                                                                                                                                                                                      |
| --- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Header           | Back chevron + "Offer" (`ScreenHeader`)                                                                                                                                                                                                      |
| 2   | Header card      | Brand-pink gradient card: "INVITATION" / "APPLICATION" eyebrow, engagement status badge, campaign title (route param, fallback "Campaign"), a frosted "View campaign" pill, and while negotiable "Rounds left: N" with "{used} of {limit} used" and a progress bar |
| 3   | Notices          | Icon cards: "Waiting for the business to respond." (own offer pending), "This is the final offer — accept or decline." (no rounds left, business's offer pending), "Reason: …" (closed with a reason)                                         |
| 4   | Accepted summary | Green card: "You'll receive" + agreed price **plus** the licensing markup, and a "View agreement" pill. "Deliver work" (full-width) below it when `accepted`/`completed`                                                                       |
| 5   | Error banner     | Server message after a failed action, with an alert icon (`accessibilityRole="alert"`)                                                                                                                                                        |
| 6   | Deliverables     | Card with the engagement's negotiated list (`scope`, backend 18l) as chips, "2 × Instagram Reels"                                                                                                                                             |
| 7   | Form (when open) | Card. Counter: amount (pre-filled with the latest offer) + note + "Change deliverables" (`DeliverablesEditor`, pre-filled; "Keep current deliverables" closes it). Decline / Withdraw application: optional reason + a solid red confirm button |
| 8   | Negotiation      | The thread as chat bubbles, oldest first: the business's offers on the left (briefcase avatar), the creator's on the right (pink). Each: "Round N · You/Business", a coloured status label, the amount, a "Changed deliverables" tag when `scopeChanged`, note, date. Countered / withdrawn / expired rounds are dimmed with the amount struck through |
| 9   | Action bar       | Pinned to the bottom (above the home indicator) while negotiable and no form is open: Counter + Accept side by side, "Withdraw my offer" below, then Decline / Withdraw application as red text buttons. Only the actions allowed right now (table below) |

## Actions

| Action               | Shown when                                                                    | Endpoint                                                                                  |
| -------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Accept               | `pending`/`countered`, pending offer from the business                        | opens the agreement sheet; "Accept & confirm" → `POST /me/engagements/:id/accept` `{ offerId }` (CF4) |
| Counter              | `pending`/`countered`, rounds left > 0, pending offer isn't the creator's own | `POST /engagements/:id/offers` `{ amountMinor, note?, scope? }` (CG2)                    |
| Withdraw my offer    | `pending`/`countered`, pending offer is the creator's own                     | `POST /engagements/:id/offers/:offerId/withdraw` (CG3)                                    |
| Decline              | `pending`/`countered`, `origin: invited`                                      | `POST /me/engagements/:id/decline` `{ reason }` (CF5)                                     |
| Withdraw application | `pending`/`countered`, `origin: requested`                                    | `POST /me/engagements/:id/withdraw` `{ reason }` (CF6)                                    |
| View agreement       | engagement `accepted`                                                         | opens the read-only agreement sheet                                                       |
| Deliver work         | engagement `accepted` or `completed`                                          | opens `/engagement/[id]/deliverables` (item 25, `docs/screen/deliverables/README.md`)     |

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

## Agreement sheet (feature 34)

`scenes/campaigns/components/AgreementSheet.tsx`, a `BottomSheet`. Two modes:

| Mode        | Opened by                                  | Shows                                                                                                                                         |
| ----------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `confirm`   | Accept, or `review=1` once per screen mount | "Review the agreement", campaign card (business avatar or initial, title, business name), "You'll receive" gradient card, deliverables, content deadline, an amber lock note ("Accepting locks this price and these deliverables. It can't be undone."), **Accept & confirm** + **Back to offer** |
| `confirmed` | View agreement (Offer and Deliverables screens), or after a successful accept | "Agreement confirmed · {acceptedAt}" (+ "Completed" badge), the same terms, **Close** |

**Money.** The creator sees only their own pay — the whole deal (F-2, F-6 in
`PAYMENT_ESCROW_BUSINESS_RULES.md`):

- `confirm`: the business's pending offer + `licensingMarkupMinor(amount, tier)`
  (tier 2 = +25%, tier 3 = +50%, integer division, mirroring the backend's
  accept trigger), with "Includes BDT X for paid-ad usage rights (+25%)" on
  tier 2/3. Needs CB2 for the tier; if CB2 fails the sheet shows "Couldn't load
  the campaign terms." with Retry and **no** Accept — the pay is never guessed.
- `confirmed`: the server's `agreedAmountMinor + licensingMarkupMinor` (null
  markup = 0); never recomputed. CB2 failing only drops the business row and
  the deadline ("No deadline set").

Never shown on either mode: platform fee, VAT, processing fee, the business's
total, or any payment / escrow copy (escrow is item 27). Amounts render as
"BDT 12,500"; screen readers hear "12,500 taka".

**Stale offers.** The sheet keeps the terms the creator pressed Accept on. If
CF4 returns `409` and the refetched thread no longer has that offer pending,
the sheet stays open with the server message and Accept disabled. If the
offer disappears before Accept is pressed, it shows "This offer is no longer
available." Closing or dragging the sheet down never accepts.

## States

- **Loading:** two row skeletons under the header.
- **Load error:** `CampaignsEmptyState` error variant with "Try again".
- **Busy:** all action buttons disabled while one request is in flight; the
  pressed button shows a spinner.

## Scope notes

- **No Figma frame.** Built from existing components and tokens; revisit when a
  negotiation design lands.
- **Campaign title comes from the list** (route param) because CF3 returns no
  campaign summary.
- **Escrow** (backend item 19 / mobile item 27) and offers inside Messaging
  (backend 22) are out of scope; the old "fund escrow by …" line was removed in
  feature 34. Offer expiry isn't shown — the offer summary has no `expiresAt`.
