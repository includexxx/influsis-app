# Current Feature

## 24. Deliverables in the Offer screen and on Apply

**Type:** Feature
**Status:** verified
**Branch:** feature/24-deliverables-in-the-offer-screen-and-on-apply

### Implementation notes (deviations from the spec, all recorded here)

- **The screens own the add picker, not the element.** In this project an
  `OptionSheet` must be a sibling of the screen's `ScrollView` (no portal
  provider; see `CustomSelectField`). So:
  - `DeliverablesEditor` exposes `onAddPress`, and the Offer and Apply
    screens render the `OptionSheet`;
  - `addableScopeOptions` / `addScopeItem` in `utils/scope.ts` build the
    options and append the picked item.
- **The element is generic.** `components/elements/DeliverablesEditor`
  takes labelled `items` plus `onCountChange` / `onRemove` callbacks, so it
  doesn't import from `scenes/`. Each screen maps scope rows to items.
- **Only flat 422 keys reach the screens.** `services/http.ts`'s `ApiError`
  drops non-string error maps, so class-validator's nested `errors.scope`
  tree never arrives. `scopeErrorsFromApi` reads the flat `scope[i]` keys
  only; client validation blocks the shape errors.
- **Apply's 422 handling.** A `422` whose keys are about `scope` goes to the
  editor. Every other error keeps `applyApplicationError`.
- **Test counts:**
  - `utils/scope.test.ts`: 18;
  - `DeliverablesEditor.test.tsx`: 7;
  - `OfferScreen.test.tsx`: +4;
  - `ApplyCampaign.test.tsx`: +4;
  - `campaignFeedApi.test.ts`: +2.

  The full suite is 771/771 (149 suites), and lint has 0 errors.

- `tsc --noEmit` still shows two errors in the auth test fixtures from
  before this feature (`isOnboardingComplete`); none are in this feature's
  files. Typecheck isn't a declared gate.

### Goal

Let the creator negotiate what they deliver, not just the price. Backend 18l
gives every engagement its own deliverables list (`scope`). It is copied from
the campaign unless the side creating the engagement sent one, and it is
changed only by a counter-offer.

On mobile, the creator can:

- see the current deliverables on the Offer screen, and which rounds changed
  them;
- change them in a counter, with or instead of the amount;
- propose a different list when applying to a campaign.

### In scope

- Types: `MyEngagementDetail.scope`, `EngagementOffer.scopeChanged`, and
  `scope?` on `CounterOfferArgs` / `ApplyToCampaignArgs`. `sendCounterOffer`
  and `applyToCampaign` send `scope` only when it is given.
- Pure scope helpers, with Jest tests.
- A new `DeliverablesEditor` element (`components/elements/DeliverablesEditor/`)
  with its own RNTL test.
- Offer screen:
  - a Deliverables section;
  - a "Changed deliverables" tag on rounds;
  - Counter gains a "Change deliverables" toggle and a pre-filled amount.
- Apply screen: the campaign's deliverables, plus "Propose different
  deliverables" (editor), sent as `CF1` `scope` only when changed.
- Inline `422` scope errors. The existing `409` handling is unchanged.

### Out of scope

- Delivering work (item 25), work progress, escrow, messaging.
- Showing scope on the Applications list rows.
- The creator's accept confirmation copy beyond showing the current list.

### Build loop

`workflow.stepReview: "feature"`, `checkpointCommits: "disabled"`: build all
steps in order, verifying each, then hand over **one** review packet. No
checkpoint commits; `/complete` makes the single feature commit.

Branch `feature/24-deliverables-in-the-offer-screen-and-on-apply`, created
from `feat/campaign-negotiation` (which holds item 23). The user's untracked
`docs/implementations/` travels in the working tree: never stage or discard
it.

### Build steps

