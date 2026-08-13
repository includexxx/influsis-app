# Screen Specs — Campaign Details

| | |
|---|---|
| **Figma node** | [`6001:37641`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-37641&m=dev) — "Campaign Details_Sample 1" |
| **Route** | `/campaign/[id]` (`app/(details)/campaign/[id].tsx`) |
| **Scene** | `scenes/main/CampaignDetails.tsx` |
| **Data** | `data/campaigns.ts` |
| **Components used** | `ScreenHeader`, `Image`, `Button`, `BulletList`, `InfoCard` (all existing); `StatTile` (new, `components/elements/`) |

## Purpose

The full detail view for a single campaign — banner photo, brand identity, title, budget/duration/follower stats, an "About campaign" description, requirements, deliverables ("What you need to create"), a brand description, a website link, an application deadline, and an "Apply Now" CTA. Reached by tapping any campaign, anywhere in the app.

## User flow

```
/home (hero + list)   /campaigns   /live-campaign   /search results   /brand/[id] (Ongoing Campaign)
  │ tap a CampaignCard    │ tap a card  │ tap a card     │ tap a result card  │ tap a card
  └──────────────┬────────┴─────────────┴────────────────┴─────────────────────┘
                  ▼
            /campaign/[id]
                  │
                  ├─ tap back chevron (ScreenHeader) → back to wherever the tap came from
                  └─ (no further tap targets — "Visit website" and "Apply Now" have no
                     onPress; there's no browser-linking or application flow designed yet)
```

`/campaign/[id]` is a dynamic route inside the `app/(details)/` route group (outside the `(main)` Tabs group), the same "no tab bar" reasoning as every other screen in that group. Every `CampaignCard` in the app now passes the same `onPress={() => router.push(\`/campaign/${item.id}\`)}` — Home's "Active Campaigns" hero row and "Campaigns" list section, the full `/campaigns` list, `/live-campaign`, `/search` results, and Brand Details' "Ongoing Campaign" section (`scenes/main/Home.tsx`, `Campaigns.tsx`, `LiveCampaign.tsx`, `Search.tsx`, `BrandDetails.tsx`) — closing the gap each of those screens' docs previously flagged as "no campaign-detail screen yet - inert".

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Campaign details" title | `ScreenHeader` |
| 2 | Banner + avatar | Full-bleed banner photo with a circular logo overlapping its bottom-left corner | `Image` ×2 |
| 3 | Brand name + title | Small brand name + verified badge, then the campaign's big title | — |
| 4 | Stats row | Three tinted tiles: Budget, Duration, Follower wanted | `StatTile` ×3 |
| 5 | About campaign | Section title + description paragraph | — |
| 6 | Requirements | Section title + bulleted list | `BulletList` |
| 7 | What you need to create | Section title + three tinted deliverable cards | `InfoCard` |
| 8 | About the brand | Section title + description paragraph | — |
| 9 | Footer actions | "Visit website" link, application deadline row, "Apply Now" button | `Button` |

## Data consolidation: one canonical campaign list

Before this screen, campaigns were scattered across five separate arrays with disjoint, non-overlapping ids and no shared lookup: this file's own `campaigns` (`campaign-1..4`), `data/home.ts`'s `activeCampaigns`/`campaigns` (`kfc-branding`, `bkash-branding-hero`, `bkash-1..4`), `data/liveCampaigns.ts` (`live-1..8`), and `data/search.ts`'s `searchResults` (`search-1..3`) — the same pre-consolidation situation `docs/screen/gig-details/README.md` and `docs/screen/influencer-profile/README.md` already describe fixing for gigs and influencers. Unlike those two cases, these aren't duplicate views of the *same* underlying items — each array holds genuinely distinct mock campaigns — so instead of deduplicating, every literal moved into `data/campaigns.ts` as the one canonical file:

- `data/campaigns.ts` now exports `campaigns` (`campaign-1..4`, unchanged), `activeCampaigns`, `homeCampaigns`, `liveCampaigns`, and `searchResults` — one array per original source — plus `allCampaigns`, the concatenation of all five, which is what Campaign Details looks a tapped id up in.
- `data/home.ts` re-exports `activeCampaigns` and `homeCampaigns as campaigns` from `data/campaigns.ts` instead of defining its own literals — `scenes/main/Home.tsx`'s import is unchanged.
- `data/liveCampaigns.ts` and `data/search.ts` similarly re-export `liveCampaigns`/`searchResults` from `data/campaigns.ts` — `scenes/main/LiveCampaign.tsx` and `Search.tsx`'s imports are unchanged.
- `data/brands.ts`'s `campaignIds: ['campaign-1', 'campaign-2']` (used by Brand Details' "Ongoing Campaign" section) already pointed at this file's ids, confirming `data/campaigns.ts` was the natural consolidation target.

