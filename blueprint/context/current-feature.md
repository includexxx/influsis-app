# Current Feature

## 23. Negotiate from an Offer screen

**Type:** Feature
**Status:** verified
**Branch:** feature/23-negotiate-from-an-offer-screen

### Goal

Let a creator negotiate price with a business: open an application or
invitation, see the offer thread and how many rounds are left, and Accept /
Counter / Decline / Withdraw their own offer (or their whole application) —
against the real backend (`../backend` 18d, 18e, 18k).

### In scope

1. **New Offer screen** at `app/(details)/engagement/[id].tsx` (the
   `(details)` group, no tab bar, same as every other details screen),
   exporting `OfferScreen` from `scenes/campaigns`.
   - Opened by tapping a row on **both** Applications tabs (Applied and
     Request) — today both open the campaign details; they now open the Offer
     screen instead, passing `id` (engagement id) and the campaign `title` as
     route params (`CF3` carries no campaign summary).
   - Header: `ScreenHeader` titled "Offer" with back.
   - Campaign block: the campaign title (route param, fallback "Campaign") and
     a "View campaign" action → `/campaign/:campaignId` (from `CF3`).
2. **Content** from `CF3` `GET /me/engagements/:id` (`EngagementDetail`:
   `status`, `origin`, `offers[]`, `negotiationRoundLimit`,
   `negotiationRoundCount`, `agreedAmountMinor`, `licensingMarkupMinor`,
   `nextAction`, `escrowFundingDeadline`, `closeReason`):
   - status badge (`StatusBadge`): Negotiating (`pending`/`countered`),
     Accepted, Completed, Declined, Withdrawn, Expired, Cancelled;
   - thread by `roundNo` ascending: "Round N · You" (creator) or
     "Round N · Business", amount via `formatCampaignPrice(amountMinor, currency)`,
     note, date, offer status; superseded/withdrawn/expired rows de-emphasized;
   - "Rounds left: N" (`max(0, limit - count)`) while negotiable, plus
     "Waiting for the business to respond." when the pending offer is the
     creator's own, or "This is the final offer — accept or decline." when no
     rounds are left and the business's offer is pending;
   - accepted: agreed price (`agreedAmountMinor`) — the creator's pay; the
     licensing markup is the business's cost and is **not** shown here; plus
     "The business has until {escrowFundingDeadline} to fund escrow."
   - closed: `closeReason` when present.
3. **Actions** (derived from data; the server stays the authority):

   | Action | Shown when | Call |
   | --- | --- | --- |
   | Accept | status `pending`/`countered` AND pending offer sent by the business | `CF4` `POST /me/engagements/:id/accept` `{ offerId }` (after a `ConfirmDialog` showing the amount) |
   | Counter | status `pending`/`countered` AND rounds left > 0 AND the pending offer is not the creator's own (none pending is allowed) | `CG2` `POST /engagements/:id/offers` `{ amountMinor, note? }` |
   | Withdraw my offer | status `pending`/`countered` AND pending offer sent by the creator | `CG3` `POST /engagements/:id/offers/:offerId/withdraw` (after a `ConfirmDialog`) |
   | Decline | status `pending`/`countered` AND `origin === 'invited'` | `CF5` `POST /me/engagements/:id/decline` `{ reason }` (reason optional, sent as `''` when blank — matches the Request tab) |
   | Withdraw application | status `pending`/`countered` AND `origin === 'requested'` | `CF6` `POST /me/engagements/:id/withdraw` `{ reason }` (reason optional, `''` when blank) |

   - Counter form: amount in whole BDT (positive, up to 2 decimals, thousands
     separators allowed → minor units), optional note ≤ 2000 chars.
   - Decline / Withdraw application: optional reason ≤ 2000 chars, then a
     confirm step.
4. **States:** skeleton while loading; error with Retry; every action button
   disabled while one is in flight; any `409` (`NEGOTIATION_LIMIT_REACHED`,
   turn-rule `CONFLICT`, `OFFER_NOT_PENDING`, `INVALID_STATE_TRANSITION`)
   shows the server message inline (`accessibilityLiveRegion="polite"`,
   `accessibilityRole="alert"`) and refetches; `422` shows field messages on
   the form; anything else "Couldn't update the offer. Please try again."
   After a successful action the screen stays open and shows the refreshed
   engagement.
