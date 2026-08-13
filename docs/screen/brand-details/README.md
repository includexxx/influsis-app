# Screen Specs — Brand Details

| | |
|---|---|
| **Figma node** | [`6001:37719`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-37719&m=dev) — "Campaign Details_Sample 2" |
| **Route** | `/brand/[id]` (`app/(details)/brand/[id].tsx`) |
| **Scene** | `scenes/main/BrandDetails.tsx` |
| **Data** | `data/brands.ts`, `data/campaigns.ts` |
| **Components used** | `ScreenHeader`, `Image`, `CampaignCard` (all existing, no new components) |

## Purpose

The full profile view for a single brand — banner photo, circular logo, name, verified badge, website, description, and a list of the brand's ongoing campaigns. Reached by tapping any brand, anywhere in the app.

## User flow

```
/home (Brand row)               /brands (full grid, CircleAvatar)
  │ tap a brand logo               │ tap a brand logo
  └──────────────┬──────────────────┘
                  ▼
            /brand/[id]
                  │
                  ├─ tap back chevron (ScreenHeader) → back to wherever the tap came from
                  └─ (no further tap targets — CampaignCard has no onPress here, same as
                     Campaigns.tsx's own list; there's no campaign-detail route yet)
```

`/brand/[id]` is a dynamic route inside the `app/(details)/` route group (outside the `(main)` Tabs group), the same "no tab bar" reasoning as every other screen in that group. Both entry points now pass the same `onPress={() => router.push(\`/brand/${item.id}\`)}` — Home's "Brand" row and `/brands`' full grid, both a `Pressable` `CircleAvatar` — closing the gap `docs/screen/brands/README.md` previously flagged as "no brand-detail screen yet - inert".

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Brand Details" title | `ScreenHeader` |
| 2 | Banner + avatar | Full-bleed banner photo with a circular logo overlapping its bottom-left corner | `Image` ×2 |
| 3 | Name + website | Name, verified badge, globe icon + website URL | — |
| 4 | Description | Plain paragraph | — |
| 5 | Ongoing Campaign | Section title + a vertical stack of the brand's campaigns | `CampaignCard` (`variant="list"`) |

## Data consolidation: one canonical brand list

Before this screen, `data/brands.ts`'s `BrandLogo[]` (id, source, label) only served the `/brands` grid, and Home's "Brand" row (`data/home.ts`'s old `brandLogos: ImageSourcePropType[]`) was a plain, identity-less array with no id linking any of the five logos back to a real brand — the same gap `docs/screen/influencer-profile/README.md` already closed for `topRatedInfluencers`. Fixed the same way:

- `BrandLogo` moved out of `data/brands.ts` into a shared `Brand` type (`types/brand.ts`), extended with the Brand Details screen's optional fields (`name`, `verified`, `bannerImage`, `avatar`, `website`, `description`, `campaignIds`) — mirroring how `Influencer` grew banner/bio/rating fields on top of its list-card fields.
- `data/home.ts`'s `brandLogos` is now `{id, source}` pairs picked by id from the canonical `data/brands.ts` list (`homeBrandIds`), reproducing the same five `brand-logo-1..5.jpg` images in the same order the row showed before, but now with ids `CircleAvatar`'s `onPress` can route through.
- `data/brands.ts` is unchanged in shape for the grid (still exports `source`/`label` per item) — only additive optional fields were appended.

## Scope notes

- **No real backend.** As with every other flow so far, there's no brands API (`docs/PRD.md` §2.2/§4.1) — every brand's detail fields come from `data/brands.ts`.
- **Figma's one example mirrored across every brand.** Figma shows a single brand profile (banner photo, logo, "Bkash Ltd. Company" name, `https://food.net` website, one description paragraph, two "Bkash Branding Campaign" cards) for its one example — applied identically to all 24 brands in `data/brands.ts` rather than inventing distinct profile content Figma doesn't specify, same as Gig Details' service breakdown and Influencer Profile's bio/reviews.
- **Figma's own content mismatch preserved as-is.** The example's banner photo and circular avatar are visibly KFC's own ad photo and mascot logo, while the name text reads "Bkash Ltd. Company" — the same kind of designer mismatch `docs/screen/brands/README.md` already documents keeping rather than reconciling (its grid's row-1 "Bkash Ltd" label sitting on what's visibly the Bata logo).
- **Ongoing campaigns reuse real campaigns, not new mock content.** Figma's two example cards are structurally identical to `CampaignCard`'s `list` variant and match `data/campaigns.ts`'s `campaign-1`/`campaign-2` (same photos, same "Bkash Branding Campaign" / "Bkash Ltd." content, down to the second card's services line) — referenced here by id (`campaignIds`) rather than duplicating that content, so no new `CampaignCard` props or styling were needed.
- **Avatar falls back to the brand's own grid logo.** The scene reads `brand.avatar ?? brand.source` — every brand already has a real, distinct logo (`source`, used by the `/brands` grid), so if a future edit ever gives brands per-item avatars, unset ones still render something real instead of a placeholder.
- **Invalid `id` falls back to Home.** Same as Gig Details and Influencer Profile — an unmatched `/brand/[id]` renders `<Redirect href="/home" />` rather than a broken page.
- **New assets.** `assets/images/brand-details/banner.jpg` and `avatar.jpg` (downscaled/JPEG-compressed via `scripts/resize-brand-details-assets.py`, same approach as `scripts/resize-profile-assets.py`) and `globe.png` (rasterized from the Figma SVG export via `scripts/rasterize-brand-details-assets.py`, same approach as `scripts/rasterize-profile-assets.py`). The verified badge next to the brand name reuses the existing `assets/images/home/verified-badge.png` (same 20×20 glyph `CampaignCard` already uses) rather than exporting a duplicate.

## Navigation

- **Entry:** Home's "Brand" row (`scenes/main/Home.tsx`), `/brands`' full grid (`scenes/main/Brands.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to wherever the tap originated.
