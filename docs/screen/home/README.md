# Screen Specs — Home

| | |
|---|---|
| **Figma node** | [`6121:6522`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6121-6522&m=dev) — "Home" |
| **Route** | `/home` (`app/(main)/home.tsx`) |
| **Scene** | `scenes/home/Home.tsx` (+ `home.style.ts`, `components/`, `hooks/useHomeRefresh.ts`, `utils/greeting.ts`) |
| **Data** | Real APIs, one per section (see "Sections"); `GET /profiles/me` for the greeting and earnings card |
| **Components used** | `AppHeader`, `SectionHeader`, `CampaignCard` (`components/elements/`); `HomeGreeting`, `EarningsCard`, `QuickActions`, `AvatarTile` (`scenes/home/components/`); `BusinessAvatar`, `CreatorAvatar` |

## Purpose

The Home tab of the main app shell (`app/(main)`, see [`docs/screen/main/README.md`](../main/README.md)) — a feed of campaigns, businesses, and creators a creator can browse. This replaces the placeholder Home tab that shipped with the main app shell.

## User flow

```
/home  (default tab on entering the app shell)
  │
  ├─ pull down                      → refreshes every section (useHomeRefresh)
  ├─ tap notification bell        → /notifications (docs/screen/notifications/README.md)
  ├─ earnings card: "Find campaigns to earn" → /campaigns; "Withdraw now" → /withdraw/method;
  │                 "Need help?" → /help-center
  ├─ quick actions: Applications → /applications; My work → /live-campaign;
  │                 Transactions → /transactions; Messages → /message
  ├─ tap "See all" on Active Campaigns → /live-campaign (docs/screen/live-campaign/README.md)
  ├─ tap "See all" on Business        → /businesses (docs/screen/businesses/README.md)
  ├─ tap "See all" on Popular Campaigns → /campaigns (docs/screen/campaigns/README.md)
  ├─ tap "See all" on Campaigns    → /campaigns (docs/screen/campaigns/README.md)
  ├─ tap "See all" on Top Gigs     → /top-gigs (docs/screen/top-gigs/README.md)
  ├─ tap "See all" on Top Rated Creator → /top-creators (docs/screen/top-creators/README.md)
  ├─ tap a CampaignCard            → /campaign/[id] (docs/screen/campaign-details/README.md);
  │                                   an Active Campaigns card → /engagement/[id]/deliverables (item 25)
  ├─ tap a business logo              → /business/[id] (docs/screen/business-details/README.md)
  ├─ tap a CampaignMiniCard        → (no campaign-detail screen yet - inert)
  ├─ tap a GigCard                 → /gig/[id] (docs/screen/gig-details/README.md)
  ├─ tap a Top Rated Creator avatar → /creator/[id] (docs/screen/creator-profile/README.md)
  └─ tap Home/Order/Create Gig/Message/Profile → switches tab (docs/screen/main/README.md)
```

Every tap target above that has no destination screen yet is intentionally inert (no `onPress`) rather than routed somewhere fake — see "Scope notes" below. `CampaignMiniCard`'s "Popular Campaigns" row is a separate, differently-shaped component (`id, image, startedLabel, title` only — no price/business/detail fields), so it stays inert rather than being force-fit into the `Campaign`-typed `/campaign/[id]` route.

## Sections (top to bottom)

| # | Section | Layout | Component / data |
|---|---|---|---|
| 1 | Header | "Influsis." wordmark + a 44pt bell icon button (optional unread dot via `hasUnread`) | `AppHeader` |
| 2 | Greeting | "Good morning 👋" (afternoon / evening by local time) + the creator's first name (falls back to `@handle`) | `HomeGreeting`, `utils/greeting.ts`; `GET /profiles/me` |
| 3 | Earnings card | Dark wallet card: verification badge + "Need help?", "Total earned", name · "Creator since …", a white "Find campaigns to earn" button, and a green "Withdraw now" bar | `EarningsSection` → `EarningsCard`; earnings from completed engagements |
| 4 | Quick actions | Four labelled icon tiles: Applications, My work, Transactions, Messages | `QuickActions` |
| 5 | Active Campaigns | Horizontal carousel of cover cards sized to the screen, the next one peeking in, snapping one at a time (a lone card is full width) | `CampaignCard` (`variant="hero"`); CF2 `GET /me/engagements?engagementStatus=accepted` |
| 6 | Businesses | Horizontal row of named avatar tiles (ring, name, verified check) | `AvatarTile` + `BusinessAvatar`; `GET /business-profiles` |
| 7 | New Campaigns | Vertical stack of cover cards | `CampaignCard` (`variant="list"`); CB1 `GET /feed/campaigns` |
| 8 | Top Rated Creators | Horizontal row of named avatar tiles | `AvatarTile` + `CreatorAvatar`; `GET /creator-profiles` |

