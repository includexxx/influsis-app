# Current Feature

## 34. Review the agreement before accepting

**Branch:** `feature/review-the-agreement-before-accepting`

**Status:** verified

**Type:** Feature

### Implementation notes (deviations from the spec, all recorded here)

- **Currency.** Amounts render through `formatCampaignPrice` ("BDT 12,500"),
  as the Data / contracts section asks, so the sheet matches the Offer
  thread; the spec's "৳12,500" copy was read as notation. Screen readers hear
  "12,500 taka".
- **Content deadline.** Formatted with `formatCampaignDueDate` (date-only,
  timezone-safe) instead of `formatOfferDate`, which reads a `YYYY-MM-DD`
  string as UTC midnight and can show the previous day.
- **Stale handling.** The Offer screen snapshots the agreement the creator
  pressed Accept on; after a `409` refetch that no longer has that offer
  pending, the sheet keeps those terms with Accept disabled. If the business's
  offer disappears before Accept is pressed, the sheet shows "This offer is
  no longer available." with Close (not in the spec's copy table).
- **CB2 loading.** The Offer screen fetches `CB2` only while the sheet is
  open. The Deliverables screen fetches it on load, because the redesign below
  shows the content deadline under the title (hidden when `CB2` fails, e.g.
  404 once the campaign is no longer live).
- **Old accept endpoint.** `useAcceptMyEngagementMutation` is no longer used
  by Applications but stays in `campaignFeedApi.ts`, which the spec marks
  "Not touched".
