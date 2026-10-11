# Current Feature

**Branch:** `feature/make-the-final-delivery`

**Status:** verified

Build-plan item **36b. Make the final delivery (backend 18r2)**, the second
half of item 36. 36a shipped the draft round in `a4030a5`.

## Goal

Once the business approves the draft, the creator sends the **final
delivery**: one link per piece, never an upload.

- **UGC Content** pieces take a link to the final files.
- **Brand Awareness** pieces are posted on the piece's platform first; the
  creator then sends the live post URL, which must be on that platform.

The business can send the final back once. A 2nd final change request
escalates the engagement. Approving the final completes the engagement, and
the app shows "Delivered", never "paid".

This replaces 36a's read-only "Final delivery is coming soon." stages. It
also brings back recording a live post, which `CI4` used to do per piece.

## In scope

- **Deliverables status card**, final stages (replacing 36a's read-only
  banner):
  - `awaiting_final`:
    - title "Draft approved"
    - body "Now send the final delivery for every piece."
    - primary **Send final delivery**
  - `final_in_review`:
    - title "Final delivery submitted"
    - body "Waiting for the business's review."
    - "Submitted {date}"
    - no action
  - `final_changes_requested`:
    - title "The business asked for changes to the final delivery"
    - the final round's `reviewReason`
    - `formatRevisionsLeft(finalRevisionsRemaining)` (1 → 0)
    - primary **Resend final delivery**
  - Hero chips: "Final due", "In review", "Changes requested".
  - "Submitted {date}" now shows for both `draft_in_review` and
    `final_in_review`.
  - `delivered` and `escalated` keep 36a's copy. The escalated copy already
    covers "…to the final delivery twice."
- **Submit delivery screen in final mode** (`awaiting_final`,
  `final_changes_requested`):
  - **Sources:** **Link**, plus **Keep previous** only when the piece's item
    in the latest round is a link. There is no **Image** option. A previous
    upload can't be kept, so that piece starts on **Link**.
    - In `awaiting_final`, "latest round" means the approved draft round.
      Its links can carry over, for example a UGC file link reused
      unchanged.
    - In `final_changes_requested`, it is the final round.
  - **Pre-selection:** Keep previous is pre-selected only when the kept link
    would pass the client check for the piece's `finalKind`. Otherwise the
    slot starts on Link.
  - **Per-slot field label and hint by `finalKind`:**
    - `file_link`: label "Link to your files", hint "Share the final files,
      e.g. a Google Drive or Dropbox link."
    - `live_post` on a social platform: label "Live post URL", hint "Post it
      on {Platform}, then paste the live post link."
    - `live_post` on a custom piece: label "Live post URL", hint "Post it,
      then paste the link to the live post."
  - **Client check** for `live_post` pieces on `facebook` / `instagram` /
    `tiktok` / `youtube`: the URL's host must equal an allowed domain or end
    with `.` + that domain. Message: "Paste the {Platform} post link." A
    custom piece accepts any http(s) link. Kept links get the same check.
  - **Intro copy:**
    - "Send the final delivery. The business reviews it as one round."
    - after a change request, the final round's reason and
      `formatRevisionsLeft(finalRevisionsRemaining)`
  - **Submit button:** **Send final delivery** / **Resend final delivery**.
  - **Body:** the same `POST .../delivery/rounds`. Items carry only
    `externalUrl` or `reuseItemId`; the server picks the final phase from
    the stage.
  - Server `422`s (`items[i].externalUrl` "must be an Instagram post link",
    `items[i].mediaId`, `items[i].reuseItemId`) land on the slot through
    36a's mapping.
- **Piece screen:** a submission with `livePostUrl` gets a "Live post" tag,
  so a Brand Awareness final reads as the published post. The read-only
  history is otherwise unchanged.
- **Docs:** update `docs/screen/deliverables/README.md` (final stages, final
  slots, live-post tag) and remove the "coming soon" interim copy.

## Out of scope

- The business review (`web`).
- Disputes (backend item 20), escrow and payment copy (backend item 19).
- Fetching or verifying the post itself. The server checks only the URL's
  host, and the client mirrors that.
- Showing earlier rounds as a history list on the Deliverables screen.
- `CI5`, notifications.

## Build loop

`workflow.stepReview: "feature"`, `checkpointCommits: "disabled"`:

- Build all steps in order, each leaving the app working with its tests
  green.
- Then present one review packet for the whole feature.
- No checkpoint commits. `/complete` makes the single feature commit.
- Branch from the current `feat/campaign-negotiation` tip (`a4030a5`).
- Run Prettier only on the files you change. Never run the repo-wide
  `npm run format`.

