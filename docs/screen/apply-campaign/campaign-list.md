# Screen Specs — Applications (Applied / Request)

| | |
|---|---|
| **Figma nodes** | [`6015:7090`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6015-7090&m=dev) ("List", "Applied" tab selected) and [`6475:6394`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6475-6394&m=dev) ("List", "Request" tab selected) — the same screen, captured in its two tab states |
| **Route** | `/applications` (`app/(details)/applications.tsx`) |
| **Scene** | `scenes/main/Applications.tsx` |
| **Data** | `data/applications.ts` (`appliedCampaigns`, `campaignRequests`) |
| **Components used** | `ScreenHeader`, `CategoryChip` (existing, reused unmodified); `CampaignCard` (existing, extended with a new `applied` variant); `CampaignRequestCard` (new, `components/elements/`) |

## Purpose

A creator's own applications view, reached from Profile: an **Applied** tab listing campaigns they've submitted an application to (photo, pink "Applied" badge, applied date, price, title), and a **Request** tab listing invitations businesses have sent them to join a campaign, each with Accept/Decline actions. This is the natural "what happened after I applied" screen for the [Apply Campaign](./README.md) flow, though Figma models it as a standalone list rather than a step chained onto the application flow itself — there's no automatic hand-off from submitting an application to landing here.

## User flow

```
/profile
  │  tap "My Applications"
  ▼
/applications                          tab: Applied (default)
  │  cards: photo, "Applied" badge, applied date, price, title
  │
  ├─ tap "Request" tab ──────────────▶  tab: Request
  │                                      rows: business logo, "{Business} invited you to
  │                                      join a Campaign", timestamp, Accept/Decline
  │                                        │  tap Accept or Decline
  │                                        ▼
  │                                      row removed from the list (local state only)
  │
  └─ back chevron (ScreenHeader) → router.back() to /profile
```

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "List" title | `ScreenHeader` |
| 2 | Tab row | Two pill tabs, "Applied" / "Request" | `CategoryChip` ×2 |
| 3a | Applied list (tab: Applied) | Vertical stack of cards — image with badge, then applied-date/price row, then title | `CampaignCard` (`variant="applied"`) |
| 3b | Request list (tab: Request) | Vertical stack of rows — logo, invite copy + timestamp, Accept/Decline buttons | `CampaignRequestCard` |

## Extended component: `CampaignCard`'s new `applied` variant

Rather than building a third card component from scratch, `CampaignCard` (already reused across Home, Campaigns, Live Campaigns and Search) gained a third `variant`, `'applied'`, plus optional `statusColor`/`statusTextColor` props on its existing `status` badge slot (previously always the green `#B2FFD2` "Ongoing" tone). The `applied` variant keeps the same rounded-corner/shadow card shell and top-right `StatusBadge` overlay as `list`, but swaps the content area: a date/price row (plain text, not `list`'s `CalendarBadge` pill, and reversed left/right vs. `list`'s price/CalendarBadge order) sits above the title instead of below a business-name/services block, matching this screen's Figma layout (node `6015:7202` and its 3 siblings) pixel-for-pixel per its own gaps (14px image→row, 8px row→title, 20px bottom padding, vs. `list`'s 20/8/14). No business name, verified badge, gender tags or services line are shown in this variant, since Figma doesn't show them here.

## New component: `CampaignRequestCard`

No existing card in this app pairs a leading avatar with two trailing action buttons — `ConversationCard`'s trailing slot is a time/unread-count stack, and `NotificationCard` has no actions at all — so this is a genuinely new, reusable component (`components/elements/CampaignRequestCard/`). Layout and spacing (88×88 rounded-square logo, 8px gaps, 53×23 pill buttons) are taken directly from Figma's own pixel positions (node `6475:6500` and its 6 siblings).

## Scope notes

