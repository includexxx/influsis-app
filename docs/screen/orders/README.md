# Screen Specs — Order

| | |
|---|---|
| **Figma nodes** | [`6212:5540`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6212-5540&m=dev) "Campaign" tab, [`6212:5843`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6212-5843&m=dev) "Gig order" tab, [`6212:6024`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6212-6024&m=dev) "Completed" tab, [`6403:5508`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6403-5508&m=dev) "Cancelled" tab (all "Order_Campaign", the same screen in its 4 tab states), plus [`6366:6730`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6366-6730&m=dev) "No Campaign Found" empty state and [`6574:6415`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6574-6415&m=dev) "No Gig Found" empty state |
| **Route** | `/order` (`app/(main)/order.tsx`, a bottom tab bar destination) |
| **Scene** | `scenes/main/Order.tsx` |
| **Data** | `data/orders.ts` (`orders`, filtered client-side by `tab`) |
| **Components used** | `ScreenHeader`, `CategoryChip`, `StatusBadge`, `EmptyState` (existing, reused unmodified); `OrderCard`, `OrderIllustration` (new, `components/elements/`) |

## Purpose

A creator's placed orders — campaign orders and gig orders — filtered by 4 pill tabs (Campaign / Gig order / Completed / Cancelled), each showing a photo, title, who it was ordered from, price, and a status badge. The "Gig order", "Completed" and "Cancelled" tabs' cards additionally show a due-date/ordered-date footer the "Campaign" tab's shorter card doesn't have. Reached from the bottom tab bar's "Order" tab (already built — see `docs/screen/main/README.md`).

## User flow

```
(main) tab bar
  │  tap "Order"
  ▼
/order                                  tab: Campaign (default)
  │  cards: photo, title, "Ordered from Bkash", price, "In Progress" badge
  │  no cards found → "No Campaign Found" empty state (EmptyState + OrderIllustration)
  │
  ├─ tap "Gig order" tab ─────────────▶  tab: Gig order
  │                                      cards: same fields + divider + "Due in N days" / "Ordered <date>" footer
  │                                      no cards found → "No Gig Found" empty state
  │
  ├─ tap "Completed" tab ─────────────▶  tab: Completed (same card shape as Gig order, green badge)
  │                                      no cards found → "No Completed Order Found" empty state
  │
  ├─ tap "Cancelled" tab ─────────────▶  tab: Cancelled (same card shape as Gig order, pink badge)
  │                                      no cards found → "No Cancelled Order Found" empty state
  │
  └─ back chevron (ScreenHeader) → router.push('/home')
```

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Order" title | `ScreenHeader` |
| 2 | Tab row | 4 pill tabs, horizontally scrollable | `CategoryChip` ×4 |
| 3 | Order list / empty state | Vertical stack of order cards, or a centered empty state when the active tab has none | `OrderCard` / `EmptyState` + `OrderIllustration` |

## New component: `OrderCard`

No existing card fits an order's field set. `CampaignCard` (`components/elements/CampaignCard/`) — already extended once for the Applications screen's `applied` variant (`docs/screen/apply-campaign/campaign-list.md`) — has no equivalent for an "Ordered from X" line or a due-date/ordered-date footer pair, and adding a 4th variant would mean threading two more optional fields (`dueDate` there already means something different: a single `CalendarBadge` date) through a component that already juggles 3 shapes. So `OrderCard` (`components/elements/OrderCard/`) is a new, genuinely order-specific component: image, title, `orderedFrom`, price and a `StatusBadge`, then — only when both `dueDate` and `orderedDate` are supplied — a divider line and a two-column footer row (clock icon + due date on the left, ordered date on the right). The "Campaign" tab's shorter 98px-tall card (Figma node 6212:6496) simply omits both props; the other three tabs' 143px-tall card (node 6212:6186) supplies them.

## New component: `OrderIllustration`