## New components

- **`StatTile`** (Figma "Frame" nodes `6001:37683`/`37684`/`37685`) — a tinted icon + label + value tile, three side by side for Budget/Duration/Follower wanted. `backgroundColor` defaults to Figma's confirmed `palette.gray[25]` but is overridable, generic enough for any future icon-stat tile this project doesn't have a design for yet.

## No changes needed to existing components

`ScreenHeader`, `Image`, `Button`, `BulletList`, and `InfoCard` (with its existing `backgroundColor` override) all reproduce this design exactly as-is — `InfoCard`'s title+description shape already matches the "What you need to create" deliverable cards, `BulletList` already matches "Requirements", and `Button` + `buttonStyle.primary`/`primaryTitle` (the same shared CTA shape Sign In/Sign Up/Verify OTP already use) already matches "Apply Now" (`#F42E9E`, 54px tall, 12px radius, white 18px semibold label). See "Reuse First" in `CLAUDE.md`.

## Scope notes

- **No real backend.** As with every other flow so far, there's no campaigns API (`docs/PRD.md` §2.2/§4.1) — every campaign's detail fields (new optional fields on the `Campaign` type: `bannerImage`, `avatar`, `budget`, `duration`, `followerWanted`, `about`, `requirements`, `deliverables`, `brandDescription`, `website`, `applicationDeadline`) come from `data/campaigns.ts`.
- **Figma's one example mirrored across every campaign.** Figma shows a single campaign's detail content (stats, "About campaign" paragraph, requirements, three deliverables, brand description, website, deadline) for its one example — applied identically to all 21 campaigns in `data/campaigns.ts` rather than inventing distinct detail content Figma doesn't specify, same as Brand Details' description and Gig Details' service breakdown. Each campaign's own `title` and `brandName` (already used on its card) are reused for the header instead of a separate detail-only field, so the header shows real per-campaign content rather than always repeating Figma's "Summer Fashion Collection showcase" example.
- **Banner/avatar reused from Brand Details, not re-exported.** Figma's banner photo and circular logo are the exact same asset pair (identical Figma export hashes) already extracted for `docs/screen/brand-details`'s example — referenced directly (`assets/images/brand-details/banner.jpg`/`avatar.jpg`) rather than duplicating the files.
- **"About the brand" duplication cleaned up.** Figma's paragraph (node `6001:37699`) is four back-to-back copies of the same sentence pasted together — a designer text-entry error, not intentional repeated content like the mismatches this project otherwise preserves as-is (e.g. Brand Details' banner/name mismatch) — so only one clean copy is kept in `data/campaigns.ts`'s `brandDescription`.
- **"Visit website" and "Apply Now" are visual-only.** Neither has a real destination — this app has no established pattern for opening external URLs (`Linking`) and no application flow has been designed, so both stay non-functional per Figma rather than inventing a fake action. Matches this project's established pattern of not building interactions beyond what's been designed (see `docs/screen/home/README.md`'s "Inert tap targets").
- **`CampaignMiniCard` ("Popular Campaigns" on Home) stays out of scope.** Its shape (`id, image, startedLabel, title`) doesn't carry price/brand/detail fields the way `Campaign` does, so it isn't wired to this route — see `docs/screen/home/README.md` "Scope notes".
- **Invalid `id` falls back to Home.** Same as Gig Details, Influencer Profile, and Brand Details — an unmatched `/campaign/[id]` renders `<Redirect href="/home" />` rather than a broken page.
- **New assets.** `assets/images/campaign-details/budget.png`, `duration.png`, `followers.png`, `calendar.png` (20×20 native, rasterized at 4× via `scripts/rasterize-campaign-details-assets.py`) and `website.png` (24×24 native) — all already-colored stroke icons from Figma (pink `#F42E9E` for budget/duration/followers/website, black `#030304` for calendar), same rasterize-then-discard-the-SVG approach as `scripts/rasterize-brand-details-assets.py`. The verified badge reuses the existing `assets/images/home/verified-badge.png`.

## Navigation

- **Entry:** any `CampaignCard` tap — Home's "Active Campaigns" hero row and "Campaigns" list section (`scenes/main/Home.tsx`), `/campaigns` (`Campaigns.tsx`), `/live-campaign` (`LiveCampaign.tsx`), `/search` results (`Search.tsx`), and Brand Details' "Ongoing Campaign" section (`BrandDetails.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to wherever the tap originated.
