# Screen Specs — Mobile Banking

| | |
|---|---|
| **Figma nodes** | [`6212:7700`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6212-7700&m=dev) picker · [`6212:7767`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6212-7767&m=dev) bKash hand-off · [`6212:7543`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6212-7543&m=dev) amount · [`6212:7574`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6212-7574&m=dev) review · [`6418:6559`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6418-6559&m=dev) success |
| **Routes** | `/withdraw/method`, `/withdraw/bkash`, `/withdraw/amount`, `/withdraw/review`, `/withdraw/success` — all in `app/(details)/` |
| **Scenes** | `WithdrawMethod.tsx`, `WithdrawBkash.tsx`, `WithdrawAmount.tsx`, `WithdrawReview.tsx` (+ the existing `WithdrawSuccess.tsx`) |
| **Data / types** | `data/withdrawMethods.ts`, `types/withdrawMethod.ts` |
| **Styles** | `styles/withdraw.ts` |
| **Assets** | `assets/images/withdraw/` via `scripts/rasterize-mobile-banking-assets.py` |

## Purpose

Withdraw to a mobile wallet: pick the provider, confirm on its own checkout surface, enter the amount, review, done.

Opened from the [Balance](../balance/README.md) screen's **Mobile banking** row.

## User flow

```
/ballance
  │  tap "Mobile banking"
  ▼
/withdraw/method                                  no tab bar from here on
  │  ┌──────────────────────────┐
  │  │ [bKash logo]          ›  │  ← pink border, pre-selected
  │  │ [Nagad logo]          ›  │
  │  │ [Rocket logo]         ›  │
  │  │ 🏦  Bank Account      ›  │──┐
  │  │ 💳  Visa Debit Card   ›  │──┤ → /withdraw/bank  (Withdraw to Bank flow)
  │  └──────────────────────────┘  │
  │  tapping a row only selects it │
  │  [ Continue ] routes by selection
  ▼                                 │
/withdraw/bkash                     │
  │  300×513 bKash checkout card    │
  │  ( avatar ) Aliya Leon    ৳20   │
  │  [ Continue ]                   │
  ▼                                 │
/withdraw/amount  ◄─────────────────┘ (bank branch rejoins here after its OTP)
  │  "Withdraw amount"  [        ]
  │  [ Next ]
  ▼
/withdraw/review?amount=…
  │  "Payment method"  ( bKash ) 01521702480 / Save by bkash   ✓
  │            Change withdraw methode  → /withdraw/method
  │  "Review"  [ Withdraw amount            $750 ]
  │  By pressing "Confirm" you agree to the Terms and Conditions
  │  [ Continue ]
  ▼
/withdraw/success                                 no header, no CTA
```

## 1 — Withdraw Method picker (`6212:7700`)

| # | Section | Figma | Layout |
|---|---|---|---|
| 1 | Header | `6212:7726` | Back chevron + "Withdraw Method", 18px below |
| 2 | Method list | `6212:7727`/`7733`/`7739`, `6224:5521`/`5520` | Five white cards, 8px radius, 1px `#E9E9EA` border (`#F42E9E` when selected), 16px apart |
| 3 | CTA | `6217:10191` | Pinned "Continue", 398×54, 12px radius, `#F42E9E` |

**Two row shapes in one list**, so `WithdrawMethodRow` carries both:

| Row | Shape | Box |
|---|---|---|
| bKash | logo only | 57×32 |
| Nagad | logo only | 51×32 |
| Rocket | logo only | 49×34 |
| Bank Account | icon + label | 35×35 |
| Visa Debit Card | icon + label | 30×30 |

- **Selection vs navigation.** Tapping a row only selects it; "Continue" advances. That's why each option carries its own `href` and the CTA reads it from the selected row.
- **Two chevron assets.** Figma exports a pink chevron for the selected row and a gray one for the rest — both extracted rather than tinting one glyph.
- **Logos were trimmed.** Figma crops each logo's baked-in whitespace with a negative-inset `object-cover` fill (the Rocket export is a 320×320 square cropped to a 49×34 banner). The margins are cropped at extraction time instead, so each row uses a plain `contentFit="contain"` in its Figma-sized box.
- **Row heights vary 56–61px** because the content boxes differ (32px logos vs a 35px icon) — the same variance Figma's own 56/56/56/59/59 has, from the same cause.

## 2 — bKash hand-off (`6212:7767`)

The provider's checkout card — wordmark, pink account-number panel, Cancel/Confirm pair, 16247 footer — is a **single flattened 300×513 bitmap** in Figma (`image 101`, node `6212:7796`). There's no component tree behind it and no vector source for its parts, so it's rendered as the image it is rather than rebuilt from guesses.

Only the payer row Figma layers on top (`6212:7797`) is real markup: a 36px avatar, 12px gap, name at 16px `#444444` with `-0.48` tracking, positioned `+11, +70` inside the card — Figma's exact offsets. The `৳20` to the right of the name is part of the bitmap, not a separate text node.

