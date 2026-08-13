# Screen Specs — Home

| | |
|---|---|
| **Figma node** | [`6121:6522`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6121-6522&m=dev) — "Home" |
| **Route** | `/home` (`app/(main)/home.tsx`) |
| **Scene** | `scenes/main/Home.tsx` |
| **Data** | `data/home.ts` |
| **Components used** | `SectionHeader`, `CampaignCard`, `CampaignMiniCard`, `GigCard`, `CircleAvatar`, `CalendarBadge` (all new, `components/elements/`) |

## Purpose

The Home tab of the main app shell (`app/(main)`, see [`docs/screen/main/README.md`](../main/README.md)) — a feed of campaigns, brands, and influencers a creator can browse. This replaces the placeholder Home tab that shipped with the main app shell.

## User flow

```
/home  (default tab on entering the app shell)
  │
  ├─ tap notification bell        → /notifications (docs/screen/notifications/README.md)
  ├─ tap search bar                → /search (docs/screen/search/README.md)
  ├─ tap "See all" on any section  → (no destination screen yet - inert)
  ├─ tap a CampaignCard            → (no campaign-detail screen yet - inert)
  ├─ tap a CampaignMiniCard        → (no campaign-detail screen yet - inert)
  ├─ tap a GigCard                 → (no gig-detail screen yet - inert)
  └─ tap Home/Order/Create Gig/Message/Profile → switches tab (docs/screen/main/README.md)
```

Every tap target above that has no destination screen yet is intentionally inert (no `onPress`) rather than routed somewhere fake — see "Scope notes" below.

## Sections (top to bottom)

| # | Section | Layout | Card/item component |
|---|---|---|---|
| 1 | Header | "Influsis." wordmark + notification bell | — |
| 2 | Search bar | Non-editable search entry point, navigates to `/search` | — |
| 3 | Active Campaigns | Horizontal scroll, 370px cards | `CampaignCard` (`variant="hero"`) |
| 4 | Brand | Horizontal scroll, 80px circular logos | `CircleAvatar` |
| 5 | Popular Campaigns | Horizontal scroll, 127px compact cards | `CampaignMiniCard` |
| 6 | Campaigns | Vertical stack, full-width cards | `CampaignCard` (`variant="list"`) |
| 7 | Top Gigs | Horizontal scroll, 356px cards | `GigCard` |
| 8 | Top Rated Influencer | Horizontal scroll, 80px circular avatars | `CircleAvatar` |

Sections 3, 5, 7, and 8 all use the same confirmed 8px gap between items (verified against Figma's pixel positions); section 1-2 and 4/8's avatar rows are auto-layout with default project spacing where Figma's own gaps were inconsistent between instances (see below).

## `CampaignCard` — hero vs. list variant

Both variants (Figma nodes `6770:6078` for hero, `6121:6627`/`6659`/`6684`/`6709` for list) share the same DNA — image with gender-tag pills overlaid on its bottom-left corner, title with an optional verified badge, a price + due-date footer row — but differ in a few ways the component's `variant` prop controls:

| | `hero` (Active Campaigns) | `list` (Campaigns) |
|---|---|---|
| Corner radius | 16px | 12px |
| Shadow | none | `0px 2px 15.5px rgba(0,0,0,0.1)` |
| Brand identity | circular avatar overlapping the image, next to the title | plain "Brand Ltd." text line below the title |
| Services description | not shown | optional gray line (e.g. "3 Tiktok Video, 1 Youtube Reel, 2 Facebook Post") |

## Scope notes

- **No real backend.** As with every other flow so far, there's no campaigns/gigs/creators API (`docs/PRD.md` §2.2/§4.1) — all content comes from `data/home.ts`, a set of typed mock arrays (`Campaign[]`, `Gig[]`, plain avatar arrays) using `Campaign`/`Gig` types now added to `types/`. This is the first screen in the app with enough repeated structured content to warrant its own data module rather than inline arrays in the scene file — future screens with similar list content should follow the same `data/<screen>.ts` pattern.
- **Inert tap targets.** Every "See all" link and every card are not wired to `onPress` handlers — there's no campaign/gig detail screen built yet. Rather than invent fake destinations, these are left as visually-complete but non-functional per Figma, matching this project's established pattern of not building ahead of what's been designed. The notification bell and search bar are the exceptions — they navigate to `/notifications` (docs/screen/notifications/README.md) and `/search` (docs/screen/search/README.md) respectively.
- **Simplified hero card logo.** Figma's hero card layers a small 31×30 logo image directly on top of the 40×40 circular brand avatar. Only the circular avatar is reproduced here — the extra overlaid logo added visual clutter for no clear purpose and the screenshot reads correctly without it.
- **One verified-badge asset.** Figma exports a slightly different verified-badge icon for the hero card (`8e51b88d...`) vs. the four list cards (`fa063f12...`) — visually the same pink checkmark badge. Standardized on the list version's asset (used 4x vs. hero's 1x) rather than shipping two near-identical assets.
- **Due-date icon/color normalized.** One of the four "Campaigns" list card instances (Figma) uses a plain calendar icon and black due-date text instead of the "fi-sr-calendar" icon + pink text every other instance (including the hero card) uses. Treated as a one-off Figma inconsistency and normalized to the majority pattern via the shared `CalendarBadge` component.
- **Avatar row spacing normalized.** The Brand and Top Rated Influencer rows' circle-to-circle gaps vary 14-16px between individual instances in Figma. Normalized to a flat 12px gap (`styles/home.ts`'s `homeStyle.avatarListGap`).
- **Assets.** Extracted via the Dev Mode MCP server into `assets/images/home/` — icons (notification bell, search, verified badge, the two-layer "fi-sr-calendar" icon) rasterized from SVG same as every other screen's icons; photos downscaled/JPEG-compressed from multi-MB Figma originals via `scripts/resize-home-assets.py` (same approach as `scripts/resize-onboarding-assets.py`), cutting the section from ~11.5MB to a few hundred KB.
- **Duplicate mock content.** Figma's own "Popular Campaigns" and "Campaigns" sections repeat "Bkash Branding Campaign" / "Bkash Ltd." across every instance, differing only by photo and (for two of the four "Campaigns" cards) whether a services line is present. `data/home.ts` mirrors this rather than inventing distinct campaign names Figma doesn't specify.

## Navigation

- **Entry:** default tab when landing in `app/(main)` — see `docs/screen/main/README.md` for how a user gets there (Sign In, or the profile-verification wizard's completion screen).
- **Exit:** none from this screen itself; tab bar switches to Order/Create Gig/Message/Profile as normal.