## Build steps

- [x] **1. Final-round logic** (`scenes/campaigns/utils/delivery.ts`)
  - **Domain table:** add `LIVE_POST_DOMAINS`, mirroring backend
    `delivery-round-rules.ts`:
    - `facebook`: `facebook.com`, `fb.com`, `fb.watch`
    - `instagram`: `instagram.com`
    - `tiktok`: `tiktok.com`
    - `youtube`: `youtube.com`, `youtu.be`
  - **`isLivePostHostFor(platform, url)`:**
    - A platform with no listed domains returns true for any http(s) URL.
    - Otherwise the URL's lowercase hostname must equal a domain or end
      with `.` + domain.
    - A URL that doesn't parse returns false.
  - **`submitPhase(stage)`:** `'draft'` for `awaiting_draft` /
    `draft_changes_requested`, `'final'` for `awaiting_final` /
    `final_changes_requested`, else `null`.
  - **`deliveryStatusView`:**
    - The final stages get the copy and CTAs from In scope.
    - `canSubmit` becomes `submitPhase(stage) !== null`.
    - Add `inReview: boolean` (true for both `*_in_review` stages), so the
      screen shows "Submitted {date}".
  - **`DeliverySlot`** gains `phase`, `platform` and `finalKind`.
  - **`initialSlots`:**
    - In the final phase, Keep previous needs a previous **link** that
      passes `validateSlot`.
    - The default source is `keep` when allowed, else `link`.
    - The draft phase is unchanged.
  - **`validateSlot`, final phase:**
    - `image` → "A final delivery takes a link, not an upload."
    - `keep` with an upload → "That was an uploaded file. Paste a link
      instead."
    - `link` / `keep` with a link: the existing link rules, plus for
      `live_post` the host check ("Paste the {Platform} post link.").
  - **New helpers:**
    - `slotSources(slot)`, the options to offer:
      - draft: keep (when there is a previous item), link, image
      - final: keep (when the previous item is a link), link
    - `slotCopy(slot)`: the field label and hint by phase and `finalKind`.
  - **Tests** (`delivery.test.ts`):
    - each final stage's view
    - `submitPhase`
    - host matching: `www.instagram.com` and `vm.tiktok.com` accepted,
      `evilinstagram.com` and `instagram.com.evil.test` rejected, `fb.watch`
      accepted for facebook, a custom piece accepts any https link,
      `javascript:` rejected
    - final slots: keep allowed for a passing link, refused for an upload
      or a wrong-host link, Image invalid
    - the draft behaviour stays unchanged
  - **Done when:** `npm run test` passes.

- [x] **2. Deliverables screen: final stages**
  - Use `view.inReview` for "Submitted {date}" (from `latestRound`).
  - The CTA now also appears for the final stages and pushes the same
    `/engagement/[id]/submit-delivery`.
  - **Tests** (`DeliverablesScreen.test.tsx`): replace the "coming soon"
    test. Cover:
    - `awaiting_final` shows **Send final delivery** and navigates
    - `final_in_review` shows "Final delivery submitted" with the date and
      no action
    - `final_changes_requested` shows the reason, "1 revision left" or "No
      revisions left", and **Resend final delivery**
    - no "coming soon" text anywhere
  - **Done when:** tests pass.

- [x] **3. Submit delivery: final mode, piece live-post tag, docs**
  - **`SubmitDeliveryScreen.tsx`:**
    - Build the segmented options from `slotSources`, and the field label
      and hint from `slotCopy`.
    - Pick the intro copy, reason and budget by phase.
    - Submit labels per In scope.
    - No other flow changes: upload handling only runs for image slots,
      which the final phase never has.
  - **`DeliverablePieceScreen.tsx`:** add the "Live post" tag when
    `submission.livePostUrl` is set.
  - **Docs:** update `docs/screen/deliverables/README.md`.
  - **Tests** (`SubmitDeliveryScreen.test.tsx`):
    - `awaiting_final` (UGC): no Image option, and the approved draft's link
      is pre-kept. Sends `reuseItemId` for kept slots and `externalUrl` for a
      new link. The button reads "Send final delivery".
    - Brand Awareness: an Instagram piece with a `tiktok.com` link shows
      "Paste the Instagram post link." with Submit disabled; a
      `www.instagram.com` link enables Submit. A custom `live_post` piece
      accepts any https link.
    - A previous draft upload is not keepable in final; the slot starts on
      Link.
    - `final_changes_requested`: shows the final round's reason and per-piece
      comments, "No revisions left" when `finalRevisionsRemaining` is 0, and
      "Resend final delivery".
    - A server `422` `items[0].externalUrl` "must be an Instagram post link"
      lands on slot 0.
  - **Tests** (`DeliverablePieceScreen.test.tsx`): the "Live post" tag shows
    for a submission with `livePostUrl`.
  - **Done when:**
    - `npm run test` and `npm run lint` pass with 0 errors.
    - The changed files pass `npx prettier --check`.
    - `grep` finds no "coming soon" in `scenes/` or the deliverables doc.