- [x] **1. Types + pure scope helpers.**
  - In `scenes/campaigns/types/myEngagement.ts`:
    - add `ScopeItem { platform; type; count }` and
      `EngagementScopeItem extends ScopeItem { id }`;
    - `MyEngagementDetail.scope: EngagementScopeItem[]`;
    - `EngagementOffer.scopeChanged: boolean`;
    - `scope?: ScopeItem[]` on `CounterOfferArgs` and `ApplyToCampaignArgs`.
  - New `scenes/campaigns/utils/scope.ts`: - `SCOPE_CATALOG`: the addable pairs, matching the web wizard's catalog.
    Facebook video/post/story; Instagram reels/post/story; TikTok
    video/story; YouTube shorts/video; UGC video/photo. - `scopeItemLabel(item)`: "Instagram Reels". It reuses the
    platform/type labels in `mapCampaignDetails.ts`; move them to a shared
    export if needed, and add `facebook` if it's missing. - `scopeFromList(items)`: strips ids. - `validateScope(rows)`: 1-30 rows, count an integer 1-50, no repeated
    platform + type. Returns `{ ok, scope } | { ok: false, error,
rowErrors }`, with the messages listed under Data / contracts. - `isSameScope(a, b)`: order-insensitive. - `scopeErrorsFromApi(errors)`: flat `scope[i]` keys and the nested
    `errors.scope = { "i": { field: msg } }` tree. - `scopeListErrorFromApi(errors)`.

  **Done when:** `scenes/campaigns/utils/scope.test.ts` covers each
  validation failure, order-insensitive equality, a count change counting as
  a change, both backend error shapes, and labels (a known pair and a
  fallback). `npm run test` passes.

- [x] **2. API wiring.** In `scenes/campaigns/api/campaignFeedApi.ts`:
  - `sendCounterOffer` sends `{ amountMinor, note?, scope? }`;
  - `applyToCampaign` passes `scope` through when present.

  Extend `campaignFeedApi.test.ts` to show the request body includes `scope`
  only when given.
  **Done when:** `npm run test` passes.

- [x] **3. `DeliverablesEditor` element.** New
      `components/elements/DeliverablesEditor/DeliverablesEditor.tsx` (plus
      `.style.ts` if the folder convention uses one, and an `index.ts` export),
      controlled with `rows`, `onChange`, `rowErrors?`, `error?`, `disabled?`,
      `testID?`:
  - each row shows its label, a − count + control (min 1, max 50), and a
    remove icon button. The accessibility labels are "Decrease <label>",
    "Increase <label>" and "Remove <label>";
  - an **Add deliverable** button (`AddItemButton`) opens `OptionSheet`
    inside `BottomSheet`, listing the `SCOPE_CATALOG` items not already
    present. It is disabled at 30 rows;
  - the empty state reads "Add at least one deliverable.";
  - row errors show under their row, and the list error under the list;
  - a pair the catalog doesn't know still renders via its fallback label,
    and stays editable and removable.

  Use theme tokens via `useTheme`, as the other elements do.
  **Done when:** `DeliverablesEditor.test.tsx` shows:
  - +/− change the count and are clamped at 1 and 50;
  - remove drops the row;
  - adding from the sheet appends the row with count 1, and already-listed
    items are not offered;
  - row and list errors render.

  `npm run test` and `npm run lint` pass.

- [x] **4. Offer screen.** In `scenes/campaigns/OfferScreen.tsx` (and
      `offerScreen.style.ts`):
  - a **Deliverables** section lists `detail.scope` ("3 × Instagram
    Reels");
  - `OfferRow` shows a "Changed deliverables" tag when `scopeChanged`;
  - in Counter:
    - opening it pre-fills the amount with the latest offer's amount (in
      BDT);
    - a "Change deliverables" button reveals `DeliverablesEditor`,
      pre-filled from `detail.scope`, and "Keep current deliverables" hides
      it again;
    - submit validates the amount, the note and (when the editor is open)
      the scope, and sends `scope` only when
      `!isSameScope(rows, detail.scope)`;
    - a `422` shows the scope row and list errors from the backend.

  **Done when:** new cases in `OfferScreen.test.tsx` show:
  - the Deliverables section renders;
  - the tag shows only on `scopeChanged` rounds;
  - the counter amount is pre-filled;
  - a deliverables-only change sends `scope` with the same amount;
  - an unchanged editor sends no `scope`;
  - a backend `422` `scope[0]` renders under row 0.

  `npm run test` passes.

