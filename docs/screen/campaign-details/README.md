# Screen Specs — Campaign Details

| | |
|---|---|
| **Figma node** | [`6001:37641`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-37641&m=dev) — "Campaign Details_Sample 1" (original layout; the screen has since been redesigned, see "Presentation") |
| **Route** | `/campaign/[id]` (`app/(details)/campaign/[id].tsx`) |
| **Scene** | `scenes/campaigns/CampaignDetails.tsx` (+ `campaignDetails.style.ts`) |
| **Data** | CB2 `GET /feed/campaigns/:id` (`useGetFeedCampaignQuery`) |
| **Components used** | `CampaignCover`, `GlassBackButton`, `BusinessRow`, `BudgetCard`, `FactGrid`, `DetailSection`, `BriefSection`, `DeliverableList`, `AudienceGroups`, `ApplyBar` (`scenes/campaigns/components/details/`); `CampaignDetailsSkeleton`, `CampaignsEmptyState`; shared `FallbackImage`, `StatusBadge`, `ScreenHeader` |

## Purpose

The full view of one live campaign: what it is, who posted it, what it pays, when it's due, what to create, the business's brief and the audience - and the way to apply. Reached by tapping any campaign card in the app.

## User flow

```
any CampaignCard (Home, /campaigns, /live-campaign, /search, /business/[id])
  ▼
/campaign/[id]
  ├─ back (frosted button on the cover)  → router.back()
  ├─ tap the business row                → /business/[businessId]
  ├─ tap "Read more"                     → expands a long description
  ├─ tap a link in a "links" brief section → opens it in the browser
  └─ tap "Apply Now" (bottom bar)        → /campaign/[id]/apply (docs/screen/apply-campaign)
```

A `404` (campaign not live) or a missing `id` redirects to `/home`.

## Sections (top to bottom)

| # | Section | Content |
|---|---|---|
| 1 | Cover | Full-bleed cover photo (bundled fallback when none) under the status bar with a dark scrim; frosted back button; the engagement status ("Applied", "Invited", "Countered", "Accepted") top-right when the creator is engaged; up to 3 frosted category pills, the title and the location |
| 2 | Business | Avatar, business name + verified badge, "Posted {date}", arrow - opens the business profile |
| 3 | Budget card | Brand gradient: "CAMPAIGN BUDGET", the amount (or "Negotiable"), and a chip: "+25% / +50% licensing for usage rights" for tier 2 / 3, else "Final pay is agreed in your offer" |
| 4 | Fact tiles | 2-column grid: Apply by (+ "N days left" / "Closes today" / "Closed" chip, hidden once engaged), Content due, Campaign ends (only when set), Preferred gender |
| 5 | About this campaign | Description; over 240 characters it starts at 5 lines with "Read more" / "Show less" |
| 6 | What you'll create | Count chip with the total pieces, then one tile per deliverable: platform icon, "2 × Reels", platform |
| 7 | Promoting | Check list |
| 8 | Brief sections | One card per `requirements` section (minus the projected `deliverables` one), in `sortOrder`, rendered by `layout`: `list` → check list, `tags` → pills, `links` → tappable link rows, `code` → dashed promo-code box. `tone: 'danger'` makes the card red and the checks crosses; `hint` shows under the title |
| 9 | Audience | Labelled pill groups for whichever of audience location, age range, interests, niches and objectives are set; hidden when none are |
| 10 | Apply bar | Pinned to the bottom: "Apply by {date}" + the budget, and a gradient "Apply Now" pill. Disabled and muted with the engagement status when already engaged, or "Applications closed" (lock icon) once the deadline has passed - the backend `409`s both |

States: a skeleton in the same shape (cover + sheet blocks) with the back button floating over it while loading; `ScreenHeader` + `CampaignsEmptyState` error with retry when the request fails.

## Presentation

- Cover photo, frosted (`expo-blur`) pills and back button follow the glass campaign cards (`components/elements/CampaignCard`).
- The content is a sheet with 28px rounded top corners pulled up over the cover. Every block is a rounded `colors.card` card with a hairline border and a tinted Feather icon chip; accents come from `theme/accentTones.ts` (`toneColors`), which switches to low-alpha washes on the dark theme.
- Titles use ClashDisplay; the screen paints the cover's dark base above the content so an iOS overscroll bounce doesn't show a white strip.

## Logic

All in `scenes/campaigns/utils/mapCampaignDetails.ts` (unit-tested):

- `getDeadlineCountdown` - whole calendar days between today and the `YYYY-MM-DD` deadline in local time; "soon" (amber) at 3 days or fewer.
- `formatPostedDate`, `formatCategoryLabel` (content-category label, else the key capitalized), `getAudienceGroups`.
- Licensing percent comes from `licensingPercent(tier)` in `utils/agreement.ts`, the same table the agreement sheet uses.

## Scope notes

- The backend has no website link, follower requirement or business description on CB2, so the original Figma's "Visit website", "Follower wanted" and "About the business" are not shown.
- `StatTile`, `BulletList` and `InfoCard` are no longer used by this screen (`BulletList` and `InfoCard` still serve the gig screens; `StatTile` now has no callers), nor are the `assets/images/campaign-details/*.png` icons.

## Navigation

- **Entry:** any `CampaignCard` tap.
- **Exit:** back → `router.back()`; business row → `/business/[businessId]`; Apply Now → `/campaign/[id]/apply`.
