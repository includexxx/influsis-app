# Screen Specs — Search

| | |
|---|---|
| **Figma nodes** | [`6119:6016`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6119-6016&m=dev) "Home - Influencer Ongoing" (keyboard-open/typing state), [`6119:6338`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6119-6338&m=dev) (results state), [`6123:7171`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6123-7171&m=dev) (no-results state) |
| **Route** | `/search` (`app/(main)/search.tsx`, hidden tab - see "Navigation" below) |
| **Scene** | `scenes/main/Search.tsx` |
| **Data** | `data/search.ts` |
| **Components used** | `AppHeader`, `CampaignCard` (extended with a new `status` prop) - both existing; `SearchBar`, `CategoryChip`, `StatusBadge`, `EmptyState`, `SearchIllustration` (all new, `components/elements/`) |

## Purpose

A dedicated search screen for campaigns - a live-filtered list driven by a text query, with a category filter row and a "no results" state. Reached from the Home tab's search bar.

## User flow

```
/home
  │
  └─ tap "Search your campaign" bar (AppHeader's sibling on Home) → /search
                                                                        │
                                                                        ├─ type a query           → result list re-filters live (CampaignCard, variant="list")
                                                                        ├─ query matches nothing   → "No campaign Found" empty state (EmptyState + SearchIllustration)
                                                                        ├─ tap a category chip     → chip toggles selected (visual only - see Scope notes)
                                                                        ├─ tap notification bell (AppHeader) → /notifications
                                                                        ├─ tap a result card       → /campaign/[id] (docs/screen/campaign-details/README.md)
                                                                        └─ tap Home/Order/Create Gig/Message/Profile → switches tab (docs/screen/main/README.md)
```

`/search` is registered as a hidden tab inside the `(main)` group (`app/(main)/_layout.tsx`, the same `href: null` pattern `create` uses) rather than a root-level route - unlike `/notifications` (which Figma shows with no tab bar), all three Search Figma frames that aren't covered by the on-screen keyboard show the tab bar, so keeping it inside the Tabs navigator preserves that shell.

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | "Influsis." wordmark + notification bell | `AppHeader` (same as Home) |
| 2 | Search input | Editable pill field, autofocused on mount | `SearchBar` |
| 3 | Category filter row | Horizontal scroll, 5 pills (Food/Sports/Beauty/Entertainment/Education) | `CategoryChip` |
| 4 | Results / empty state | Vertical stack of result cards, or a centered empty state when nothing matches | `CampaignCard` (`variant="list"`, `status="Ongoing"`) / `EmptyState` + `SearchIllustration` |

## New components

- **`SearchBar`** (Figma node 6119:6268) - the pill-shaped search field. Supports two modes: a real editable `TextInput` (used here, with `autoFocus`), or `editable={false}` + `onPress`, which renders identically but wraps the field in a `Pressable` that navigates instead of opening a keyboard - written for reuse by any other tap-to-navigate search entry point.
- **`CategoryChip`** (Figma node 6138:5505) - a filter pill. Selected state (solid brand-pink fill, white label) is confirmed directly from Figma's screenshot of the "Food" chip; unselected is a plain outlined pill.
- **`StatusBadge`** (Figma node 6138:5549, "Ongoing") - a small colored status pill, added as a new optional `status` prop on the existing `CampaignCard` (renders top-right of the whole card) rather than a one-off inline badge, so `CampaignCard` stays the single source of truth for campaign-card layout. `color` defaults to Figma's confirmed green but is overridable for statuses this project hasn't designed yet (e.g. a future Order screen's "Completed"/"Cancelled").
- **`EmptyState`** (Figma node 6123:7563's "Text" group) - a generic illustration + title + description block, not specific to search, so any future screen without data yet (Order, Message, ...) can reuse it with its own illustration.
- **`SearchIllustration`** (Figma node 6123:7599) - the specific "no results" artwork: a megaphone glyph centered in a white circle inside a light gray disc, with four small decorative dots. Paired with `EmptyState` for this screen; the four dots are plain colored `View`s (solid circles, no raster asset needed) rather than four tiny separate image exports.

## Scope notes

- **All results shown by default.** The result list isn't gated behind "has the user typed anything" - an empty query matches every mock campaign's title (`''.includes` is always true), so all of `data/search.ts`'s results are visible as soon as the screen opens, and typing narrows them from there. This reads as "browse, then refine" rather than "type to reveal," a reasonable simplification given the mock data has no real category/relevance signal to rank an empty-query state by.
- **No real backend.** As with every other flow so far, there's no search API (`docs/PRD.md` §2.2/§4.1) - filtering runs client-side against `searchResults` (case-insensitive substring match on title), now re-exported from the canonical `data/campaigns.ts` rather than defined locally - see `docs/screen/campaign-details/README.md` "Data consolidation". `searchCategories` stays in `data/search.ts`. Reuses the existing `Campaign` type (now extended with an optional `status` field) and the campaign photos already extracted for Home (`assets/images/home/campaign-list-*.jpg`) rather than exporting duplicates of the same stock photography Figma reuses.
- **Now tappable.** Each result card's `onPress={() => router.push(\`/campaign/${item.id}\`)}` (`scenes/main/Search.tsx`) leads to Campaign Details — see `docs/screen/campaign-details/README.md`.
- **Category chips are visual-only.** Tapping a chip toggles its selected look (single-select, tap again to deselect) but doesn't filter results - Figma shows no distinct "chip filters the list" interaction, and combining it with text search would mean inventing a category field the mock campaigns don't have. Matches this project's established pattern of not building interactions beyond what's been designed (see `docs/screen/home/README.md`'s "Inert tap targets").
- **Result-card differences from the Home "Campaigns" list cards.** These cards use `CampaignCard`'s existing `variant="list"` but without gender tags or a services description line (Figma's search-result cards don't show either), plus the new `status="Ongoing"` badge Home's cards don't have.
- **One card layer dropped.** Figma layers a 70%-opacity white rectangle across the whole card (`6119:6392`, on top of the photo/text) on all three result-card instances. With no clear purpose (it doesn't visibly dim or highlight anything in the screenshot) and no equivalent on any other card in this codebase, it's treated as a one-off Figma layer artifact and dropped, matching this project's established normalization pattern.
- **Illustration colors normalized.** Figma's empty-state title/description use a distinct "Greyscale" palette (`#111827`/`#6B7280`) that doesn't exist in this project's `theme/colors.ts` `palette`. Normalized to the project's own near-identical `palette.gray[900]`/`palette.gray[300]` tokens instead of introducing a second, redundant near-black/near-gray pair.
- **Assets.** Extracted via the Dev Mode MCP server into `assets/images/search/` - the megaphone glyph rasterized from SVG via `scripts/rasterize-search-assets.py` (same approach every other screen's icon extraction uses). The search icon reuses the existing `assets/images/home/search.png` (identical asset hash to this screen's own search-field icon) rather than re-exporting a duplicate.

## Navigation

- **Entry:** Home's "Search your campaign" bar (`scenes/main/Home.tsx`).
- **Exit:** tab bar switches to Home/Order/Create Gig/Message/Profile as normal (no back button - matches Figma, which shows the same wordmark+bell header Home uses, not a back-chevron header).
