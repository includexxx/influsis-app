# Screen Specs — Campaigns

| | |
|---|---|
| **Figma node** | [`6010:17065`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-17065&m=dev) — "All Campaigns" |
| **Route** | `/campaigns` (`app/(details)/campaigns.tsx`) |
| **Scene** | `scenes/main/Campaigns.tsx` |
| **Data** | `data/campaigns.ts` |
| **Components used** | `ScreenHeader`, `CampaignCard` — both existing, reused unmodified |

## Purpose

A flat list of all of a creator's campaigns. Reached from the Home tab's Campaigns section.

## User flow

```
/home
  │
  └─ tap "See all" on Campaigns (SectionHeader) → /campaigns
                                                      │
                                                      ├─ tap back chevron (ScreenHeader) → back to /home
                                                      └─ tap a campaign card             → /campaign/[id] (docs/screen/campaign-details/README.md)
```

`/campaigns` lives in the `app/(details)/` route group (outside the `(main)` Tabs group), the same reasoning as `/notifications` and `/live-campaign` (docs/screen/live-campaign/README.md "Navigation") — Figma's frame has no tab bar instance, so it's pushed full-screen and popped via the back chevron rather than kept inside the tab shell.

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Campaigns" title | `ScreenHeader` |
| 2 | Campaign list | Vertical stack, full-width cards | `CampaignCard` (`variant="list"`, gender tags, optional services line) |

## No new components needed

Every piece of this screen already existed before this task. `ScreenHeader` (built for `/notifications`) and `CampaignCard`'s `list` variant (built for Home, already supporting gender tags, a verified badge, business name, and an optional services-description line) reproduce this design exactly as-is — Figma's cards here are structurally identical to Home's own "Campaigns" section cards, right down to the same `0px 2px 15.5px rgba(0,0,0,0.1)` shadow and `#B2FFD2` tag-pill color already implemented. This screen is purely a new composition of existing reusable pieces plus its own data and a small `styles/campaigns.ts` module for its list-gap spacing — see "Reuse First" in `CLAUDE.md`.

## Scope notes

- **No real backend.** As with every other flow so far, there's no campaigns API (`docs/PRD.md` §2.2/§4.1) — content comes from `data/campaigns.ts`'s mock `Campaign[]` array (now the canonical campaign list every campaign-related screen shares — see `docs/screen/campaign-details/README.md` "Data consolidation"), reusing the existing `Campaign` type and the campaign photos already extracted for Home (`assets/images/home/*.jpg`) rather than exporting duplicates.
- **Now tappable.** Each card's `onPress={() => router.push(\`/campaign/${item.id}\`)}` (`scenes/main/Campaigns.tsx`) leads to Campaign Details — see `docs/screen/campaign-details/README.md`.
- **Duplicate mock content.** Figma repeats "Bkash Branding Campaign" / "Bkash Ltd." across all four cards, differing only by photo and whether the services-description line is present (the first card omits it, the other three include it) — mirrored here rather than inventing distinct campaign names Figma doesn't specify, same as `data/home.ts`, `data/search.ts` and `data/liveCampaigns.ts`.
- **List gap confirmed at 8px**, taken directly from this screen's own Figma pixel positions (cards 255–270px tall with an 8px gap between them) rather than reusing another screen's near-but-not-quite-matching gap (Home's "Campaigns" section uses 12px, Live Campaigns uses 16px).
- **One card layer dropped.** Figma layers a 70%-opacity white rectangle across the whole card on all four instances here too, the same artifact already normalized away for Search's result cards (docs/screen/search/README.md "Scope notes") — dropped for the same reason.
- **Verified-badge/calendar-icon assets reused as-is.** Figma exports yet another slightly different verified-badge SVG hash for these cards, and a single-layer calendar icon instead of Home's two-layer one — both read as the same glyphs on screen. Reused the existing `assets/images/home/verified-badge.png` and `CalendarBadge` component rather than exporting more near-duplicate assets, continuing the normalization Home's own spec already established.

## Navigation

- **Entry:** Home's Campaigns section header (`scenes/main/Home.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to `/home`.
