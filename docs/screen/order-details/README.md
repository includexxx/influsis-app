# Screen Specs — Order Details

| | |
|---|---|
| **Figma node** | [`6040:8515`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6040-8515&m=dev) — "Order details" |
| **Route** | `/order/[id]` (`app/(details)/order/[id].tsx`) |
| **Scene** | `scenes/main/OrderDetails.tsx` |
| **Data** | `data/orders.ts` (`orders`, looked up by `id`) |
| **Components used** | `ScreenHeader`, `Image`, `Button`, `BulletList` (existing; `BulletList` gained a new optional `color` prop) — all reused unmodified otherwise |

## Purpose

A single order's full detail view — banner photo, title, total price, who it was ordered from (with a verified badge) and the delivery date, a "Deliverable" checklist, a "Requirements" bullet list, and two CTA buttons (Delivery / Message). Opened by tapping any order card on the [Order](../orders/README.md) screen, regardless of which of its 4 filter tabs the tap came from.

## User flow

```
/order                                  any filter tab (Campaign/Gig order/Completed/Cancelled)
  │  tap an order card (OrderCard)
  ▼
/order/[id]
  │  header: back chevron + "Order details"
  │  banner photo (reuses the tapped card's own image)
  │  title + "Total Price"
  │  "Order: {brand} ✓  |  Delivery: {date}"
  │  pink "Deliverable" card — 3 checklist items
  │  "Requirements" — bullet list
  │  "Delivery" button (inert) / "Message" button (inert)
  │
  └─ back chevron (ScreenHeader) → router.back() to /order
```

If a stale/unknown id is opened directly (e.g. a bad deep link), the scene redirects to `/order` rather than rendering a broken screen, the same fallback `CampaignDetails`/`GigDetails` use for their own dynamic routes.

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Order details" title | `ScreenHeader` |
| 2 | Banner photo | Inset (not edge-to-edge) photo, rounded top corners only | `Image` |
| 3 | Title + price | Title left, "Total Price" label/value right | plain `Text` |
| 4 | Order/Delivery meta | Brand name (pink, verified badge) — divider — delivery date | plain `View`/`Text` + `Image` (verified badge) |
| 5 | Deliverable | Pink card, heading + 3 checkmark-icon rows (title + description) | plain `View`/`Text` + `Image` (checkmark icon) |
| 6 | Requirements | Heading + bullet list | `BulletList` |
| 7 | CTA buttons | Filled "Delivery" button, outlined "Message" button | `Button` |

## Extended component: `BulletList`'s new `color` prop

`BulletList` (built for Gig Details' "Description of this Gig" bullets) rendered both its bullet glyph and text in a hardcoded `palette.gray[400]`. This screen's "Requirements" list uses Figma's lighter `gray[300]` instead — the same color `Campaign`/`Order` list screens already use for secondary copy — so rather than duplicating the whole component for a one-color difference, `color` was added as an optional prop (defaulting to the original `gray[400]`, so every existing caller — `GigDetails`, `CampaignDetails` — is unaffected).

## No new card/list component needed for "Deliverable"

Unlike `CampaignDetails`' "What you need to create" section (each deliverable rendered as its own separate `InfoCard`), Figma's "Deliverable" section here is a single pink card containing all 3 items with a small checkmark icon per row — a different-enough shape (one shared card background, an icon column) that reusing `InfoCard` per-item wouldn't reproduce it, but also not different enough to justify a new reusable component for a single-screen layout. Built directly in `scenes/main/OrderDetails.tsx` with `styles/orderDetails.ts` fragments instead.

## Scope notes

- **No real backend, and no dedicated detail content per order.** As with every other flow, there's no orders API (`docs/PRD.md` §2.2/§4.1). Figma's node shows one example order (title "Summer Fashion Collection showcase" in the raw export, brand "Bkash Ltd.", $120, 3 identical "Instagram Post" deliverables, 3 requirements) — the detail-only fields (`brandName`, `brandVerified`, `deliveryDate`, `deliverables`, `requirements`) are applied identically to every order in `data/orders.ts` via a shared `detailFields` object, the same pattern `data/campaigns.ts`'s own `detailFields` already established for Campaign Details. **Title and price are the exception**: rather than also hardcoding Figma's unrelated "Summer Fashion Collection showcase" / "$120" sample copy, the detail screen renders the *tapped card's own* `title`/`price` (the same `Order` object `OrderCard` used), so opening a card's detail view doesn't show different copy than the card the user just tapped.
- **Deliverable items kept verbatim, including their repetition.** Figma's 3 "Deliverable" items are literally identical ("Instagram Post" / "1 carousel post (3-5 images) featuring the products" × 3) — mirrored as-is rather than assumed to be a copy-paste error, unlike `data/campaigns.ts`'s own corrupted "About the brand" paragraph (which was visibly garbled text, not plausible repeated content).
- **Deliverable card padding normalized.** Figma's card content group has asymmetric horizontal padding (12px left, 36px right, node `6040:8548` vs its `6040:8547` parent) — read as an unintentional auto-layout artifact and normalized to a single symmetric `spacing.lg` (16px) value.
- **CTA buttons are inert.** Neither "Delivery" nor "Message" has an `onPress` — Figma doesn't specify what either does, and this project's chat feature (`/chat/[id]`) has no established mapping from an order to a specific conversation to link "Message" to. Matches this project's established "don't build interactions beyond what's been designed" convention (see `docs/screen/search/README.md`'s "Category chips are visual-only").
- **Assets.** The back chevron reuses `ScreenHeader`'s existing icon; the pink "verified" badge next to the brand name is pixel-identical to the existing `assets/images/home/verified-badge.png` (same glyph, reused as-is rather than re-exported). Only the "Deliverable" checklist's outlined check-in-circle icon had no existing match — extracted into `assets/images/order-details/check-circle.png` via `scripts/rasterize-order-details-assets.py`.
- **Literal `#313131` color kept as-is.** The price value and deliverable item titles use a Figma hex that doesn't cleanly map to any `palette.gray` step (closest is `gray[400]` `#4A4C56`, visibly lighter) — used directly in `styles/orderDetails.ts` rather than snapped to an inexact token, the same reasoning `StatusBadge`'s own literal-hex defaults already follow.

## Navigation

- **Entry:** any `OrderCard`'s tap on `/order`, all 4 filter tabs (`scenes/main/Order.tsx`'s `onPress={() => router.push(\`/order/${order.id}\`)}`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to `/order`. An unknown `id` redirects to `/order` instead of rendering.