- **User-requested design follow-ups (after the spec's steps):**
  - Deliverables screen redesign: brand-gradient summary card (title, content
    deadline, approval progress), half-width icon pills for View campaign /
    View agreement, elevated piece cards with platform icons, dashed empty
    state. Unused list styles (`row`, `rowTitle`) removed from
    `deliverables.style.ts`; styles shared with the piece screen unchanged.
  - Agreement sheet redesign in the same language: icon header, campaign card
    with avatar or initial, gradient "You'll receive" card with a licensing
    chip, icon detail rows with deliverable chips, amber lock note, pill
    buttons. Copy, forbidden-copy rules and behaviour unchanged; the separate
    "Campaign" label row became the campaign card.
- **Tests:** `agreement.test.ts` 10; `AgreementSheet.test.tsx` 9;
  `OfferScreen.test.tsx` 16 (+5, accepted-summary test rewritten);
  `Applications.test.tsx` +1; `DeliverablesScreen.test.tsx` 9 (+3). The
  sheet's tests log the icon font-load "not wrapped in act" warning, as the
  existing `DeliverablesEditor` tests do.
- **Checks:** `npm run lint` (0 errors), `npm run test` (154 suites, 829
  tests), `prettier --check` on changed files. Expo Go checks in steps 3-4
  were not run (no device or backend available).

## Goal

Accepting (`CF4`) is binding: it locks the price and the deliverables. Today
the creator can accept from a one-line confirm on the Offer screen, or with a
**single tap** on a Request-tab invitation card, without seeing the terms.
After this feature, every Accept goes through an **agreement sheet**:

- the business and campaign
- the deliverables (the engagement's `scope`)
- the content deadline
- **"You'll receive ৳X"**

Confirming there sends `CF4`. Afterwards the same sheet opens read-only from
**View agreement**.

The creator sees only their own money: the full deal, licensing included (F-2,
F-6). They never see the platform fee, VAT, the processing fee or the
business's total. No payment copy appears, because payment and escrow are
deferred.

## In scope

- A pure `agreement.ts` module that builds the creator's agreement view and
  the payout amount.
- An `AgreementSheet` scene component (confirm and confirmed modes).
- Offer screen:
  - Accept opens the sheet. Confirming sends `CF4`.
  - The accepted summary shows "You'll receive" (fixed to include the markup)
    and **View agreement**, and drops the escrow-deadline line.
- Request tab: the invitation card's quick **Accept** opens the Offer screen
  with the sheet already open, instead of calling `CF4` directly. Decline is
  unchanged.
- Deliverables screen: a **View agreement** link under the campaign title.
- Updated tests for the Offer screen and Applications.

## Out of scope

- Escrow status, funding deadlines, "payment secured" or any payment copy.
  That's escrow item 27.
- The business side (done in `web` item 38). Notifications. Messaging.
- New backend fields. Nothing here needs a backend change.
- A reusable `components/elements` sheet. The agreement sheet is
  campaign-specific, so it lives in `scenes/campaigns/components/`.

## Build loop

`workflow.stepReview` is `feature`: build all steps, then present one review
packet. `workflow.checkpointCommits` is `disabled`. `/complete` makes the
feature commit. Create the branch from the current branch,
`feat/campaign-negotiation`.

## Build steps

- [x] **1. Agreement logic.** Add `scenes/campaigns/utils/agreement.ts` (see
  Data / contracts) and `agreement.test.ts`.

  **Done when:** `npm run test` passes with cases for:
  - `licensingMarkupMinor`: tier 1 → 0, tier 2 → 25%, tier 3 → 50%, and
    integer truncation (tier 2 on 1 poisha → 0)
  - confirm mode: the business's pending offer plus the tier markup
    (৳10,000 on tier 2 → you receive ৳12,500, licensing ৳2,500)
  - confirm mode is `null` when no business offer is pending, or when the
    campaign is missing
  - confirmed mode: uses `agreedAmountMinor` + `licensingMarkupMinor` (null
    markup → 0) and ignores the tier
  - confirmed mode is `null` unless the status is `accepted`/`completed` with
    an agreed amount
  - fallbacks: no campaign in confirmed mode → title from the route param, no
    business, deadline "No deadline set"

- [x] **2. `AgreementSheet` component.** Add
  `scenes/campaigns/components/AgreementSheet.tsx`, exported from the
  `components` barrel and built on `BottomSheet` like `OptionSheet`, plus
  `AgreementSheet.test.tsx`.

  **Done when:** `npm run test` passes for:
  - confirm mode renders the business, campaign, deliverables, deadline and
    "You'll receive ৳12,500", plus the licensing line on tier 2/3 only
  - **no** "fee", "VAT", "processing" or "total" text appears in either mode
  - Accept & confirm calls `onConfirm` with the offer id
  - confirmed mode has no Accept button and shows "Agreement confirmed"
  - loading, error-with-retry, and stale states (Accept disabled, server
    message shown)

- [x] **3. Offer screen wiring.** In `OfferScreen.tsx`:
  - Accept opens the sheet in confirm mode instead of `ConfirmDialog`. Remove
    `'accept'` from `Confirm` and from `confirmCopy`.
  - Confirming runs the existing `run('accept', …)` with the offer id the
    sheet shows. On success the sheet switches to confirmed mode, built from
    the refetched `CF3`.
  - A `409` keeps the sheet open with the server message, refetches, and
    disables Accept once the shown offer is no longer pending.
  - `AcceptedSummary` shows "You'll receive ৳X" (agreed + markup) and a View
    agreement button. Delete the "licensing markup is the business's cost"
    comment and the escrow-deadline line.
  - Read `useLocalSearchParams` `review`: when it is `'1'` and the screen
    loads with a business offer pending, open the sheet once.
  - Update `OfferScreen.test.tsx`: the accept flow goes through the sheet, and
    the accepted-state test asserts "You'll receive" (markup included) and no
    escrow line.

  **Done when:** `npm run test` and `npm run lint` pass. In Expo Go, Accept →
  sheet → Accept & confirm accepts a real offer and shows "Agreement
  confirmed".

- [x] **4. Request tab and Deliverables entry points.**
  - `Applications.tsx`: the invitation card's `onAccept` navigates to
    `/engagement/[id]` with `review: '1'` (plus `title`) instead of calling
    `acceptMyEngagement`. Decline keeps the quick `CF5`.
    `useAcceptMyEngagementMutation` stays exported but unused here; remove it
    only if nothing else imports it.
  - `DeliverablesScreen.tsx`: a "View agreement" text button under the title
    opens `AgreementSheet` in confirmed mode for this engagement.
  - Update `Applications.test.tsx`: quick Accept navigates with
    `review: '1'` and sends no `CF4`.

  **Done when:** `npm run test` and `npm run lint` pass. In Expo Go, a
  Request-tab Accept lands on the Offer screen with the sheet open, and
  Deliverables → View agreement shows the confirmed terms.

## Files / areas

- New:
  - `scenes/campaigns/utils/agreement.ts` (+ `agreement.test.ts`)
  - `scenes/campaigns/components/AgreementSheet.tsx` (+ `AgreementSheet.test.tsx`),
    exported from `scenes/campaigns/components/index.ts`
- Changed:
  - `scenes/campaigns/OfferScreen.tsx` (+ `offerScreen.style.ts` if new styles
    are needed) and `OfferScreen.test.tsx`
  - `scenes/campaigns/Applications.tsx` and `Applications.test.tsx`
  - `scenes/campaigns/DeliverablesScreen.tsx` (+ its style file)
- Not touched: `campaignFeedApi.ts` (every endpoint exists), the backend,
  `web`, the `components/elements` kit.

## Data / contracts

**Endpoints**, all existing in `campaignFeedApi`:

- `CF3` `useGetMyEngagementQuery({ engagementId })` → `MyEngagementDetail`.
  This feature uses `campaignId`, `status`, `offers`, `scope`,
  `agreedAmountMinor`, `licensingMarkupMinor`, `acceptedAt` and `currency`.
- `CB2` `useGetFeedCampaignQuery({ id: campaignId })` → `CampaignFeedDetail`.
  This feature uses `title`, `licensingTier`, `contentDeadline` and
  `business.businessName` / `business.avatarUrl` (resolve the avatar with
  `resolveMediaKeyOrUrl`).
  - **CB2 returns `404` for any campaign that isn't live.**
  - Confirm mode **requires** CB2: the tier decides the creator's pay. If it
    fails, show "Couldn't load the campaign terms." with Retry and no Accept.
    Never guess the amount.
  - Confirmed mode doesn't need CB2: the money comes from the server's agreed
    numbers. If CB2 fails, use the route `title`, omit the business row, and
    show "No deadline set".
- `CF4` `useAcceptOfferMutation({ engagementId, offerId })`. This is the only
  write. The client never sends an amount.
  - `409`: show the server message, refetch, keep the sheet open.
  - Anything else: the existing `GENERIC_ERROR`.

**`agreement.ts`** (integer minor units throughout):

```ts
/** Same as the backend accept trigger: integer division; tier 2 = 25%, 3 = 50%, else 0. */
export function licensingMarkupMinor(amountMinor: number, tier: 1 | 2 | 3): number;

export type AgreementMode = 'confirm' | 'confirmed';

export interface CreatorAgreement {
  mode: AgreementMode;
  offerId: string | null;          // confirm: the business's pending offer; confirmed: null
  businessName: string | null;     // null when CB2 is unavailable
  businessAvatarUrl: string | null;
  campaignTitle: string;           // CB2 title ?? route title ?? 'Campaign'
  scope: ScopeItem[];
  contentDeadline: string;         // formatted, or 'No deadline set'
  youReceiveMinor: number;         // agreed + markup (F-2/F-6)
  licensingMinor: number;          // the markup part, 0 on tier 1
  licensingPercent: 0 | 25 | 50;
  currency: string;
  acceptedAt: string | null;
  isCompleted: boolean;
}

export function buildCreatorAgreement(
  detail: MyEngagementDetail,
  campaign: Pick<CampaignFeedDetail, 'title' | 'licensingTier' | 'contentDeadline' | 'business'> | null,
  mode: AgreementMode,
  fallbackTitle?: string
): CreatorAgreement | null;
```

- **Confirm mode:**
  - The offer is `offers.find(o => o.status === 'pending' && o.senderType === 'business')`.
  - Returns `null` when that offer or `campaign` is missing.
  - `youReceiveMinor` = offer amount + `licensingMarkupMinor(amount, campaign.licensingTier)`.
- **Confirmed mode:**
  - Requires `status` `accepted` or `completed` and a non-null
    `agreedAmountMinor`.
  - `licensingMinor = licensingMarkupMinor ?? 0`.
  - `licensingPercent` comes from the tier when `campaign` is known.
    Otherwise derive it from the ratio, which is exact because the markup was
    computed from the agreed amount; use 0 when the markup is 0.
- Format dates with the existing `formatOfferDate` and money with
  `formatCampaignPrice`.

**`AgreementSheet` copy** (top to bottom):

| Row | Content |
|---|---|
| Header | Confirm: "Review the agreement". Confirmed: "Agreement confirmed · {acceptedAt}", plus a "Completed" badge when completed. |
| Business | avatar and name (omitted when unknown) |
| Campaign | title |
| Deliverables | `scopeItemLabel` per row, or "No deliverables set" |
| Content deadline | the date |
| **You'll receive** | ৳X, the largest text on the sheet |
| Licensing line (tier 2/3 only) | "Includes ৳{licensing} for paid-ad usage rights (+{25\|50}%)" |
| Confirm only | "Accepting locks this price and these deliverables. It can't be undone." |

**Buttons**

- Confirm: **Accept & confirm** (primary, loading while accepting, disabled
  when stale) and **Back to offer**.
- Confirmed: **Close**.
- Closing or dragging the sheet down never accepts.

**Forbidden copy (both modes):** platform fee, VAT, processing, total, "paid",
"secured", "held", "escrow".

## Testing

- **Logic:** `agreement.test.ts`, every case in step 1.
- **Component:** `AgreementSheet.test.tsx`, every case in step 2, including
  the forbidden-copy assertion.
- **Screens** (this repo already tests these):
  - `OfferScreen.test.tsx`: accept through the sheet, `409` keeps the sheet
    open, the accepted summary shows "You'll receive" including the markup and
    no escrow line, and `review=1` auto-opens.
  - `Applications.test.tsx`: quick Accept navigates and sends no `CF4`.
- **Gate:** `npm run lint`, `npm run test`. No `Verify` command is declared.
  The Expo Go checks in steps 3-4 are manual; report them as not run if no
  device or backend is available.

## Notes for the AI

- The creator's pay is the **whole deal**: agreed price plus licensing markup
  (F-2 LOCKED, F-6 LOCKED in `PAYMENT_ESCROW_BUSINESS_RULES.md`; the backend's
  `creatorReceivesMinor` is the deal line). The current `AcceptedSummary`
  comment saying the markup is "the business's cost" is wrong; this feature
  fixes it.
- Mirror the backend markup exactly (integer division in the
  `campaign_application_offer_apply_accepted` trigger). After acceptance, use
  the server's numbers, never a recomputed markup.
- Accepting from a list must never be one tap. Routing the Request-tab Accept
  through the Offer screen (`review=1`) keeps a single accept code path, with
  the sheet's stale handling and errors.
- Open the auto-review sheet only once per screen mount (a ref), so a refetch
  or a Back press doesn't reopen it.
- Keep the escrow plan's ground rules: no fee/VAT/processing on creator
  screens, never "paid" before the API says so, money stays integer minor
  units until render, and ৳ (never `$`).
- Accessibility: give the amount row an `accessibilityLabel` such as
  "You'll receive 12,500 taka". Give the sheet's header an
  `accessibilityRole="header"`, and set `accessibilityState={{ disabled }}` on
  the stale Accept.
- Render all user text (business name, campaign title, scope labels) as plain
  `Text` children.
