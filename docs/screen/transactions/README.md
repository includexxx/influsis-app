# Screen Spec — Transaction

| | |
|---|---|
| **Figma node** | [`6212:7410`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6212-7410&m=dev) — "Transaction" |
| **Route** | `/transactions` (`app/(details)/transactions.tsx`) |
| **Scene** | `scenes/main/Transactions.tsx` |
| **Data** | `data/transactions.ts` (`transactions`) |
| **Types** | `types/transaction.ts` |
| **Styles** | `styles/transactions.ts` |
| **Assets** | `assets/images/withdraw/bkash-bird.png`, `paypal.png` — via `scripts/rasterize-transactions-assets.py` |
| **Components** | `ScreenHeader` (existing), `TransactionRow` (new), `WalletAvatar` (new) |

## Purpose

The full money history — every transfer in and out, newest first. Opened from the [Balance](../balance/README.md) screen's "Recent transaction" row.

## User flow

```
/ballance
  │  tap "Recent transaction"
  ▼
/transactions                                   no tab bar
  │  header: back chevron + centered "Transaction"
  │  (bKash)  Bkash transfer          / Today       +$750
  │  (PayPal) Paypal transfer         / Yesterday   +$750
  │  (bKash)  Get payment from Bkash  / Today       +$750
  │  … 11 rows total …
  │
  └─ back chevron → router.back() to /ballance
```

## Sections (top to bottom)

| # | Section | Figma | Layout |
|---|---|---|---|
| 1 | Header | `6212:7436` | Back chevron + centered "Transaction", 20/30 semibold; 24px below |
| 2 | List | `6212:7437` | 45px rows, 16px apart, flush to the 16px gutter — no card, divider or section heading |
| 3 | Row | `6212:7438` (bKash), `6212:7447` (PayPal) | 32px `#FDE6F5` disc + glyph, 14px gap, title 16/24 medium `#313131` over date 14/21 `rgba(0,0,0,0.5)`, amount 16/24 `#000` hard right |

## Design details

- **Two glyphs, one disc.** bKash rows use the 18px bird; PayPal rows use the 20px mark. Both sit on the same 32px `primary[50]` disc, which Figma draws as a flat `Ellipse 1307` fill (`6212:7441`) — so `WalletAvatar` renders it as a `View` rather than shipping a solid-circle raster.
- **Title color is Figma's literal `#313131`**, which doesn't map cleanly to any `palette.gray` step (the nearest, `gray[400]` `#4A4C56`, is visibly lighter). Used verbatim, the same reasoning `styles/orderDetails.ts` already documents.
- **No card wrapper.** Unlike other list screens in this app, Figma puts no panel, divider or background behind these rows — they sit directly on the page.
- **`amount` is a pre-formatted string.** Figma shows every row as a signed, currency-prefixed literal; there's no payouts API supplying a currency or locale to format a number against yet.

## New reusable components

| Component | Why it isn't an existing component |
|---|---|
| `TransactionRow` | Nothing in the project pairs a tinted provider disc with a title/date block and a hard-right amount |
| `WalletAvatar` | The disc + glyph lockup, split out so the same shape can back a saved-wallet card or payer row later without duplicating the fill and centering |

`ScreenHeader` is reused unmodified. This frame has no CTA, so no button style is involved.

## Route group — why it's in `(details)`

Figma's frame has **no Tab Bar instance**, unlike the Balance frame (`6402:5295`, which carries one at `y=848`). So this screen goes in `(details)`, pushing onto the root Stack with no tab bar underneath — the same split every other `(details)` screen follows.

## Scope notes

- **Figma's repetition kept verbatim.** The design cycles three row templates ("Bkash transfer / Today", "Paypal transfer / Yesterday", "Get payment from Bkash / Today") to fill 11 rows and gives every one of them the same `+$750`. Mirrored exactly rather than inventing varied amounts or dates — the convention `data/orders.ts` already follows.
- **Amounts are all credits.** Every row in Figma is `+$750`; no debit or negative styling is designed, so none is built. Because `amount` is a string, a `-$…` row renders without a component change.
- **Rows are inert.** Figma designs no transaction-detail screen. `TransactionRow` accepts an optional `onPress` for when one exists; the scene doesn't pass one, and without it the row exposes no `accessibilityRole`.
- **No pagination, filter, date grouping or empty state** — none is in the design.
- **No backend.** `data/transactions.ts` is mock content standing in for a payouts API (`docs/PRD.md` §2.2/§4.1).

## Change to the Balance screen

`PaymentMethodOption` gained an optional `href`, set only on the "Recent transaction" row. `scenes/main/Balance.tsx` now pushes when a tapped row has one and otherwise just takes the pressed state — so this screen has a real entry point without inventing routes for the three payout rails, whose destinations don't exist yet.

## Navigation

- **Entry:** `/ballance` → "Recent transaction".
- **Exit:** back chevron → `router.back()`.
