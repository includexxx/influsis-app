# Screen Specs — Top Influencers

| | |
|---|---|
| **Figma node** | [`6028:7456`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6028-7456&m=dev) — "Top Influencer" |
| **Route** | `/top-influencers` (`app/top-influencers.tsx`) |
| **Scene** | `scenes/main/TopInfluencers.tsx` |
| **Data** | `data/topInfluencers.ts` |
| **Components used** | `ScreenHeader` (existing); `InfluencerCard` (new, `components/elements/`) |

## Purpose

A flat list of top-rated influencers a brand can browse — photo, name, location, tags, and follower/engagement stats. Reached from the Home tab's Top Rated Influencer section.

## User flow

```
/home
  │
  └─ tap "See all" on Top Rated Influencer (SectionHeader) → /top-influencers
                                                                 │
                                                                 ├─ tap back chevron (ScreenHeader) → back to /home
                                                                 └─ tap an InfluencerCard            → (no influencer-detail screen yet - inert)
```

`/top-influencers` is a root-level route (`app/top-influencers.tsx`, outside the `(main)` Tabs group), the same reasoning as `/notifications`, `/live-campaign`, `/campaigns`, `/brands` and `/top-gigs`.

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Top Influencers" title | `ScreenHeader` |
| 2 | Influencer list | Vertical stack, full-width cards | `InfluencerCard` |

## `InfluencerCard` (new)

Figma node `6028:7512` and three siblings — a photo, name + a small pink verified checkmark, an amber "★ Top Rated" pill, a location row (pin icon + city), a row of gray tag pills, and a two-column followers/engagement stat pair. This content model (social stats, tags, a rating badge) doesn't overlap `CampaignCard` or `GigCard`, so it's a new component rather than an extension of either — all props but `image`/`name`/`location`/`followers`/`engagement` are optional (`verified`, `topRated`, `tags`) so future usages that don't need every element still work.

## Scope notes

- **No real backend.** As with every other flow so far, there's no influencers API (`docs/PRD.md` §2.2/§4.1) — content comes from `data/topInfluencers.ts`'s mock `Influencer[]` array, using a new `Influencer` type added to `types/`.
- **Duplicate/mismatched mock content, mirrored as-is.** Figma repeats "Salman Muqtadir" for three of the four cards, and every card's location row and the two tag pills beneath it all read "Dhaka, Bangladesh" verbatim (the tag pills look like they were meant for category/skill tags but were left as duplicated placeholder text) — mirrored here rather than inventing distinct influencer names, locations, or tags Figma doesn't specify, same as every other screen's mock data (e.g. Brands' "Bkash Ltd" label on the Bata logo).
- **Figma's floating bottom bar treated as a stray artifact, not built.** The Figma frame includes a "Campaigns / Order / [circle] / Message / Profile" bar positioned at y=1143 — below this frame's normal 932px viewport and with a different item set than this app's actual tab bar (Home/Order/Create Gig/Message/Profile, `app/(main)/_layout.tsx`). Every other screen this session that's genuinely meant to keep the tab bar visible does so via a real Figma "Tab Bar" component instance (see `/search`'s spec); this frame has no such instance, so the loose bar is read as leftover/copied content rather than an intentional part of this screen, and `/top-influencers` is built the same tab-bar-less way as `/notifications`, `/live-campaign`, `/campaigns` and `/brands`.
- **New icon set.** The verified checkmark here is a distinct scalloped-seal glyph, smaller (12.5×12) and shaped differently from the pink circle-checkmark `CampaignCard` already uses — reused as-is rather than force-fit into a visually different existing asset. The star and location-pin icons are also new. All three rasterized from SVG via `scripts/rasterize-influencers-assets.py`, the same approach every other screen's icon extraction uses.
- **Four unique photos**, extracted into `assets/images/influencers/` and downscaled/JPEG-compressed via `scripts/resize-influencers-assets.py` (900px cap, matching `campaign-list-*`'s cap in `scripts/resize-home-assets.py`) — none overlap Home's existing `influencer-*.jpg` avatars, which are a separate, smaller circular-crop set used by Home's own "Top Rated Influencer" row.

## Navigation

- **Entry:** Home's Top Rated Influencer section header (`scenes/main/Home.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to `/home`.