- **No real backend.** As with every other flow, there's no applications API (`docs/PRD.md` §2.2/§4.1) — content comes from `data/applications.ts`'s mock arrays. Accepting or declining a request just removes it from local component state (`scenes/main/Applications.tsx`'s `useState`); nothing is sent anywhere, and declined/accepted items don't move to any other list.
- **`get_design_context` was unavailable for this entire screen.** Every call (the full frame, individual cards, even a single leaf text node) timed out consistently across repeated retries at decreasing node sizes — the same failure mode already noted for two icons in `docs/screen/apply-campaign/README.md`, but here affecting the whole screen rather than a couple of glyphs. Implementation instead relied on `get_metadata` (exact layer names/positions/sizes, giving the pixel-precise gaps cited above), `get_screenshot` (colors, visual confirmation), and `get_variable_defs` (`Brand Color #F42E9E`, `Gray 900 #030304`, `Gray 50 #E9E9EA`, `White #FFFFFF` — all directly mapped to existing `palette` tokens). No exact CSS/asset-URL export was available at any point.
- **Header title is Figma's own literal text, "List".** Both tab states' header reads "List" (matching the frame's own layer name), not a screen-specific title like every other pushed screen in this app ("Live Campaigns", "Notifications", "Campaigns", ...). Kept verbatim per this project's practice of preserving real Figma copy rather than inventing replacement text — this doc and the PRD instead use "Applications" as the descriptive name for indexing purposes, the same way `docs/screen/apply-campaign/README.md` describes its own header-less screen by its purpose rather than any on-screen title.
- **Tab default state.** Node `6015:7090` (the node this task was given first) shows "Applied" selected; the scene defaults to that tab (`useState<ApplicationsTab>('applied')`).
- **Header-to-tabs gap picked as a single value.** Figma's two captured frames measure this gap differently (34px on the "Applied" state, 16px on the "Request" state) despite being the same screen — `styles/applications.ts`'s `headerGap` (24px) is a single in-between value rather than a gap that changes when the tab switches, which Figma itself doesn't visually do.
- **Applied-tab photos reuse existing Home assets**, chosen by closest visual match to Figma's screenshot rather than exporting new ones: `popular-campaign-1.jpg` (skincare ad) for cards 1 and 4, `campaign-list-3.jpg` (drinks collage) for card 2, `campaign-list-2.jpg` ("Style Your Speed") for card 3 — two of these are exact matches, the other two are the closest available substitute. Title/price/applied-date ("Bkash Branding Campaign" / "$299.99" / "Applied 10 July") are repeated across all 4 cards, mirroring Figma's own duplicate content, the same convention `data/campaigns.ts` and `data/liveCampaigns.ts` already follow.
- **Request-tab business logos reuse existing assets too, with two documented mismatches.** KFC/Bkash/Pathao map 1:1 to their real existing entries (`assets/images/home/business-logo-2/1/3.jpg`). "Grameen" reuses `assets/images/businesses/gp.jpg` — a real match, since `data/businesses.ts`'s own "GP" entry (`business-11`) *is* Grameenphone. "Go zayn" has no existing real-business asset in this project, so it reuses `assets/images/businesses/robi.jpg` as a mismatched stand-in, following the exact precedent `data/businesses.ts` already documents for its own "Bkash Ltd" label on the Bata logo. The 7th request card keeps Figma's *own* internal mismatch (its text reads "KFC invited you to join a Campaign" but its logo instance is visibly Pathao's) rather than silently correcting it.
- **Entry point is a new addition, not an existing inert placeholder.** Unlike Live Campaigns (which wired an already-present "Active Campaigns" See-all link) or Campaigns (Home's own "Campaigns" See-all), no Figma frame in this task pointed to this screen, and Profile (`scenes/main/Profile.tsx`) previously had no navigation affordances at all — it was a read-only field dump. A "My Applications" text link was added under the username, the same pink-link treatment `AppHeader`'s wordmark already uses, as the most direct, lowest-risk entry point given the screen's content is explicitly about "my" applications/requests.
- **Accept/Decline colors sourced from Figma's own variable definitions** (`Gray 900`/`Gray 50`, confirmed via `get_variable_defs` even though `get_design_context` itself was unavailable), not visually estimated — see `CampaignRequestCard`'s own header comment.

## Navigation

- **Entry:** "My Applications" link on `/profile` (`scenes/main/Profile.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to `/profile`.
