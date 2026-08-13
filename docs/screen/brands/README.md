# Screen Specs — Brands

| | |
|---|---|
| **Figma node** | [`6010:16780`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-16780&m=dev) — "All Brands" |
| **Route** | `/brands` (`app/brands.tsx`) |
| **Scene** | `scenes/main/Brands.tsx` |
| **Data** | `data/brands.ts` |
| **Components used** | `ScreenHeader`, `CircleAvatar` (extended with a new optional `label` prop) — both existing |

## Purpose

A 4-column grid of every brand a creator has worked with (logo + name). Reached from the Home tab's Brand section.

## User flow

```
/home
  │
  └─ tap "See all" on Brand (SectionHeader) → /brands
                                                 │
                                                 ├─ tap back chevron (ScreenHeader) → back to /home
                                                 └─ tap a brand logo                → (no brand-detail screen yet - inert)
```

`/brands` is a root-level route (`app/brands.tsx`, outside the `(main)` Tabs group), the same reasoning as `/notifications`, `/live-campaign` and `/campaigns` — Figma's frame has no tab bar instance, so it's pushed full-screen and popped via the back chevron rather than kept inside the tab shell.

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Brands" title | `ScreenHeader` |
| 2 | Brand grid | 4-column wrapping grid, 94px circles + name label | `CircleAvatar` (`label` prop) |

## `CircleAvatar`'s new `label` prop

Previously a bare circular `Image` (Home's "Brand" and "Top Rated Influencer" rows, neither of which shows a name). This screen's grid needs a name under each logo (Figma node `6010:16915`), so `CircleAvatar` gained an optional `label?: string` prop rather than a new near-duplicate component: omitting it keeps every existing call site's plain-circle rendering (and root element - still a bare `Image`, so the existing test asserting style props directly on it still passes) exactly as before; passing it wraps the circle and a centered text label in a column. See "Reuse First" in `CLAUDE.md`.

## Scope notes

- **No real backend.** As with every other flow so far, there's no brands API (`docs/PRD.md` §2.2/§4.1) — content comes from `data/brands.ts`'s mock `BrandLogo[]` array.
- **Heavy reuse of Home's existing logos.** Figma's grid row 1 (KFC/Bkash Ltd/Bkash/Uber) uses the exact same four images already extracted for Home's "Brand" row (`assets/images/home/brand-logo-*.jpg`) — reused directly rather than re-exporting duplicates. Row 3's "Pathao" cell does the same with `brand-logo-3.jpg` despite Figma exporting a slightly different PNG hash for it, the same "one glyph, standardize on the existing asset" normalization `docs/screen/home/README.md` already established for the verified badge.
- **Duplicate mock content.** Figma repeats two full sets of logos across its 24 grid cells: rows 2 and 5 are identical (Kay/Eastasy/Aarong/Xiomi), and row 4 repeats row 1's four brands (down to reusing the "Bkash Ltd" label on two separate cells, and on what's visibly the Bata logo rather than a Bkash one) — mirrored here rather than inventing distinct brands Figma doesn't specify, same as every other screen's mock data.
- **Two logos flattened onto white.** Figma's exported PNGs for GP and Robi are transparent (just the colored logo mark, no background fill), unlike every other logo in the grid which already has an opaque backing baked in. Rendered directly, they'd show whatever's behind them — broken in dark mode, where the page background isn't white like Figma's canvas. `scripts/resize-brand-assets.py` composites both onto a white backing (matching Figma's own rendered look) before downscaling, the same way `scripts/resize-home-assets.py` flattens photos to opaque JPEGs.
- **Grid built as explicit rows, not `flexWrap`.** `data/brands.ts`'s flat 24-item list is chunked into rows of 4 in `scenes/main/Brands.tsx` and each row rendered as its own `flexDirection: 'row'` `View`, rather than one `flexWrap: 'wrap'` container. A `flexWrap` row needs a definite width from its parent to know when to wrap; a `View` sitting directly inside a vertical `ScrollView`'s content container doesn't reliably get one on web, which collapsed every circle onto its own line (0px available width) instead of 4 per row - explicit rows sidestep that resolution entirely, matching how no other screen in this codebase uses `flexWrap`.
- **Grid width reconciled with this project's standard padding.** Figma's grid container is 400px wide (15px left inset) - 2px wider than the 398px content width this project's `layoutStyle.scrollContent` produces (16px padding, matching every other screen). Rather than shrinking the circles by a couple of fractional pixels to force an exact 400px fit, each row's `justifyContent: 'space-between'` distributes the leftover space automatically - four 94px circles (376px) comfortably fit 398px either way.
- **Assets.** Extracted via the Dev Mode MCP server into `assets/images/brands/` — the 10 logos not already covered by Home's `brand-logo-*` set, downscaled to a 200px cap and JPEG-compressed via `scripts/resize-brand-assets.py` (same 200px cap `scripts/resize-home-assets.py` already uses for `brand-logo-*` and `influencer-*`).

## Navigation

- **Entry:** Home's Brand section header (`scenes/main/Home.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to `/home`.