- [x] **5. Apply screen.** In `scenes/campaigns/ApplyCampaign.tsx`:
  - a **Deliverables** section shows the campaign's deliverables
    (`campaign.deliverables`);
  - "Propose different deliverables" opens `DeliverablesEditor`, pre-filled
    from them, and "Use the campaign's deliverables" closes it;
  - on submit, the scope is validated when the editor is open, and `scope`
    is included in `CF1` only when it differs from the campaign's;
  - a `422` shows the scope errors inline, keeping the pitch/amount handling
    as today.

  **Done when:** new cases in `ApplyCampaign.test.tsx` show:
  - the section renders;
  - an unchanged apply sends no `scope`;
  - a changed list sends it;
  - an invalid list (empty) blocks submit with the message.

  `npm run test` passes.

- [x] **6. Docs + verify.**
  - Update `docs/screen/offer/README.md` and
    `docs/screen/apply-campaign/README.md` with the deliverables behaviour.
  - Add a line to `../platform-context/integration/backend-mobile.md`: `CF1`
    `scope`, `CG2` `scope`, and `CF3` `scope`/`scopeChanged` are consumed.
    That repo is separate; leave it uncommitted.
  - `npm run lint` and `npm run test` pass.

  **Done when:** both commands pass, with output recorded in the review
  packet.

### Files / areas

- `scenes/campaigns/types/myEngagement.ts`, `api/campaignFeedApi.ts`
  (+ test), `utils/scope.ts` (+ test), `utils/mapCampaignDetails.ts`
  (label export only)
- `components/elements/DeliverablesEditor/*` (new)
- `scenes/campaigns/OfferScreen.tsx`, `offerScreen.style.ts`,
  `OfferScreen.test.tsx`
- `scenes/campaigns/ApplyCampaign.tsx`, `applyCampaign.style.ts`,
  `ApplyCampaign.test.tsx`
- `docs/screen/offer/README.md`, `docs/screen/apply-campaign/README.md`
- `../platform-context/integration/backend-mobile.md`

### Data / contracts

Backend 18l (`platform-context/api-contracts/campaigns.md`,
`EngagementScopeItemDto`):

- **`POST /feed/campaigns/:id/apply` (`CF1`).** The body adds
  `scope?: [{ platform, type, count }]`. Omit it to accept the campaign's
  list.
- **`POST /engagements/:id/offers` (`CG2`).** The body adds `scope?`, which
  replaces the whole list; omit it to keep the list. `amountMinor` stays
  required, so a deliverables-only counter re-sends the current amount. The
  counter is still a round: the cap and the turn rule apply.
- **`GET /me/engagements/:id` (`CF3`).** It returns `scope:
EngagementScopeItemDto[]` and `offers[i].scopeChanged`.
- **Rules:**
  - 1-30 items;
  - `platform` ∈ `facebook|instagram|tiktok|youtube|ugc`;
  - `type` ∈ `video|shorts|reels|story|post|photo`;
  - `count` is an integer 1-50;
  - one row per platform + type.
- **`422 VALIDATION_FAILED`.** `errors["scope[i]"]` holds the duplicate
  message, or `errors.scope` holds a nested tree of shape/bounds messages.

Client messages:

| Case               | Message                                    |
| ------------------ | ------------------------------------------ |
| No rows            | "Add at least one deliverable."            |
| More than 30 rows  | "Keep it to 30 deliverables or fewer."     |
| Count out of range | "Choose between 1 and 50."                 |
| Repeated pair      | "This deliverable is already in the list." |

### Testing

- **Unit (Jest):** `utils/scope.test.ts`, and the `campaignFeedApi.test.ts`
  additions.
- **Component/screen (RNTL):** `DeliverablesEditor.test.tsx`, plus the new
  `OfferScreen.test.tsx` and `ApplyCampaign.test.tsx` cases.
- **Gates:** `npm run lint`, `npm run test`. There is no Verify or
  browser-test command. Do not start the Expo dev server.
- **Manual path**, for `/try` or the user; it needs the backend on
  `feat/campaign-negotiation` with 18l migrated:
  1. Apply to a live campaign with a changed deliverables list. The business
     sees that list.
  2. Open an invitation's Offer screen, counter with only a deliverables
     change, and see a new round tagged "Changed deliverables".

### Notes for the AI

- Mirror web's `features/campaigns/utils/scope.ts` behaviour (same rules and
  messages), but keep mobile's own style.
- Money stays whole-BDT input. Reuse `parseCounterAmount` for the amount.
- Keep `OfferScreen`'s existing button gating (`getOfferScreenState`) and
  `409` handling unchanged.
- Format only the files you touch (see the memory note about folder-wide
  formatters flipping line endings).
