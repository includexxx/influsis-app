# Screen Specs — Withdraw to Bank

| | |
|---|---|
| **Figma nodes** | [`6212:7623`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6212-7623&m=dev) directory · [`6212:7801`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6212-7801&m=dev) account number · [`6212:7849`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6212-7849&m=dev) OTP · [`6407:5772`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6407-5772&m=dev) success |
| **Routes** | `/withdraw/bank`, `/withdraw/bank/[id]`, `/withdraw/bank/[id]/verify`, `/withdraw/success` — all in `app/(details)/` |
| **Scenes** | `WithdrawBank.tsx`, `WithdrawBankAccount.tsx`, `WithdrawBankVerify.tsx`, `WithdrawSuccess.tsx` |
| **Data / types** | `data/banks.ts` (`banks`, `withdrawReceipt`), `types/bank.ts` |
| **Styles** | `styles/withdrawBank.ts`, `styles/withdrawSuccess.ts` |
| **Assets** | `assets/images/withdraw/` (+ `banks/`) via `scripts/rasterize-withdraw-bank-assets.py` |

## Purpose

Move money to a bank account: pick the bank, enter the account number, confirm with the OTP the bank sends, and read back the receipt.

Opened from the [Balance](../balance/README.md) screen's **Bank transfer** row.

## User flow

```
/ballance
  │  tap "Bank transfer"
  ▼
/withdraw/bank                                   no tab bar from here on
  │  "Enter Bank name to search"
  │  [ Enter Bank Name              ]  ← filters as you type
  │  "All Banks"  ┌──────────────────────┐
  │               │ [logo] City Bank …   │
  │               │  … 14 rows …         │
  │               └──────────────────────┘
  │  tap a bank
  ▼
/withdraw/bank/[id]
  │  [ [logo] City Bank Limited     ]  ← the chosen bank, in the field's slot
  │  "Account Number"
  │  [ 👤 Enter Bank Account Number ]
  │  ┌ pink hint: where the OTP will be sent ┐
  │  For details, please read Terms & Conditions
  │  [ Continue ]
  ▼
/withdraw/bank/[id]/verify
  │        [logo]  City Bank Limited
  │        ┌──┐ ┌──┐ ┌──┐ ┌──┐
  │     Don't Receive the verification code? Resend Code
  │  [ Continue ]  ← disabled until 4 digits
  ▼
/withdraw/success                                no header, no CTA
  │        ✦ ✓ ✦
  │   Withdraw money successfully
  │  Your withdraw has been processed
  │  ╭ (avatar) Aliya Leon      $750 ╮
  │  Transaction ID     #1234567889909
  │  Date & Time       Oct 12, 15.87 PM
  └─ gesture / hardware back
```

## 1 — Bank directory (`6212:7623`)

| # | Section | Figma | Layout |
|---|---|---|---|
| 1 | Header | `6212:7649` | Back chevron + "Withdraw to Bank", 24px below |
| 2 | Field label | `6212:7650` | 16/24 `#030304` |
| 3 | Search field | `6212:7652` | 398×46, 8px radius, 1px `rgba(0,0,0,0.15)`, 14px padding; placeholder 14/21 `#777980` |
| 4 | List label | `6212:7651` | "All Banks", 16/24, 24px above |
| 5 | Panel | `6212:7656` + `7657` | 10px radius, 1px `rgba(0,0,0,0.1)`, 14px padding, rows 12px apart |
| 6 | Bank row | `6212:7658` … | 30px logo + 12px gap + name 14/21 `#030304` |

- **Panel height.** Figma fixes it at 556px with the list clipped inside; here it grows to fit and the page scrolls, so all 14 banks stay reachable on a short device.
- **Logo boxes.** Figma sizes each logo differently (30×22 City Bank, 30×6 Dhaka Bank, 30×30 for the round seals) because it crops each export's whitespace with a fitted fill. Trimming the margins at extraction time reproduces the same proportions from one uniform 30×30 box with `contentFit="contain"`.
- **Empty state.** Figma has none. A single line — "No bank matches “…”." at 14/21 `#777980` — was added because a filter that can return nothing needs one. It's the only element on this screen not in the design.
- **No CTA.** Figma draws none here; the list is the action.

## 2 — Account number (`6212:7801`)

| # | Section | Figma | Layout |
|---|---|---|---|
| 2 | Selected bank | `6245:5635` | The previous screen's 398×46 field shape, holding a `BankRow` instead of an input |
| 3 | Account field | `6212:7834` + `7835` | 398×53, 10px radius, 1px `rgba(0,0,0,0.1)`; 20px person glyph + 12px gap + placeholder 14/21 `#777980` |
| 4 | OTP hint | `6212:7839` + `7840` | `#FDE6F5`, 8px radius, 17px padding; 32px bulb + 11px gap + copy 14/21 `rgba(0,0,0,0.8)` |
| 5 | Footnote | `6212:7846` | "For details, please read" `rgba(0,0,0,0.5)` + "Terms & Conditions" medium `rgba(0,0,0,0.8)` |
| 6 | CTA | `6231:5743` | Pinned "Continue", 398×54, 12px radius, `#F42E9E` |

- **The chip reuses the search field's shape.** Figma keeps the "Enter Bank name to search" label above it and swaps the input's contents for the picked bank — so `withdrawBankStyle.searchField` is shared between the two screens. Tapping the chip goes back to the directory.
- **Hint card wraps.** Figma fixes it at 124px on its 430pt artboard; at 375pt the copy wraps to four lines and the card grows to ~139px. Height is left to content.
- **Unknown id redirects** to `/withdraw/bank` — the same fallback `OrderDetails` uses for its dynamic route.
- **"For more details, check" ends mid-sentence in Figma** — reproduced verbatim rather than completed.

