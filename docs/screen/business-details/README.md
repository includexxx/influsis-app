# Screen Specs — Business Details

| | |
|---|---|
| **Figma node** | [`6001:37719`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-37719&m=dev) — "Campaign Details_Sample 2" |
| **Route** | `/business/[id]` (`app/(details)/business/[id].tsx`) |
| **Scene** | `scenes/main/BusinessDetails.tsx` |
| **Data** | `data/businesses.ts`, `data/campaigns.ts` |
| **Components used** | `ScreenHeader`, `Image`, `CampaignCard` (all existing, no new components) |

## Purpose

The full profile view for a single business — banner photo, circular logo, name, verified badge, website, description, and a list of the business's ongoing campaigns. Reached by tapping any business, anywhere in the app.

## User flow

```
/home (Business row)               /businesses (full grid, CircleAvatar)
  │ tap a business logo               │ tap a business logo
  └──────────────┬──────────────────┘
                  ▼
            /business/[id]
                  │
                  ├─ tap back chevron (ScreenHeader) → back to wherever the tap came from
                  └─ tap an Ongoing Campaign CampaignCard → /campaign/[id] (docs/screen/campaign-details/README.md)
```

`/business/[id]` is a dynamic route inside the `app/(details)/` route group (outside the `(main)` Tabs group), the same "no tab bar" reasoning as every other screen in that group. Both entry points now pass the same `onPress={() => router.push(\`/business/${item.id}\`)}` — Home's "Business" row and `/businesses`' full grid, both a `Pressable` `CircleAvatar` — closing the gap `docs/screen/businesses/README.md` previously flagged as "no business-detail screen yet - inert".

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Business Details" title | `ScreenHeader` |
| 2 | Banner + avatar | Full-bleed banner photo with a circular logo overlapping its bottom-left corner | `Image` ×2 |
| 3 | Name + website | Name, verified badge, globe icon + website URL | — |
| 4 | Description | Plain paragraph | — |
| 5 | Ongoing Campaign | Section title + a vertical stack of the business's campaigns | `CampaignCard` (`variant="list"`) |

## Data consolidation: one canonical business list

Before this screen, `data/businesses.ts`'s `BusinessLogo[]` (id, source, label) only served the `/businesses` grid, and Home's "Business" row (`data/home.ts`'s old `businessLogos: ImageSourcePropType[]`) was a plain, identity-less array with no id linking any of the five logos back to a real business — the same gap `docs/screen/creator-profile/README.md` already closed for `topRatedCreators`. Fixed the same way:

- `BusinessLogo` moved out of `data/businesses.ts` into a shared `Business` type (`types/business.ts`), extended with the Business Details screen's optional fields (`name`, `verified`, `bannerImage`, `avatar`, `website`, `description`, `campaignIds`) — mirroring how `Creator` grew banner/bio/rating fields on top of its list-card fields.
- `data/home.ts`'s `businessLogos` is now `{id, source}` pairs picked by id from the canonical `data/businesses.ts` list (`homeBusinessIds`), reproducing the same five `business-logo-1..5.jpg` images in the same order the row showed before, but now with ids `CircleAvatar`'s `onPress` can route through.
- `data/businesses.ts` is unchanged in shape for the grid (still exports `source`/`label` per item) — only additive optional fields were appended.

## Scope notes

- **No real backend.** As with every other flow so far, there's no businesses API (`docs/PRD.md` §2.2/§4.1) — every business's detail fields come from `data/businesses.ts`.
- **Figma's one example mirrored across every business.** Figma shows a single business profile (banner photo, logo, "Bkash Ltd. Company" name, `https://food.net` website, one description paragraph, two "Bkash Branding Campaign" cards) for its one example — applied identically to all 24 businesses in `data/businesses.ts` rather than inventing distinct profile content Figma doesn't specify, same as Gig Details' service breakdown and Creator Profile's bio/reviews.
- **Figma's own content mismatch preserved as-is.** The example's banner photo and circular avatar are visibly KFC's own ad photo and mascot logo, while the name text reads "Bkash Ltd. Company" — the same kind of designer mismatch `docs/screen/businesses/README.md` already documents keeping rather than reconciling (its grid's row-1 "Bkash Ltd" label sitting on what's visibly the Bata logo).
- **Ongoing campaigns reuse real campaigns, not new mock content.** Figma's two example cards are structurally identical to `CampaignCard`'s `list` variant and match `data/campaigns.ts`'s `campaign-1`/`campaign-2` (same photos, same "Bkash Branding Campaign" / "Bkash Ltd." content, down to the second card's services line) — referenced here by id (`campaignIds`) rather than duplicating that content, so no new `CampaignCard` props or styling were needed. Each card's `onPress={() => router.push(\`/campaign/${campaign.id}\`)}` now leads to Campaign Details — see `docs/screen/campaign-details/README.md`.
- **Avatar falls back to the business's own grid logo.** The scene reads `business.avatar ?? business.source` — every business already has a real, distinct logo (`source`, used by the `/businesses` grid), so if a future edit ever gives businesses per-item avatars, unset ones still render something real instead of a placeholder.
- **Invalid `id` falls back to Home.** Same as Gig Details and Creator Profile — an unmatched `/business/[id]` renders `<Redirect href="/home" />` rather than a broken page.
- **New assets.** `assets/images/business-details/banner.jpg` and `avatar.jpg` (downscaled/JPEG-compressed via `scripts/resize-business-details-assets.py`, same approach as `scripts/resize-profile-assets.py`) and `globe.png` (rasterized from the Figma SVG export via `scripts/rasterize-business-details-assets.py`, same approach as `scripts/rasterize-profile-assets.py`). The verified badge next to the business name reuses the existing `assets/images/home/verified-badge.png` (same 20×20 glyph `CampaignCard` already uses) rather than exporting a duplicate.

## Navigation

- **Entry:** Home's "Business" row (`scenes/main/Home.tsx`), `/businesses`' full grid (`scenes/main/Businesses.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to wherever the tap originated. Ongoing Campaign cards also lead onward to `/campaign/[id]`.
