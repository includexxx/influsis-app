# Screen Specs — Top Gigs

| | |
|---|---|
| **Figma node** | [`6028:7350`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6028-7350&m=dev) — "Top Gigs" |
| **Route** | `/top-gigs` (`app/(details)/top-gigs.tsx`) |
| **Scene** | `scenes/main/TopGigs.tsx` |
| **Data** | `data/topGigs.ts` |
| **Components used** | `ScreenHeader`, `GigCard` — both existing, reused unmodified |

## Purpose

A flat list of all of a creator's available gigs. Reached from the Home tab's Top Gigs section.

## User flow

```
/home
  │
  └─ tap "See all" on Top Gigs (SectionHeader) → /top-gigs
                                                    │
                                                    ├─ tap back chevron (ScreenHeader) → back to /home
                                                    └─ tap a GigCard                    → /gig/[id] (docs/screen/gig-details/README.md)
```

`/top-gigs` lives in the `app/(details)/` route group (outside the `(main)` Tabs group), the same reasoning as `/notifications`, `/live-campaign`, `/campaigns` and `/brands` — Figma's frame has no tab bar instance, so it's pushed full-screen and popped via the back chevron rather than kept inside the tab shell.

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Top Gigs" title | `ScreenHeader` |
| 2 | Gig list | Vertical stack, full-width cards | `GigCard` |

## No new components needed

`ScreenHeader` (built for `/notifications`) and `GigCard` (built for Home's "Top Gigs" horizontal row) reproduce this design exactly as-is. `GigCard` normally renders at a fixed 356px width for its horizontal-scroll context on Home; here it just needs to stretch to the full-width column this vertical list uses instead, which its existing `style` prop already supports (merged last, so it overrides the fixed width) — no component changes required, only a `styles/topGigs.ts` `card` style passed in. See "Reuse First" in `CLAUDE.md`.

## Scope notes

- **No real backend.** As with every other flow so far, there's no gigs API (`docs/PRD.md` §2.2/§4.1) — content comes from `data/topGigs.ts`, which re-exports `data/gigs.ts`'s canonical mock `Gig[]` list (consolidated there once Gig Details needed a real `id → gig` lookup — see `docs/screen/gig-details/README.md` "Data consolidation").
- **Gig cards navigate to `/gig/[id]`.** `GigCard`'s existing `onPress` prop is wired to `router.push(\`/gig/${item.id}\`)`, the same as Home's "Top Gigs" row — no component changes needed.
- **Two photos reused from Home, three new.** The first and third cards use the exact same photos already extracted for Home's "Top Gigs" row (`assets/images/home/gig-1.jpg`, `gig-2.jpg`); the other three are new stock images extracted into `assets/images/gigs/`.
- **Duplicate mock content.** Figma repeats identical copy — "TikTok, Facebook, Youtube" / "$350" / "I will create facebook promotion, youtube, tiktok promotion" — across all five cards, differing only by photo. Mirrored here rather than inventing distinct gig copy Figma doesn't specify, same as every other screen's mock data.
- **List gap confirmed at 8px**, taken directly from this screen's own Figma pixel positions (210px-tall cards, 8px apart) — matches Home's own 8px `horizontalListGap` used for the same cards' horizontal-scroll row, so no normalization was needed here.
- **One card layer dropped.** Figma layers a 70%-opacity white rectangle across the whole card on all five instances, the same artifact already normalized away for Search's, Campaigns', and Live Campaigns' cards — dropped for the same reason (see `docs/screen/search/README.md` "Scope notes").
- **Assets.** Extracted via the Dev Mode MCP server into `assets/images/gigs/`, downscaled to an 800px cap and JPEG-compressed via `scripts/resize-gigs-assets.py` (same 800px cap `scripts/resize-home-assets.py` already uses for `gig-1`/`gig-2`).

## Navigation

- **Entry:** Home's Top Gigs section header (`scenes/main/Home.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to `/home`.