5. **Request tab:** lists invitations in `pending` **or** `countered`
   (`PENDING_INVITATION_STATUSES` → `['pending', 'countered']`) so a
   negotiation in progress stays reachable. Quick Accept/Decline stay for
   `pending` rows; `countered` rows hide them (new optional `showActions`
   prop on `CampaignRequestCard`, default `true`) and are handled on the Offer
   screen.
6. **Cache:** a new `MyEngagement` tag per engagement id, provided by `CF3`;
   every negotiation mutation invalidates it plus `MyEngagements` and
   `CampaignFeed` (the feed's "Applied" badge reads engagement status).

### Out of scope

- Escrow funding (backend 19), offer cards in Messaging (backend 22).
- Offer expiry (`expiresAt` is not on the offer summary).
- Changing the existing Request-tab quick Accept flow (`acceptMyEngagement`)
  beyond hiding it on `countered` rows.
- Campaign Details showing negotiation state.

### Build loop

`workflow.stepReview: feature` — build all steps, one review packet at the
end. `workflow.checkpointCommits: disabled` — `/complete` makes the single
feature commit.

### Build steps

- [x] 1. **API + types.**
  - `scenes/campaigns/types/myEngagement.ts`: widen `MyEngagementDetail` with
    `negotiationRoundLimit`, `negotiationRoundCount`, `licensingMarkupMinor`,
    `acceptedAt`, `closedAt`, `closeReason`, `nextAction`,
    `escrowFundingDeadline`; type `EngagementOffer.status` as the six offer
    statuses; add `CounterOfferArgs`, `CloseEngagementArgs`.
  - `scenes/campaigns/api/campaignFeedApi.ts`: `getMyEngagement` (`CF3`,
    provides `MyEngagement`/id), `acceptOffer` (`CF4` with an explicit
    `offerId`), `sendCounterOffer` (`CG2`), `withdrawOffer` (`CG3`),
    `withdrawMyEngagement` (`CF6`); give `declineMyEngagement` the per-id tag
    too. Tags per In scope §6.
  - `PENDING_INVITATION_STATUSES` → `['pending', 'countered']` (update its
    comment and `useCampaignRequests`'s).
  - Extend `scenes/campaigns/api/campaignFeedApi.test.ts` (existing
    `request` mock pattern): each new endpoint hits the right method/URL/body.
  - **Done when:** `npm run lint` and `npm run test` pass.

- [x] 2. **Negotiation logic (pure, tested).**
  - `scenes/campaigns/utils/negotiation.ts`: `getOfferScreenState(detail)`
    (creator viewer) → `{ pendingOffer, pendingIsMine, roundsRemaining,
    isNegotiable, canAccept, canCounter, canWithdrawOffer, canDecline,
    canWithdrawApplication, isFinalOffer }`; `sortOffers`;
    `parseCounterAmount(input)`; `validateOptionalText(text)` (≤ 2000).
  - `negotiation.test.ts`: invitation fresh (business pending → accept,
    counter, decline; no withdraw-application), own application fresh
    (creator pending → withdraw offer + withdraw application only), rounds
    exhausted → final offer, no pending offer after withdraw → counter
    allowed, closed statuses → nothing, amount parsing edge cases.
  - **Done when:** `npm run test` passes with the new cases.

- [x] 3. **Offer screen.**
  - `scenes/campaigns/OfferScreen.tsx` + `offerScreen.style.ts` +
    `app/(details)/engagement/[id].tsx`; export from `scenes/campaigns/index.ts`.
    Reuse `ScreenHeader`, `StatusBadge`, `SummaryRow`, `Button`,
    `TextField`, `ConfirmDialog`, and the theme via `useTheme`. Every
    interactive element has an `accessibilityLabel`/`testID`; money and user
    text rendered as plain `Text`.
  - `scenes/campaigns/OfferScreen.test.tsx` (same `request` mock + store
    pattern as `Applications.test.tsx`): renders the thread and
    Accept/Counter/Decline for a business-pending invitation; hides Counter
    and shows "Waiting for the business" when the creator's offer is pending;
    shows the server message after a `409` counter.
  - **Done when:** `npm run lint` and `npm run test` pass.

- [x] 4. **Wire the Applications screen.**
  - `Applications.tsx`: Applied and Request rows navigate to
    `/engagement/:id` with the `title` param; Request rows pass
    `showActions={item.status === 'pending'}`.
  - `components/elements/CampaignRequestCard`: optional `showActions`
    (default `true`) hides Accept/Decline; add a case to its co-located test.
  - Update `Applications.test.tsx` for the new navigation target.
  - **Done when:** `npm run lint` and `npm run test` pass.

- [x] 5. **Docs.**
  - New `docs/screen/offer/README.md`: purpose, entry points, endpoints,
    actions table, states.
  - `docs/screen/apply-campaign/campaign-list.md`: rows open the Offer screen;
    Request tab includes `countered`.
  - **Done when:** both describe the shipped behaviour.

### Files / areas

| Area | Files |
| --- | --- |
| Types / API | `scenes/campaigns/types/myEngagement.ts`, `scenes/campaigns/api/campaignFeedApi.ts` (+ test) |
| Logic | `scenes/campaigns/utils/negotiation.ts` (+ test) |
| Screen | `scenes/campaigns/OfferScreen.tsx`, `offerScreen.style.ts`, `OfferScreen.test.tsx`, `scenes/campaigns/index.ts`, `app/(details)/engagement/[id].tsx` |
| Wiring | `scenes/campaigns/Applications.tsx` (+ test), `components/elements/CampaignRequestCard/*` |
| Docs | `docs/screen/offer/README.md`, `docs/screen/apply-campaign/campaign-list.md` |

### Data / contracts

- All calls use the existing `axiosBaseQuery` against `/api/v1`, with the
  session's bearer token and refresh interceptor; errors arrive as `ApiError`
  (`code`, `statusCode`, `message`, `errors`). Branch on `statusCode`/`code`,
  display `message`.
- Money: integer minor units on the wire; shown with `formatCampaignPrice`.
- Authorization is server-side (`campaign.apply`, own engagement);
  `senderType` is never sent. A `404` shows the load-error state.
- Mirrored backend rules: one pending offer; a round is one offer including
  the opening one (default cap 3 per engagement); no countering your own
  pending offer; accept only the business's offer by exact `offerId`;
  negotiation only while `pending`/`countered`; `CF6` withdraw only while
  `pending`/`countered`.
- The creator's view shows `agreedAmountMinor` only; `licensingMarkupMinor`
  is the business's cost.

### Testing

- `npm run test`: `negotiation.test.ts`, the new `campaignFeedApi.test.ts`
  cases, `OfferScreen.test.tsx`, `CampaignRequestCard` case, updated
  `Applications.test.tsx`. Existing suites stay green.
- `npm run lint`. There is no `typecheck` script; `npm run lint` runs the
  TypeScript-aware ESLint config and Jest compiles the touched files.
- Manual (Expo dev server + backend; not claimed here): invitation → Request
  row → Offer screen shows the business's round 1 with Accept/Counter/Decline;
  counter → "Waiting for the business", Request row shows no quick buttons;
  business counters (web) → final offer when rounds hit 0; accept → Accepted
  with the escrow deadline; own application → Withdraw application.

### Verification record

- `npm run test`: 147 suites / 736 tests pass, including the new
  `negotiation.test.ts` (25), 7 new `campaignFeedApi.test.ts` cases,
  `OfferScreen.test.tsx` (5), a `CampaignRequestCard` case and the updated
  `Applications.test.tsx` (new navigation target + countered row).
- `npm run lint`: 0 errors; 2 warnings, both pre-existing and in untouched
  files (`app/_layout.tsx`, `SelectableRow.tsx`).
- `npx tsc --noEmit`: no errors in changed files; the only 2 errors are
  pre-existing (`services/authApi.test.ts`, `slices/auth.slice.test.ts`,
  missing `isOnboardingComplete`).
- `prettier --check` on changed files: clean except
  `docs/screen/apply-campaign/campaign-list.md`, which was already
  unformatted on `HEAD` (left to the commit hook rather than reformatting
  the whole file).
- Not run: the manual Expo flow above (no dev server started).
- Beyond the spec text: added `formatOfferDate` (tested) because the existing
  `formatAppliedDate` prefixes "Applied".

### Notes for the AI

- Keep `acceptMyEngagement` (Request tab quick accept) unchanged; the Offer
  screen uses the new explicit-`offerId` `acceptOffer`.
- `CF3`'s response has `creator: null` and no campaign summary — hence the
  `title` route param.
- Follow `docs/design-system.md` and the existing scene structure
  (`*.style.ts`, `useTheme`, `layoutStyle`).
- Do not start the Expo dev server; live checks are for `/check` or `/try`.
