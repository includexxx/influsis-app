# Screen Specs — Influencer Profile

| | |
|---|---|
| **Figma node** | [`6001:37822`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-37822&m=dev) — "Influencer Profile Details - Brand Side_sample 2" |
| **Route** | `/influencer/[id]` (`app/(details)/influencer/[id].tsx`) |
| **Scene** | `scenes/main/InfluencerProfile.tsx` |
| **Data** | `data/influencers.ts` |
| **Components used** | `ScreenHeader`, `Image`, `GigCard` (existing); `StarRating`, `ReviewCard` (new, `components/elements/`) |

## Purpose

The full profile view for a single influencer — banner photo, avatar, name, bio, active gigs, category tags, and customer reviews. Reached by tapping any influencer, anywhere in the app.

## User flow

```
/home (avatar row)              /top-influencers (InfluencerCard list)
  │ tap an avatar                  │ tap a card
  └──────────────┬──────────────────┘
                  ▼
          /influencer/[id]
                  │
                  ├─ tap back chevron (ScreenHeader) → back to wherever the tap came from
                  ├─ tap an Active Gigs GigCard        → /gig/[id] (docs/screen/gig-details/README.md)
                  └─ (no further tap targets)
```

`/influencer/[id]` is a dynamic route inside the `app/(details)/` route group (outside the `(main)` Tabs group), the same "no tab bar" reasoning as every other screen in that group. Both entry points pass the same `onPress={() => router.push(\`/influencer/${item.id}\`)}` — Home's avatar row (now a `Pressable` `CircleAvatar`) and `/top-influencers`' `InfluencerCard` list — and the "Active Gigs" section's `GigCard`s reuse the exact same `onPress={() => router.push(\`/gig/${gig.id}\`)}` every other gig card in the app already uses.

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Profile" title | `ScreenHeader` |
| 2 | Banner + avatar | Full-bleed banner photo with a rounded-square avatar overlapping its bottom-left corner | `Image` ×2 |
| 3 | Name + bio | Name, verified checkmark, bio paragraph | — |
| 4 | Active Gigs | Horizontal scroll, 356px cards | `GigCard` |
| 5 | Tags | Category pills | — |
| 6 | Customer Review | Section title + a single-star average rating, then a vertical stack of review cards | `StarRating`, `ReviewCard` |

## Data consolidation: one canonical influencer list

Before this screen, Home's "Top Rated Influencer" row was five plain, identity-less circular headshots (`data/home.ts`'s old `topRatedInfluencerAvatars: ImageSourcePropType[]`) with no id linking any of them to the four named influencers `/top-influencers` already had — fine when nothing needed to look one up individually, but a real problem once tapping an avatar needed to resolve to an actual profile. Consolidated into `data/influencers.ts`, now the single source of truth (the same pattern `data/gigs.ts` already established for gigs): `data/home.ts`'s `topRatedInfluencers` export is now `{id, image}` pairs mapped from the canonical list (down from five avatars to four, matching how many named influencers actually exist), and `data/topInfluencers.ts` re-exports the canonical list wholesale.

## New components

- **`StarRating`** (Figma nodes `6001:37880` and `6001:37892`) — a row of filled star icons + an optional trailing label. One component covers both of this screen's star displays: the header's single "★ 4.5" (`maxStars={1}`) and each review's five-star "★★★★★ (5/5)" row (`maxStars={5}`) — they use different icon assets (a decorative sharp-edged star vs. a rounded "material-symbols" star), passed in via the required `icon` prop. Figma shows no partial/half-filled star for any rating, so `rating` only controls how many *whole* stars render.
- **`ReviewCard`** (Figma node `6001:37885` and two siblings) — reviewer avatar, name, a `StarRating`, a relative timestamp, and the review text.

## `CircleAvatar`'s new `onPress` prop

Home's avatar row needed to become tappable without changing its shape for every other call site. `CircleAvatar` gained an optional `onPress?: () => void` (alongside the existing `label`) — omitting it keeps every other call site's plain, non-interactive rendering unchanged; passing it wraps the circle (or circle+label) in a `Pressable`.

## Scope notes

- **No real backend.** As with every other flow so far, there's no influencers API (`docs/PRD.md` §2.2/§4.1) — every influencer's `bio`, `categories`, `customerRating`, `activeGigIds` and `reviews` (all new optional fields on the `Influencer` type) come from `data/influencers.ts`.
- **Figma's one example mirrored across every influencer.** Figma shows a single bio, category set (Entertainment/Lifestyle/Sports), rating (4.5), and review (repeated identically for all three review cards, reviewer "Salman Muktadir" included) for its one example profile — applied identically to all four influencers rather than inventing distinct profile content Figma doesn't specify, same as Gig Details' "What I will create" breakdown.
- **Active Gigs reuses real gigs, not new mock content.** Figma's "Active Gigs" cards are structurally identical to the existing `GigCard` (confirmed via the same image asset hash as `gig-1`) — rather than inventing separate gig content for the profile screen, `activeGigIds` references real ids from the canonical `data/gigs.ts`, so these cards stay tappable through to a real `/gig/[id]` the same as everywhere else.
- **Avatar is a rounded square, not a circle.** Unlike every other avatar in this app (`CircleAvatar`), the profile photo overlapping the banner has an 8px corner radius, not a fully-rounded one — rendered as a plain bordered `Image` in the scene rather than forcing it through `CircleAvatar`.
- **Two new star icon assets, not a reuse of the existing one.** `InfluencerCard`'s "Top Rated" badge already has a star icon, but this screen's two star displays are both different shapes (a sharp decorative star and a rounded "material-symbols" star) from that one and from each other — extracted and rasterized separately via `scripts/rasterize-profile-assets.py` rather than force-fit into a visually different existing asset, the same reasoning `InfluencerCard`'s own verified-badge icon used.
- **Invalid `id` falls back to Home.** Same as Gig Details — an unmatched `/influencer/[id]` renders `<Redirect href="/home" />` rather than a broken page.

## Navigation

- **Entry:** Home's "Top Rated Influencer" avatar row (`scenes/main/Home.tsx`), `/top-influencers`' `InfluencerCard` list (`scenes/main/TopInfluencers.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to wherever the tap originated. Active Gigs cards also lead onward to `/gig/[id]`.
