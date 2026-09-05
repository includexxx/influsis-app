# Screen Specs — Gig Details

| | |
|---|---|
| **Figma node** | [`6401:5719`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6401-5719&m=dev) — "Gig Details page" |
| **Route** | `/gig/[id]` (`app/(details)/gig/[id].tsx`) |
| **Scene** | `scenes/main/GigDetails.tsx` |
| **Data** | `data/gigs.ts` |
| **Components used** | `ScreenHeader`, `Image` (existing); `InfoCard`, `BulletList` (new, `components/elements/`) |

## Purpose

The full detail view for a single gig — hero photo, price, a "What I will create" service breakdown, and a description. Reached by tapping any gig card, anywhere in the app.

## User flow

```
/home                              /top-gigs
  │ tap a GigCard                    │ tap a GigCard
  └──────────────┬────────────────────┘
                  ▼
            /gig/[id]
                  │
                  ├─ tap back chevron (ScreenHeader) → back to wherever the tap came from
                  └─ (no further tap targets on this screen)
```

`/gig/[id]` is a dynamic route inside the `app/(details)/` route group (outside the `(main)` Tabs group), the same "no tab bar" reasoning as every other screen in that group. Both `GigCard` call sites — Home's "Top Gigs" row (`scenes/main/Home.tsx`) and the full list at `/top-gigs` (`scenes/main/TopGigs.tsx`) — pass the same `onPress={() => router.push(\`/gig/${item.id}\`)}`; `GigCard` itself needed no changes, since `onPress` was already an existing prop.

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Gig Details" title | `ScreenHeader` |
| 2 | Hero photo | Full-bleed (no side padding), unlike every other screen's images | `Image` |
| 3 | Price row | Description (left) + price (right) | — |
| 4 | What I will create | Section title + 3 tinted service cards | `InfoCard` |
| 5 | Description of this Gig | Section title + bulleted list | `BulletList` |

## Data consolidation: one canonical gig list

Before this screen, Home's "Top Gigs" row (`data/home.ts`) and the full `/top-gigs` list (`data/topGigs.ts`) each had their own gigs with non-overlapping ids (`gig-1`/`gig-2` vs. `top-gig-1`...`top-gig-5`) — fine when neither needed to be looked up individually, but Gig Details needs a real `id → gig` lookup that works no matter which surface the tap came from. Consolidated into `data/gigs.ts`, now the single source of truth: `data/home.ts`'s `gigs` export is the first two entries sliced from it, and `data/topGigs.ts` re-exports it wholesale. Both existing call sites' imports (`import { gigs } from '@/data/home'`, `import { topGigs } from '@/data/topGigs'`) were left unchanged — only what backs them moved.

## New components

- **`InfoCard`** (Figma node `6401:5746` and two siblings) — a tinted title + description card. `backgroundColor` defaults to the confirmed `palette.primary[50]` pink but is overridable, generic enough for any future "info tile" this project doesn't have a design for yet.
- **`BulletList`** (Figma node `6401:5764` and siblings) — a plain bulleted list from a `string[]`, generic for the same reason.

## Scope notes

- **No real backend.** As with every other flow so far, there's no gigs API (`docs/PRD.md` §2.2/§4.1) — every gig's `services` and `descriptionBullets` (both new optional fields on the `Gig` type) come from `data/gigs.ts`.
- **Figma's one example mirrored across every gig.** Figma shows a single "What I will create" breakdown (Instagram/Facebook/"You tube" posts) and description (whose second and third bullets are verbatim duplicates of each other) for its one example gig — applied identically to all five gigs in `data/gigs.ts` rather than inventing distinct service lists or descriptions Figma doesn't specify, same as every other screen's mock data in this project.
- **Hero image is the tapped gig's own photo, not Figma's example.** Figma's screenshot shows one specific hero photo (a woman in a sun hat on a beach) for its single example. Using that same static image regardless of which gig was tapped would be actively misleading — tapping a "nature" gig card and landing on a beach photo. `GigDetails` uses `gig.image` (the same photo already shown on that gig's card) instead, so the detail view always matches what was tapped. No new photo asset was extracted for this reason.
- **Full-bleed hero image.** Unlike every other screen's cards/headers, this image has no horizontal padding (`styles/gigDetails.ts`'s `image` style is a direct `ScrollView` child, with padding applied separately to the header row and the content below instead of the whole screen via `layoutStyle.scrollContent`).
- **Invalid `id` falls back to Home.** If `/gig/[id]` is reached with an id that doesn't match any gig in `data/gigs.ts` (a stale link, a typo'd deep link), the scene renders `<Redirect href="/home" />` rather than a broken/empty detail page.

## Navigation

- **Entry:** any `GigCard` tap (`scenes/main/Home.tsx`'s "Top Gigs" row, `scenes/main/TopGigs.tsx`'s full list).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to wherever the tap originated.
