# Screen Specs — Message

| | |
|---|---|
| **Figma nodes** | [`6279:8097`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6279-8097&m=dev) — "Message" (populated list)<br>[`6366:6416`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6366-6416&m=dev) — "Message" (empty state)<br>[`6279:8211`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6279-8211&m=dev) — "Message" (chat detail) |
| **Routes** | `/message` (`app/(main)/message.tsx`), `/chat/[id]` (`app/(details)/chat/[id].tsx`) |
| **Scenes** | `scenes/main/Message.tsx`, `scenes/main/ChatDetails.tsx` |
| **Data** | `data/messages.ts` |
| **Styles** | `styles/messages.ts`, `styles/chat.ts` |
| **Components used** | `ScreenHeader`, `SearchBar`, `EmptyState`, `CircleAvatar`, `Image` (existing); `ConversationCard`, `ChatHeader`, `MessageBubble`, `DateDivider`, `MessageInputBar`, `MessageIllustration` (new, `components/elements/`) |

## Purpose

The app's messaging surface: the Message tab lists every conversation thread with a search field, and tapping a thread opens its full chat transcript with a composer.

## User flow

```
(main) Tabs ── tap "Message" tab
                  │
                  ▼
            /message  ── type in search bar ──► list filters live
                  │                              │
                  │                              └─ no matches ──► "No Message Found" empty state
                  │
                  ├─ tap a ConversationCard ──► /chat/[id]
                  │                                │
                  │                                ├─ type + send ──► message appends to transcript
                  │                                └─ tap back chevron ──► back to /message
                  │
                  └─ tap back chevron (ScreenHeader) ──► router.back()
```