## Files / areas

- `scenes/campaigns/utils/delivery.ts` (+ `delivery.test.ts`)
- `scenes/campaigns/DeliverablesScreen.tsx` (+ test)
- `scenes/campaigns/SubmitDeliveryScreen.tsx` (+ test)
- `scenes/campaigns/DeliverablePieceScreen.tsx` (+ test)
- `docs/screen/deliverables/README.md`
- No new routes, endpoints or dependencies: 36a's types, API and route
  cover the final round.

## Data / contracts

Sources: backend
`docs/features/campaign/implementations/CI_DELIVERY_ROUNDS.md` ("Final items:
file links and live posts", "Stages and the revision countdowns") and
`src/campaign-engagement/domain/delivery-round-rules.ts` (`finalKind`,
`LIVE_POST_DOMAINS`, `isLivePostHostFor`, `finalItemErrors`).

### Submitting a final round

- **Endpoint and phase:** `POST /engagements/:id/delivery/rounds`, the same
  body as the draft. The server makes it a **final** round while the stage is
  `awaiting_final` or `final_changes_requested`.
- **Items:** one per non-cancelled piece.
- **Sources:** `externalUrl` (http(s), ≤ 2048) or `reuseItemId`, never
  `mediaId`. The checks run on the content after carry-over, so reusing an
  upload fails.
- **`caption`:** optional, ≤ 2000.

### `finalKind`

The server computes `pieces[].finalKind` from the objective and platform.
The client uses it as given and never recomputes it:

| Objective | Platform | `finalKind` |
| --- | --- | --- |
| `ugc_content` | any | `file_link` |
| `brand_awareness` | social | `live_post` |
| `brand_awareness` | `custom` | `live_post` (any http(s) URL) |
| `brand_awareness` | legacy `ugc` | `file_link` |
| `null` | `ugc` / `custom` | `file_link` |
| `null` | social | `live_post` |

### Live-post hosts

Subdomains are included. A look-alike such as `evilinstagram.com` is
refused:

- `facebook`: `facebook.com`, `fb.com`, `fb.watch`
- `instagram`: `instagram.com`
- `tiktok`: `tiktok.com`
- `youtube`: `youtube.com`, `youtu.be`

### Final `422` keys

- `items[i].mediaId`: "a final delivery takes a link, not an upload"
- `items[i].reuseItemId`: "a final delivery takes a link; this submission is
  an uploaded file"
- `items[i].externalUrl`: "must be an Instagram post link" (the piece's
  platform)

### Final budget and completion

- **Budget:** `finalRevisionsRemaining = max(0, 1 - finalChangeRequests)`,
  counting 1 → 0. The 2nd final change request escalates the engagement.
- **Approval:** approving the final completes the engagement (`accepted →
  completed`) and the stage becomes `delivered`. No money moves (backend item
  19), so the app never says "paid".

### Stored live posts

A Brand Awareness final item stores `livePostUrl` (= `externalUrl`) and
`postedAt`. `CI1` submissions expose both, and the piece screen tags them.

## Testing

- Jest + RNTL via `npm run test`:
  - logic: `delivery.test.ts`
  - scenes: `DeliverablesScreen`, `SubmitDeliveryScreen`,
    `DeliverablePieceScreen`, mocking `request` as 36a's tests do
- `npm run lint`, and `npx prettier --check` on changed files.
- No browser-test command exists. Nothing live is claimed: the rules mirror
  the backend source and doc. A manual check against a local 18r backend is
  optional (`/check`).

## Notes for the AI

- **Server owns `finalKind`:** use the server's `finalKind` as given; don't
  derive it from the objective. The client only owns the domain table, and
  only for messages before sending. The server re-checks everything.
- **Host matching:** match on `URL.hostname`, lowercased, with an exact or
  `.`-suffix test, and keep the backend's domain lists. Never use `includes`:
  it would accept `evilinstagram.com`.
- **Keep the draft flow intact:** 36a's draft tests must keep passing
  unchanged, apart from the deliberate "coming soon" replacement.
- **Text and links:** user text stays escaped. Links open only when they are
  http(s) (`safeHttpUrl`).
- **Copy:** the "Delivered" and approval copy never says "paid" or "payment".