- **No bKash SDK.** The card's own Cancel/Confirm are pixels, not controls; the pinned app "Continue" advances to the amount step.
- **Shared by all three wallets.** Nagad and Rocket route here too — Figma designed a checkout frame only for bKash. This is the one place the flow shows content that isn't literally the tapped provider's.

## 3 — Amount (`6212:7543`)

| # | Section | Figma | Layout |
|---|---|---|---|
| 2 | Label | `6212:7570` | "Withdraw amount", 18/27 semibold `#030304` |
| 3 | Field | `6212:7972` | 398×54, 12px radius, 1px `#A5A5AB`, 12px below the label |
| 4 | CTA | `6212:7980` | Pinned "Next" |

- **No placeholder.** Figma draws the field completely empty — no placeholder, no currency prefix, no helper line — so none is added.
- **`TextField` reused, reshaped via props.** Its default 12px-radius / `gray[100]` row doesn't match, so this screen passes `inputRowStyle` (54px, `#A5A5AB`, zero vertical padding) and `inputStyle` (16/24) — the same override path Order Deliver's link field uses. `keyboardType="decimal-pad"`.
- **Amount handoff** goes to the review step as `?amount=…` rather than through Redux: a one-hop handoff inside a single flow, which `docs/PRD.md` §6's "local state only when not shared" convention covers.

## 4 — Review (`6212:7574`)

| # | Section | Figma | Layout |
|---|---|---|---|
| 2 | Heading | `6212:7601` | "Payment method", 18/27 semibold |
| 3 | Saved wallet | `6212:7971` | 398×65, 8px radius, 1px `rgba(0,0,0,0.3)`; 32px `primary[50]` disc + 18px bKash glyph, account 16/24 medium `#313131`, "Save by bkash" 14/21 `#777980`, 20px pink filled check right |
| 4 | Change link | `6212:7616` | Centered, 16/24 `#777980`, 16px below |
| 5 | Review heading | `6212:7602` | "Review", 18/27 semibold |
| 6 | Amount card | `6212:7979` | `#EFEFEF`, 8px radius, 24px/19px padding; label 16/24 medium `#030304`, value 16/24 `#000` |
| 7 | Terms | `6212:7617` | 12/18; body `rgba(29,29,29,0.5)`, "Terms and Conditions" `#1D1D1D` |
| 8 | CTA | `6212:7982` | Pinned "Continue" |

- **Amount playback.** `?amount=` is read with `useLocalSearchParams` and prefixed with `$` (stripping one if the user typed it). Figma's frame shows `$750`, the fallback when deep-linked without the param.
- **`SummaryRow` gained a `variant`.** It shipped with the success screen's borderless shape; this card is the same label/value line in Figma's filled form, so `variant="filled"` was added rather than writing a second component. `plain` stays the default, so the success screen is unaffected.
- **Selected-state radio.** Figma draws only the checked state. `SavedMethodCard` renders an empty 20px outlined circle when unselected so the row doesn't reflow.
- **"Confirm" vs "Continue".** The terms sentence says *Confirm* while the button says *Continue* — Figma's own inconsistency, both reproduced verbatim.

## 5 — Success (`6418:6559`)

Byte-identical to `6407:5772`, already built as `/withdraw/success` — see [Withdraw to Bank](../withdraw-bank/README.md#4--success-64075772). No new work; this flow just routes into it.

## New reusable components

| Component | Why it isn't an existing component |
|---|---|
| `WithdrawMethodRow` | Carries two shapes in one row (bare provider logo, or icon + label) plus a pink selected border and a two-asset chevron |
| `SavedMethodCard` | Saved wallet with a filled-check radio, built on the existing `WalletAvatar` |

Extended: `SummaryRow` gained `variant="filled"`. Reused unmodified: `ScreenHeader`, `Image`, `Button`, `TextField`, `WalletAvatar`. `buttonStyle.primary` already matches Figma's "Continue Button" exactly.

## Changes to already-built screens

- **Balance.** `data/balance.ts`'s "Mobile banking" row gained `href: '/withdraw/method'`, using the same optional-`href` mechanism the other rows use. All four Balance rows now navigate.
- **Bank OTP now rejoins here.** `scenes/main/WithdrawBankVerify.tsx`'s "Continue" previously went straight to `/withdraw/success` because the amount and review steps didn't exist. It now goes to `/withdraw/amount`, which is Figma's actual flow — both branches converge on the shared amount step.

## Scope notes

- **No backend.** No amount validation against the balance, no bKash SDK, no real payment. `data/withdrawMethods.ts` is mock content (`docs/PRD.md` §2.2/§4.1).
- **One saved wallet, hardcoded.** Figma shows a single saved bKash account (`01521702480`) and always-selected; there's no saved-methods API and no multi-card list in the design.
- **Terms links are inert**, matching the rest of the app.

## Navigation

- **Entry:** `/ballance` → "Mobile banking".
- **Exit:** back chevron on each step → `router.back()`; the success screen has gesture/hardware back only.