`/message` stays inside the `(main)` Tabs group (it is a tab bar destination, and Figma's populated and empty frames both show the tab bar with "Message" active). `/chat/[id]` lives in `app/(details)/` — the same "no tab bar" reasoning as every other screen in that group; Figma draws the chat screen with the composer occupying the space the tab bar would take.

### Why `/chat/[id]` and not `/message/[id]`

Every other detail route in this project pairs a distinct singular segment with its list (`/brand/[id]` beside `/brands`, `/campaign/[id]` beside `/campaigns`, `/gig/[id]` beside `/top-gigs`). Nesting the detail route under the `/message` tab route's own segment would be the one exception, and would put a `(main)` tab route and a `(details)` dynamic route on the same path prefix across two route groups. `/chat/[id]` keeps the established convention and matches the scene name (`ChatDetails`).

## Sections — Messages list (`/message`)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Messages" title | `ScreenHeader` |
| 2 | Search bar | Rounded-rect field, "Search your message..." | `SearchBar variant="rounded"` |
| 3 | Conversation list | 8 rows, 16px gap | `ConversationCard` |
| 3b | Empty state | Illustration + "No Message Found" (replaces §3 when the search matches nothing) | `EmptyState` + `MessageIllustration` |

## Sections — Chat detail (`/chat/[id]`)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + 46px avatar with online dot + name/status, divider below | `ChatHeader` |
| 2 | Date separator | Centered pink pill ("Yesterday") | `DateDivider` |
| 3 | Transcript | Alternating left (gray) / right (pink) bubbles, each with a timestamp | `MessageBubble` |
| 4 | Composer | Rounded field with paperclip + emoji glyphs, standalone send button | `MessageInputBar` |

## New components

All six are written generically so later screens can reuse them:

- **`ConversationCard`** (Figma node `6280:8308` and 7 siblings) — avatar + name + last-message preview + trailing time/unread-badge stack.
- **`ChatHeader`** (node `6279:8215`) — back chevron + avatar with status dot + name/status column. Deliberately *not* built on `ScreenHeader`, which centers a plain title; this one left-aligns an avatar block instead.
- **`MessageBubble`** (nodes `6279:8226` / `6279:8234`) — one chat bubble, `sender`-driven for side, color and corner shape.
- **`DateDivider`** (node `6279:8224`) — centered pill date separator, generic on `label`.
- **`MessageInputBar`** (node `6279:8254`) — the composer bar.
- **`MessageIllustration`** (node `6366:6613`) — the empty state's illustration. Structurally identical to the existing `SearchIllustration` (same 107px disc, same white lens, same four dot offsets); only the centered glyph differs.

### Extended, not duplicated: `SearchBar`

Figma draws this control differently per screen — Home/Search use a tall filled pill (54px, 67px radius, 16px text), Messages uses a shorter squarer unfilled rectangle (50px, 8px radius, 14px text, 15px icon). Rather than add a near-identical second component, `SearchBar` gained a `variant?: 'pill' | 'rounded'` prop (`pill` is the default, so both existing call sites are unchanged).

## Asset extraction

`scripts/rasterize-messages-assets.py` (run once; the `.svg` sources are deleted afterwards) produces `assets/images/messages/`:

| Asset | Figma node | Notes |
|---|---|---|
| `paperclip.png` | `6301:6072` | Single SVG, rasterized 1:1 at 4x |
| `send.png` | `6279:8265` | Single SVG, rasterized 1:1 at 4x |
| `happy-emoji.png` | `6279:8261` | Composite — face + two eye vectors |
| `no-message.png` | `6366:6688` | Composite — **14** separate leaf vectors |

Figma exports a deeply nested illustration as one SVG per leaf vector, each positioned by a percentage inset on its parent. The script re-assembles those leaves onto a single transparent canvas using the exact insets Figma reports, so the app ships one flat PNG instead of stacking 14 `<Image>` layers at runtime. Rasterization (rather than shipping SVG) follows the existing `scripts/rasterize-*.py` precedent — expo-image does not render SVG and this project has no `react-native-svg` dependency.

The back chevron (`assets/images/icons/back-chevron.png`) and search icon (`assets/images/home/search.png`) already existed and are reused rather than re-extracted.

## Scope notes

- **No real backend.** As with every other flow so far, there is no messaging API (`docs/PRD.md` §2.2/§4.1) — every conversation and transcript comes from `data/messages.ts`.
- **Sent messages are session-local.** The composer is functional: `ChatDetails` appends a sent message to local state so the send button does something real. It is not persisted or delivered anywhere, and it disappears when the screen unmounts — deliberately, rather than faking a delivered state there is no service to back.
- **Figma's one example transcript mirrored across every thread.** Figma shows a single transcript (for Kathryn Murphy, under one "Yesterday" group) and gives all 8 list rows the same preview text, timestamp and unread count. Both are mirrored as-is rather than inventing distinct content Figma does not specify — same convention as Gig Details' "What I will create" breakdown and the influencer bios/reviews.
- **Avatars reuse existing headshots.** Figma's 8 rows use 8 distinct stock photos. `data/messages.ts` cycles the headshot photos already in the repo (`assets/images/influencers/*`, `profile/*`, `brand-details/avatar.jpg`) instead of committing 8 more near-duplicate photo assets for mock threads.
- **Bubble widths are proportional, not fixed.** Figma pins each bubble to a fixed width (365 received / 278 sent) sized around its one example string. `MessageBubble` uses `maxWidth` percentages of the same proportion so real messages of any length wrap correctly instead of being clipped or leaving a half-empty bubble.
- **Grays normalized to palette tokens.** Figma's `#AAAAAA` list preview/time gray maps to `palette.gray[200]` (`#A5A5AB`), the same normalization `NotificationCard` already applies to its per-instance grays.
- **Not visually verified in a running app.** Lint, `tsc --noEmit` and the full Jest suite (44 suites / 92 tests) pass, and each extracted asset was rendered and checked against Figma's screenshot, but the dev server was not started this session, so the assembled screens have not been seen running.

## Navigation

- **Entry:** the "Message" tab in the `(main)` tab bar → `/message`; any `ConversationCard` tap → `/chat/[id]`.
- **Exit:** `/message`'s back chevron → `router.back()`; `/chat/[id]`'s back chevron → `router.back()` to the list.
- **Invalid `id` falls back to the list.** If `/chat/[id]` is reached with an id matching no conversation (a stale link, a typo'd deep link), the scene renders `<Redirect href="/message" />` rather than a broken empty transcript — same guard as every other detail screen.