## 3 — OTP (`6212:7849`)

| # | Section | Figma | Layout |
|---|---|---|---|
| 2 | Bank lockup | `6212:7887` | Centered 122px below the header: 42×30 logo + 16px gap + name 18/21 medium `#313131` |
| 3 | OTP boxes | `6212:7879` | Four 86×75 boxes, 12px radius, 29px below the lockup |
| 4 | Resend | `6212:7884` | Centered 24px below: prompt 14/16 `rgba(0,0,0,0.6)` + "Resend Code" medium `#0B0B0B` |
| 5 | CTA | `6246:5636` | Pinned "Continue" |

**Reusing `OtpInput`.** The existing element (built for the auth flow) already draws four 86×75 boxes at a 12px radius — this frame's exact geometry — so it's reused unmodified. Two deliberate differences:

- **Border color.** `OtpInput` uses `palette.gray[200]` (`#A5A5AB`); this frame specifies `rgba(0,0,0,0.3)` (≈`#B3B3B3`). The shared component is left alone rather than forked for a difference that isn't visible side by side.
- **Horizontal inset dropped.** Figma insets the boxes 32px from its 430pt artboard, 16px more than the page gutter. Four fixed 86px boxes plus gaps need 365px, so at 375–414pt the row already needs the full gutter — the same width the auth screen's OTP gets.

**"Continue" is gated.** Figma draws only the empty state, so it shows an enabled CTA. Shipping that would let a half-typed code through, so the button is disabled until all four digits are in (rendered at 0.6 opacity). This is the one behavior added beyond the frame, and it's a correctness guard rather than new UI.

**The lockup is larger than the directory row** (42×30 logo, 18px name vs 30×30 / 14px), so `BankRow` is not reused here — it's built inline.

## 4 — Success (`6407:5772`)

| # | Section | Figma | Layout |
|---|---|---|---|
| 1 | Confetti + tick | `6407:5796` / `5797` / `5812` | 337.77×198.25 burst with a 113px green tick 39px down, centered |
| 2 | Headline | `6407:5816` | Title 24 semibold `-0.72` `#030304`; description 14 medium `-0.28` `#777980`; 14px apart |
| 3 | Receipt pill | `6407:5819` | 68px tall, 100px radius, white, 1px `#E9E9EA`; 48px avatar + name and amount 16 semibold `-0.48` |
| 4 | Details | `6407:5824` | Two label/value lines 16px apart; label 14 medium `#777980`, value 14 semibold `#030304` right-aligned |

Sections 2/3/4 are 40px apart (Figma's `6407:5815` container gap).

- **27px gutter, not 16.** Figma insets this screen's content 27px (`6407:5815` at `x=27, w=376`) rather than the 16px the rest of the flow uses. Reproduced as-is.
- **The tick is one asset.** Figma's "Check" node is the filled green circle *and* the glyph, so it's exported whole rather than composed from `assets/images/icons/success-check.png`, which is the bare tick. That's also why this screen doesn't reuse `SuccessSheet`'s badge.
- **Confetti caps rather than pins.** It keeps Figma's 338×198 on a wide screen but is `width: '100%'` with `maxWidth: 338` and a fixed aspect ratio, so it shrinks instead of bleeding past the 27px gutter at 375pt (measured 321×188).
- **No header and no CTA.** Figma gives this frame neither, so neither is invented — gesture/hardware back is the only exit. A "Done" returning to `/ballance` would be a design decision, not an omission here.

## New reusable components

| Component | Why it isn't an existing component |
|---|---|
| `BankRow` | 30px logo + 14px name, reused as the selected-bank chip on the next screen |
| `SuccessHero` | `SuccessSheet` is a bottom-sheet popup with a square badge and its own CTA; this is a full-screen confetti-backed hero with none |
| `RecipientPill` | Nothing in the project draws a fully-rounded avatar + name + amount receipt card |
| `SummaryRow` | Borderless label/value line for the receipt details |

Reused unmodified: `ScreenHeader`, `Image`, `Button`, `OtpInput`. `buttonStyle.primary` already matches Figma's "Continue Button" (54px, 12px radius, `#F42E9E`) exactly, so no new button style.

## Route group — why all four are in `(details)`

None of these frames carries a Tab Bar instance, unlike the Balance frame (`6402:5295`, which has one at `y=848`). So all four push onto the root Stack with no tab bar underneath.

## Scope notes

- **Where this flow sits in Figma's fuller design.** Figma routes the bank branch through an amount step (`6212:7543`) and a review step (`6212:7574`) between the OTP and the success screen. Those two frames weren't part of this request, so OTP → "Continue" goes straight to `/withdraw/success`. Inserting them later means changing one `router.push`.
- **Entry point.** `data/balance.ts`'s "Bank transfer" row gained `href: '/withdraw/bank'`, the same optional-`href` mechanism the "Recent transaction" row already uses. Figma reaches this flow via a "Withdraw Method" picker (`6212:7700`) that isn't built; wiring it from Balance gives the flow a real entry without inventing that screen.
- **"Socail Islami Bank Limited" appears three times.** Figma lists that name (typo included) against three different logos. Kept verbatim rather than renamed or de-duplicated, the convention `data/orders.ts` already follows.
- **No backend.** No account-number validation, no real OTP (any four digits pass), "Resend Code" is inert, and the receipt values are Figma's literals — `#1234567889909` and `Oct 12, 15.87 PM`, odd time format included. See `docs/PRD.md` §2.2/§4.1.
- **Terms links are inert**, matching the rest of the app's "don't build interactions beyond what's been designed" convention.

## Navigation

- **Entry:** `/ballance` → "Bank transfer".
- **Exit:** back chevron on the first three screens → `router.back()`; the success screen has gesture/hardware back only.