Figma's "No Campaign Found"/"No Gig Found" empty states reuse the exact same "Illustration" composition `SearchIllustration` (`components/elements/SearchIllustration/`) already implements for the Search screen — a 107px light-gray disc, a white "lens" circle with a soft shadow, and 4 small decorative dots at the same offsets — with only the center glyph and dot colors swapped (a package icon instead of a megaphone; warning-toned dots `#E58E13`/`#F7D360`/`#FEC84B` plus the same `#E5E7EB` gray instead of `SearchIllustration`'s pink/teal/gray/brand set). Rather than adding a conditional icon/color prop to `SearchIllustration` (which would blur its "search-specific" naming and its own doc comments), `OrderIllustration` duplicates the small amount of shared structure as a new, equally single-purpose component — matching how this project has consistently preferred a new narrowly-named component over an increasingly generic one (see `CampaignRequestCard`'s reasoning in `docs/screen/apply-campaign/campaign-list.md`).

## Scope notes

- **No real backend.** As with every other flow, there's no orders API (`docs/PRD.md` §2.2/§4.1) — content comes from `data/orders.ts`'s mock `orders` array, filtered client-side by `Order['tab']`. Cards aren't tappable yet (no order-detail screen exists in the Figma nodes given for this task).
- **A single flat `orders` array, not 4 separate arrays.** Unlike `data/applications.ts`'s `appliedCampaigns`/`campaignRequests` split (where the "Applied" and "Request" tabs render structurally different rows), every Order tab renders the exact same `OrderCard` shape — only the filter and status pairing differ — so one array with a `tab` field and a client-side `.filter()` (matching `scenes/main/Search.tsx`'s `filteredResults` pattern) avoids 4x'ing the same mock-data boilerplate.
- **Photos reuse existing Home assets** rather than exporting near-duplicates of Figma's stock thumbnails: the "Campaign" tab cycles through `assets/images/home/campaign-list-{1..4}.jpg` and `popular-campaign-{1..3}.jpg`; the "Gig order"/"Completed"/"Cancelled" tabs cycle through `assets/images/home/gig-{1,2}.jpg`, the same convention `data/applications.ts` and `data/campaigns.ts` already follow.
- **Content repeats across cards, mirroring Figma.** Every card in a tab reads the same title ("Social Media Management"), subtitle ("Ordered from Bkash" on the "Campaign" tab, "Ordered from Jhon Smith" elsewhere) and price ("$130") — Figma repeats this verbatim across every card instance on all 4 tabs, so the mock data does too rather than inventing distinct content.
- **One Figma color inconsistency normalized.** The "Campaign" tab's 7th card (node `6212:6646`) uses a green badge background while its label still reads "In Progress" (every other "In Progress" card on this screen uses the orange/warning pairing). Treated as a one-off Figma slip and normalized to the consistent orange pairing, matching this project's established normalization practice (see `docs/screen/search/README.md`'s "One card layer dropped").
- **Status colors read straight from `palette`, matching Figma's hex values exactly:** "In Progress" → `warning[100]`/`warning[500]` (`#FEF0C7`/`#F79009`), "Completed" → `secondary[50]`/`secondary[400]` (`#D7FFE8`/`#09DE67`), "Cancelled" → `primary[50]`/`primary[400]` (`#FDE6F5`/`#F42E9E`) — all three pairings already exist in `theme/colors.ts` and needed no new tokens.
- **"Completed"/"Cancelled" empty states are a documented extension, not a Figma capture.** Only the "Campaign" and "Gig order" tabs' empty states were included in this task's Figma nodes. The other two tabs reuse the identical `EmptyState` + `OrderIllustration` pairing with a title that extends the same "No `<Tab>` Found" pattern ("No Completed Order Found" / "No Cancelled Order Found") and Figma's own description copy verbatim ("When we add collections. They'll be appear here") — added for consistency (mock data always has entries for all 4 tabs today, so these don't currently render) rather than left as a dead code path.
- **Header back button returns to Home, not `router.back()`.** Figma's header shows the same "< Order" shape `ScreenHeader` already implements (unlike Home/Search's `AppHeader` wordmark+bell), but Order is a tab-root screen with no push-stack history to pop — `onBack` calls `router.push('/home')` instead, the same destination `AppHeader`'s wordmark navigates to elsewhere in this app.
- **Filter tab row scrolls horizontally** (`ScrollView horizontal`), matching `Search.tsx`'s category-chip row, even though all 4 chips fit on Figma's own 430px reference frame — a safety margin for narrower devices rather than a Figma-specified interaction.
- **Assets.** Extracted via the Figma Dev Mode MCP server into `assets/images/icons/clock.png` (OrderCard's due-date icon) and `assets/images/order/package-icon.png` (OrderIllustration's glyph), rasterized from SVG via `scripts/rasterize-order-assets.py` — see that script's own header comment for why the package icon, unlike every other single-layer icon this project has extracted so far, needed a 7-layer composite (Figma's own box-icon vector network has no single-color equivalent, and it's too detailed to reproduce as plain `View`s the way the illustration's 4 dots are).

## Navigation

- **Entry:** bottom tab bar's "Order" tab (`app/(main)/_layout.tsx`).
- **Exit:** tab bar switches to Home/Order/Create Gig/Message/Profile as normal, or the header's back chevron → `router.push('/home')`.
