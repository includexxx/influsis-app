# Screen Specs — Notifications

| | |
|---|---|
| **Figma node** | [`6346:5575`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6346-5575&m=dev) — "Notification" |
| **Route** | `/notifications` (`app/(details)/notifications.tsx`) |
| **Scene** | `scenes/main/Notifications.tsx` |
| **Data** | `data/notifications.ts` |
| **Components used** | `ScreenHeader`, `NotificationCard` (both new, `components/elements/`) |

## Purpose

A flat list of the user's notifications (payments, transfers, campaign activity), grouped into a recent (unlabeled) group and a "Last 24 Hours" group. Reached from the Home tab's header bell icon — see [`docs/screen/home/README.md`](../home/README.md).

## User flow

```
/home
  │
  └─ tap notification bell (AppHeader) → /notifications
                                            │
                                            ├─ tap back chevron (ScreenHeader) → back to /home
                                            └─ tap a NotificationCard          → (no notification-detail screen yet - inert)
```

`/notifications` lives in the `app/(details)/` route group (outside the `(main)` Tabs group) rather than a tab — it's pushed full-screen on top of the tab bar, matching Figma (no tab bar visible on this screen), and popped via the back chevron (`router.back()`). `(details)` groups every screen reached via a Home "See all" link that Figma shows without a tab bar (`/notifications`, `/live-campaign`, `/campaigns`, `/businesses`, `/top-gigs`, `/top-creators`) — a route group is purely organizational in Expo Router and doesn't affect the URL, so each screen's path is unchanged.

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Notification" title | `ScreenHeader` |
| 2 | Recent notifications | Vertical stack, unlabeled | `NotificationCard` |
| 3 | "Last 24 Hours" label | Plain section label text | — |
| 4 | Last 24 Hours notifications | Vertical stack | `NotificationCard` |

## `NotificationCard`

One card per notification (Figma nodes `6346:5583`, `6346:5592`, `6346:5601`, `6346:5610`, `6346:5619`, `6346:5628`, `6346:5637`): a 44px circular icon badge (brand-pink `#F42E9E` background, white icon), a title + description column, and a trailing timestamp. `icon` is a `'money-tick' | 'wallet'` union (Figma only uses these two glyphs across all seven instances) mapped internally to the exported PNG assets, the same pattern `TabBarIcon` uses for its `name` prop.

## `ScreenHeader`

A back chevron + centered page title in a single row (Figma node `6346:5666`). Kept separate from the existing `AuthHeader` component, which stacks the back button *above* a left-aligned heading — a different shape, not a variant of the same one. `ScreenHeader` is written generically (any `title` string, optional `onBack`) so any future pushed screen needing this "`<` Title" top bar can reuse it instead of re-implementing it.

## Scope notes

- **No real backend.** As with every other flow so far, there's no notifications API (`docs/PRD.md` §2.2/§4.1) — all content comes from `data/notifications.ts`, a set of typed mock arrays (`NotificationItem[]`) using a new `NotificationItem` type in `types/`.
- **Inert card taps.** Individual `NotificationCard` taps have no `onPress` wired — there's no notification-detail screen built yet, matching this project's established pattern (see `docs/screen/home/README.md` "Scope notes") of not building ahead of what's been designed.
- **Text colors normalized.** Figma alternates between near-identical gray shades per card instance for title/description/time — `#030304` vs `#1A1C1E` for titles, `#777980` vs `#6C7278`/`#ACB5BB` for description/time — with no discernible intentional pattern (recent vs. "Last 24 Hours" cards don't consistently follow one or the other). Normalized to the theme's semantic tokens (`colors.text.primary` for titles, `palette.gray[300]` for description/time) across every card, matching this project's established normalization pattern (see `docs/screen/home/README.md`'s due-date icon/color and avatar-spacing normalizations) and picking up dark-mode support for free.
- **One card shadow.** One of the seven card instances (`6346:5601`, "Campaign Join Request Accepted") layers a second, near-invisible `0px 14px 25px rgba(8,9,11,0.05)` shadow on top of the shared `0px 6px 25px rgba(8,9,11,0.1)` one every other card uses. Treated as a one-off Figma inconsistency and normalized to the majority single-shadow style.
- **Status bar omitted.** Figma's frame includes a mocked device status bar (time/signal/wifi/battery) — this is OS chrome, not app UI, and every other screen in this codebase omits it the same way (e.g. `scenes/main/Home.tsx`).
- **Assets.** Extracted via the Dev Mode MCP server into `assets/images/notifications/` — the two icon glyphs (`money-tick`, `wallet`) rasterized from SVG at 96×96 (4× their 24px on-screen size) via `scripts/rasterize-notifications-assets.py`, the same approach `scripts/rasterize-icons.py` established. The back chevron reuses the existing `assets/images/icons/back-chevron.png` rather than re-exporting a duplicate — same glyph, already used by `AuthHeader`.

## Navigation

- **Entry:** `/home`'s `AppHeader` notification bell (`components/elements/AppHeader/AppHeader.tsx`'s `onNotificationPress`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to `/home`.