Every section header (`SectionHeader`) has a title, a one-line subtitle and a
"See all" button with a chevron (hidden when there's nowhere to go). Each
section loads, fails and retries on its own (skeletons → content, or an
error state with "Try again"). Pull to refresh refetches all of them through
`useHomeRefresh`, which subscribes to the same cache entries the sections read
(no extra requests). The search bar, Popular Campaigns and Top Gigs sections
are present in `Home.tsx` but commented out.

The header, greeting, earnings card and quick actions sit closer together
(`homeStyle.topGroup`, 16px) than the content sections below (32px), so they
read as one "you" block.

## `CampaignCard` — cover cards

`hero` (Active Campaigns) and `list` (New Campaigns, and the Campaigns, Live
Campaigns, Business details and Search screens) are cover cards with a
glassmorphism panel:

| | `hero` | `list` |
|---|---|---|
| Height | 220px | 262px |
| Cover | full-bleed photo under a soft top/bottom scrim | same |
| Top | frosted tag pills (gender) left, status pill right | same |
| Glass panel | `expo-blur` panel + translucent tint + hairline border: business avatar, title (1 line), business name + verified badge, white price chip, glass date chip | same, title up to 2 lines, plus the deliverables line (layers icon) |

On Android, where `expo-blur` doesn't blur by default, the tint and border
carry the glass look. The `applied` variant (Applications) is a compact row
instead — see `docs/screen/apply-campaign/campaign-list.md`. Loading uses
`CampaignCardSkeleton` in the same shapes.

## Scope notes

- **Redesign.** Home was redesigned after the backend wiring: greeting, quick actions, pull to refresh, the restyled earnings card, cover-card campaigns with a glass panel, named avatar tiles, section subtitles and an accessible "See all" button (all touch targets ≥44pt, icons always paired with a label). The notes below that mention `data/home.ts` describe the original mock build; the visible sections now read the real APIs listed under "Sections".
- **No real backend (original build).** At first there was no campaigns/gigs/creators API (`docs/PRD.md` §2.2/§4.1) — all content came from `data/home.ts`, a set of typed mock arrays (`Campaign[]`, `Gig[]`, plain avatar arrays) using `Campaign`/`Gig` types added to `types/`.
- **Inert tap targets.** `CampaignMiniCard` still isn't wired to an `onPress` handler — its "Popular Campaigns" content doesn't fit the `Campaign` shape (`docs/screen/campaign-details/README.md` "Scope notes"), so there's no detail screen for it to route to. Rather than invent a fake destination, it's left visually-complete but non-functional per Figma, matching this project's established pattern of not building ahead of what's been designed. Every other tap target now goes somewhere: the notification bell, search bar, every section header's "See all" link (`/notifications`, `/search`, `/live-campaign`, `/businesses`, `/campaigns`, `/top-gigs`, `/top-creators`), `CampaignCard` taps → `/campaign/[id]`, business logo taps → `/business/[id]`, `GigCard` taps → `/gig/[id]`, and Top Rated Creator avatar taps → `/creator/[id]` (see those screens' specs). Popular Campaigns' "See all" also points at `/campaigns` — there's no separate "popular campaigns" detail screen, and it's the closest existing match.
- **Top Rated Creator avatars now carry real identity.** Previously five plain, id-less `creator-1..5.jpg` headshots; now four `{id, image}` pairs sourced from the canonical `data/creators.ts` (down from five to four, matching how many named creators actually exist) — see `docs/screen/creator-profile/README.md` "Data consolidation".
- **Simplified hero card logo.** Figma's hero card layers a small 31×30 logo image directly on top of the 40×40 circular business avatar. Only the circular avatar is reproduced here — the extra overlaid logo added visual clutter for no clear purpose and the screenshot reads correctly without it.
- **One verified-badge asset.** Figma exports a slightly different verified-badge icon for the hero card (`8e51b88d...`) vs. the four list cards (`fa063f12...`) — visually the same pink checkmark badge. Standardized on the list version's asset (used 4x vs. hero's 1x) rather than shipping two near-identical assets.
- **Due-date icon/color normalized.** One of the four "Campaigns" list card instances (Figma) uses a plain calendar icon and black due-date text instead of the "fi-sr-calendar" icon + pink text every other instance (including the hero card) uses. Treated as a one-off Figma inconsistency and normalized to the majority pattern via the shared `CalendarBadge` component.
- **Avatar row spacing normalized.** The Business and Top Rated Creator rows' circle-to-circle gaps vary 14-16px between individual instances in Figma. Normalized to a flat 12px gap (`styles/home.ts`'s `homeStyle.avatarListGap`).
- **Assets.** Extracted via the Dev Mode MCP server into `assets/images/home/` — icons (notification bell, search, verified badge, the two-layer "fi-sr-calendar" icon) rasterized from SVG same as every other screen's icons; photos downscaled/JPEG-compressed from multi-MB Figma originals via `scripts/resize-home-assets.py` (same approach as `scripts/resize-onboarding-assets.py`), cutting the section from ~11.5MB to a few hundred KB.
- **Duplicate mock content.** Figma's own "Popular Campaigns" and "Campaigns" sections repeat "Bkash Branding Campaign" / "Bkash Ltd." across every instance, differing only by photo and (for two of the four "Campaigns" cards) whether a services line is present. `data/home.ts` mirrors this rather than inventing distinct campaign names Figma doesn't specify.

## Navigation

- **Entry:** default tab when landing in `app/(main)` — see `docs/screen/main/README.md` for how a user gets there (Sign In, or the profile-verification wizard's completion screen).
- **Exit:** none from this screen itself; tab bar switches to Order/Create Gig/Message/Profile as normal.
