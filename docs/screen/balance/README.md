# Screen Spec — Balance

| | |
|---|---|
| **Figma node** | [`6402:5295`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6402-5295&m=dev) — "Balance" |
| **Route** | `/ballance` (`app/(main)/ballance.tsx`, registered with `href: null`) |
| **Scene** | `scenes/main/Balance.tsx` |
| **Data** | `data/balance.ts` (`balanceSummary`, `paymentMethods`) |
| **Types** | `types/balance.ts` |
| **Styles** | `styles/balance.ts` |
| **Assets** | `assets/images/withdraw/`, extracted via `scripts/rasterize-balance-assets.py` |
| **Components** | `ScreenHeader` (existing), `BalanceCard` (new), `EarningTile` (new), `BillingRow` (new) |

## Purpose

The creator's money home: current balance and its period-over-period delta, monthly and lifetime earnings, and a four-row "Payment Method" list.

Opened from the Profile tab's **Ballance** row (`scenes/main/Profile.tsx`).

## User flow

```
/profile
  │  tap "Ballance" (SettingsRow)
  ▼
/ballance                                       tab bar stays visible
  │  header: back chevron + centered "Balance"
  │  pink hero card — "Total Balance" $450.00, "▲ 3.2%" pill, arrow
  │  two gray tiles — $150.00 Monthly earning | $1550.00 Total earning
  │  "Payment Method"
  │    ├─ Mobile banking        / Instant transfer
  │    ├─ Bank transfer         / 1-3 business days
  │    ├─ Credit or Debit card  / Various processing times
  │    └─ Recent transaction    / Various processing times   ← pink, pre-selected
  │
  │  tapping a row moves the pink selection to it
  └─ back chevron → router.back() to /profile
```

## Sections (top to bottom)

| # | Section | Figma | Layout |
|---|---|---|---|
| 1 | Header | `6402:5326` | Back chevron + centered "Balance", 20/30 semibold |
| 2 | Hero card | `6402:5327` + `5328` + `5339` | 398×191, `#E51D84`, 8px radius, `overflow: hidden`; 16px padding; sparkline bottom-anchored inside the same inset |
| 3 | Earning tiles | `6402:5299/5300` + `5337/5338/5342/5343` | Two 194×86 `#F4F4F4` tiles, 10px apart; value 24/32 semibold `#030304` over label 16/24 `#777980` |
| 4 | Section heading | `6402:5344` | "Payment Method", 18/27 semibold `#030304`, 32px above |
| 5 | Method rows | `6402:5345`–`5348` + `5349/5374/5397/5428` | Four 398×73 tiles, 8px radius, `#F4F4F4` (`#FDE6F5` when selected), 10px apart; 30px glyph + 14px gap + title/description + 24px chevron |

## Design details

- **Hero card.** Label 16/30 `#F4F4F4`; total 24/32 semibold white. The delta pill is white, 12px radius, 5px/6px padding, holding a 14px arrow and "3.2%" at 14/21 semibold `#4A4C56` with `-0.28` tracking; a 24px white arrow sits 16px to its right.
- **Sparkline.** Figma's `Frame 427320667` (`6402:5339`) is a clipped 366×75 vector — exported and rasterized at 3× (`balance-chart.png`) and rendered `contentFit="fill"` pinned to the card's bottom inside the same 16px inset.
- **Delta direction.** Figma only draws the "up" state. `BalanceCard` takes a `changeDirection` prop and rotates the same glyph 180° for "down" rather than shipping a second asset — the value is a delta, so the down case has to exist.
- **Selected row.** Figma seeds the pink `#FDE6F5` fill on "Recent transaction" (`6402:5348`). That reads as a press affordance rather than a persisted default, so the rows ship unhighlighted — `BillingRow` supports it through the `highlighted` prop (which also sets `accessibilityState.selected`), and the scene tracks `selectedId` ready to drive it once these rows have destinations.
- **The row chevron is mirrored.** Figma wraps the trailing chevron in a `rotate-180` + `scale-y-[-1]` transform (`6402:5370`'s parent, and the identical `6001:39221` on the sibling Balance frame) — the exported glyph itself points *left*. `BillingRow` applies a 180° rotation to match; for a vertically symmetric chevron that's the same result as Figma's mirror, without needing a second asset.

## New reusable components

| Component | Why it isn't an existing component |
|---|---|
| `BalanceCard` | Nothing in the project draws a tinted hero card with a delta pill over a bottom-anchored sparkline |
| `EarningTile` | `StatTile` is icon-led with the value *below* a smaller label and no fixed height; this is text-only and figure-first |
| `BillingRow` | `SettingsRow variant="card"` is a white shadowed card with a 24px icon and a 13px description; this is a flat tinted tile with a 30px glyph, a pink selected state and Figma's larger type scale |

`ScreenHeader` is reused unmodified. `buttonStyle.primary` isn't needed — this frame has no CTA.

## Route group — why it lives in `(main)`

Figma's frame keeps a **Tab Bar** instance mounted at `y=848`, so the screen is registered inside the `(main)` Tabs group with `href: null` (the pattern `/search` already established) rather than in `(details)`, which would push it onto the root Stack with no tab bar underneath.

## Scope notes

- **Route is spelled `/ballance`.** That matches the `router.push('/ballance')` already in `scenes/main/Profile.tsx`, so the existing entry point works. It's a misspelling of "balance" — renaming means changing the route file name, the `Tabs.Screen name` in `app/(main)/_layout.tsx`, and the Profile row's `push`.
- **Only "Recent transaction" navigates so far.** Figma gives every row a chevron, implying a destination, but only the transaction history exists in this codebase — that row carries an `href` to [`/transactions`](../transactions/README.md) and the other three just take the pressed state. Adding an `href` in `data/balance.ts` is the whole change once the payout-rail screens are built.
- **No backend.** `data/balance.ts` is mock content standing in for a payouts API, like every other screen (`docs/PRD.md` §2.2/§4.1). The amounts are Figma's literals, not computed.
- **Assets.** 8 SVG glyphs were rasterized to PNG (`scripts/rasterize-balance-assets.py`) because expo-image doesn't render SVG — the same approach `scripts/rasterize-icons.py` established. The back chevron reuses `ScreenHeader`'s existing `assets/images/icons/back-chevron.png`.

## Navigation

- **Entry:** Profile tab → "Ballance" row.
- **Exit:** back chevron → `router.back()`.
