# Current Feature

**Branch:** `feature/campaign-objective-and-custom-deliverables`

**Status:** verified

Build-plan item **35. Campaign objective and custom deliverables (backend 18q
`CB1`-`CB3`, `CF1`, `CG2`, `CI1`)**.

## Goal

A creator sees each campaign's objective (UGC Content / Brand Awareness) and
its custom deliverables (a plain-text title and a rich-text brief). When they
propose or counter a deliverables list, they can pick only the deliverables
the backend accepts for that campaign's objective. Custom items the business
wrote survive every round unchanged, unless the creator re-counts or removes
them.

## In scope

- **Read shapes (18q):**
  - Campaign details (`CB2`) has `objective` and no longer has `objectives`.
  - Campaign `deliverables[]` and engagement `scope[]` items gain `title` and
    `description`.
  - `CI1` pieces gain `title`.
  - Custom items are `platform: 'custom', type: 'custom'`.
- **Fix the 18q crash:** `getAudienceGroups` reads the removed `objectives`.
  The "Objectives" audience group goes away and the single `objective` is
  shown instead.
- **Objective on Campaign Details:** a labelled value, "UGC Content" or
  "Brand Awareness". Nothing is shown when `objective` is `null`.
- **Custom deliverables on Campaign Details:**
  - The tile shows `count × title`, with the title rendered as plain text.
  - Below it, the `description` is rendered through the new sanitizing
    rich-text element.
- **Custom deliverables on the Offer screen:** the Deliverables card shows each
  custom item's title, plus its description through the same element.
- **Deliverables editor (Apply and Offer-screen Counter):**
  - "Add deliverable" offers only the campaign objective's catalogue pairs,
    with that objective's labels.
  - A no-objective (pre-18q) campaign gets every non-retired pair (13) with
    generic labels and no `ugc` pairs.
  - Existing custom rows can be re-counted or removed. Creators cannot author
    a new custom item (see Open questions).
  - A retired pair already in the list stays listed and editable.
- **Wire format:**
  - Custom items are sent back with their `title` and `description` exactly
    as received.
  - Catalogue items are sent with no `title`/`description`.
  - `isSameScope` compares title and description too.
- **Per-row errors:** `422` errors keyed `scope[i]`, `scope[i].title` or
  `scope[i].description` show on row `i`.
- **Piece names:** the Deliverables and Deliverable piece screens name custom
  pieces by `title`.

## Out of scope

- **Objective on campaign cards.** Neither data source returns it:
  `CampaignFeedListItemDto` (`CB1`/`CB4`, used by `CampaignCard`) and the `CF2`
  `campaign` block (used by `JoinedCampaignCard`) have no `objective`, and CB2
  is per campaign. Deferred until the backend adds the field (see Open
  questions). No per-card CB2 fetch.
- Creators writing a new custom deliverable, which would need a rich-text
  input (see Open questions).
- Bundle delivery and final delivery (item 36).
- Custom description on the Deliverable piece screen: `CI1` carries `title`
  only.
- Agreement sheet descriptions: it lists titles only.
- `CB3` (the public brief): this app doesn't call it.
- Web, escrow, notifications.

## Build loop

`workflow.stepReview: "feature"`, `checkpointCommits: "disabled"`:

- Build all steps in order, each leaving the app working with its tests
  green.
- Then present one review packet for the whole feature.
- No checkpoint commits. `/complete` creates the single feature commit.
- Create the branch from the current `feat/campaign-negotiation` tip, which
  holds items 23-25 and 34. Do not branch from `develop`.

## Build steps

- [x] **1. Types, objective catalogue and scope helpers** (pure logic)
  - **Types:**
    - `scenes/campaigns/types/campaignFeed.ts`:
      - Add `CampaignObjective = 'ugc_content' | 'brand_awareness'`.
      - `CampaignFeedDetail.objective: CampaignObjective | null`. Remove
        `objectives`.
      - `CampaignDeliverable` gains `title: string | null` and
        `description: string | null`, and its platform also allows
        `'custom'`.
      - Keep `CampaignFeedPlatform` (the `CB1` filter) without `custom`.
    - `types/myEngagement.ts`: `ScopeItem` gains optional
      `title?: string | null` and `description?: string | null`.
    - `types/deliverables.ts`: `DeliverablePiece` gains `title: string | null`.
  - **Catalogue:** new `scenes/campaigns/utils/objectives.ts` mirrors the
    backend's `campaign_objective_option` (backend
    `src/campaigns/domain/deliverable-options.ts`). Exports:
    - `OBJECTIVE_LABELS` ({ `ugc_content`: 'UGC Content', `brand_awareness`:
      'Brand Awareness' }).
    - `OBJECTIVE_OPTIONS`: per objective, the exact `platform/type` → label
      rows from the 18q doc's table (7 for UGC, 10 for Brand Awareness).
    - `LEGACY_OPTIONS`: the 13 distinct non-retired pairs, with generic
      `scopeItemLabel` labels.
    - `objectiveLabel(objective)`.
    - `isCustomItem(item)` (`platform === 'custom'`).
  - **`scope.ts` changes:**
    - `SCOPE_CATALOG` is replaced by `addableScopeOptions(rows, objective)`
      and `addScopeItem(rows, value, objective)`. Both use the objective's
      options, or `LEGACY_OPTIONS` when `objective` is `null`.
    - `scopeItemLabel(item, objective?)`: a custom item returns its `title`.
      A catalogue item returns the objective's label when given and listed,
      else today's generic label.
    - `scopeFromList` keeps `title`/`description` on custom items only.
    - `validateScope` skips the duplicate check for custom rows.
    - `isSameScope` becomes an order-insensitive multiset comparison over
      `(platform, type, count, title ?? null, description ?? null)`.
    - New `scopeRowKey(item, index)`: `platform:type` for catalogue items,
      `custom:<index>` for custom ones. It replaces `scopePairKey` as the
      React key everywhere scope is rendered.
    - `scopeErrorsFromApi` also maps `scope[i].title` and
      `scope[i].description` to row `i`, keeping the first message per row.
  - **Audience groups:** `mapCampaignDetails.ts` `getAudienceGroups` drops
    `objectives`.
  - **Tests:** update `scope.test.ts` and `mapCampaignDetails.test.ts`, and
    add `objectives.test.ts`. Cover:
    - option sets per objective, plus the legacy set (no `ugc`)
    - two custom rows are not duplicates
    - `isSameScope` detects a title-only or description-only change
    - `scopeFromList` strips `null` custom fields from catalogue items
    - nested `422` keys map to rows
  - Update the test fixtures that still carry `objectives` (`ApplyCampaign`,
    `CampaignDetails`).
  - **Done when:** `npm run test` passes, and `getAudienceGroups` no longer
    reads `objectives`, so a CB2 payload without it renders.

- [x] **2. Sanitizing rich-text element** (`components/elements/RichText/`)
  - **Dependency:** add `htmlparser2` with `npx expo install htmlparser2`.
    - It is pure JS, used only as a parser.
    - If Jest cannot load its build, extend `transformIgnorePatterns` in
      `jest.config.js` for it (and its `domhandler`, `domutils` and
      `entities` deps if needed). Record which was needed.
  - **`RichText({ html, testID })`:** parse `html` into a DOM, then walk it
    and emit only React Native nodes. Never pass HTML to a WebView. The walk
    is the client-side sanitizer the contract requires:
    - **Allowlist:** `p`, `br`, `strong`/`b`, `em`/`i`, `u`, `s`, `ul`, `ol`,
      `li`, `h3`, `h4`, `blockquote`, `a`.
    - **Text styles:** bold, italic, underline and line-through via nested
      `<Text>`.
    - **Blocks:** paragraphs and headings as block `Text`, with h3/h4 at the
      theme heading sizes. Lists use a bullet or number prefix. `blockquote`
      gets a left border.
    - **Links:** `a` becomes a pressable `Text` (`accessibilityRole="link"`)
      only when its `href` parses as `http:` or `https:`. It calls
      `Linking.openURL(href)`. Any other `href`, or none, renders as plain
      text.
    - **Other tags:** `script`/`style` are dropped with their content. Any
      other tag is unwrapped, keeping its text. All attributes except
      `a[href]` are ignored.
    - **Text and entities:** text nodes are rendered as text, never as
      markup. The parser decodes entities.
    - **Empty input:** an empty or whitespace-only result renders nothing.
  - Co-located `RichText.test.tsx`, following the element test convention.
    Cover:
    - formatting tags render their text
    - `<script>alert(1)</script>` renders nothing
    - `<img onerror>` and unknown tags keep only their text
    - `javascript:` and `data:` links are not pressable
    - an `https` link calls `Linking.openURL`
    - `&amp;` / `&lt;` decode
    - nested lists
  - Add an `index.ts` export, matching sibling elements.
  - **Done when:** `npm run test` passes for the element, and `npm run lint`
    is clean.

- [x] **3. Campaign Details: objective and custom deliverables**
  - Show the objective in the details overview as a labelled value
    ("Objective", `objectiveLabel`). Place it with the existing key facts;
    follow `docs/design-system.md`. It is hidden when `null`.
  - **`DeliverableList`** (`components/details/CampaignSections.tsx`):
    - **Custom items:** render `count × title`, using a neutral glyph for the
      icon (`platformIcon('custom')`; confirm it falls back and add a mapping
      if not). The accessibility label is `${count} ${title}`. Below the
      tile, render `<RichText html={description} />`. Custom items keep the
      backend's order, which is last.
    - **Catalogue items:** unchanged.
  - The section count still sums every `count`.
  - Update `formatDeliverable` the same way, so custom items use `title`.
  - **Tests:** `CampaignDetails.test.tsx` covers:
    - Brand Awareness objective shown, `null` objective hidden
    - a custom tile shows its title and formatted description text
    - a custom title containing `<b>` shows the literal characters
  - **Done when:** tests pass, and a CB2 fixture with `objective` and a custom
    deliverable renders both.

- [x] **4. Apply: objective-aware deliverables editor**
  - `ApplyCampaign.tsx` passes `campaign.objective` to `addableScopeOptions`,
    `addScopeItem` and `scopeItemLabel`, and uses `scopeRowKey` for editor
    keys and recap chips.
  - `campaignScope = scopeFromList(campaign.deliverables)`, which now keeps
    the custom fields.
  - The submitted `scope` comes from `validateScope` output. Custom items
    carry their original `title`/`description`; catalogue items carry
    neither.
  - Nested `422` keys show on the row through `scopeErrorsFromApi`.
  - **Tests:** `ApplyCampaign.test.tsx` covers:
    - a UGC campaign's picker lists only UGC labels, e.g. "Image for
      Instagram", and no "Story on Facebook"
    - a `null`-objective campaign's picker has no UGC pair
    - removing a custom row and submitting sends `scope` without it
    - re-counting a custom row sends its `title`/`description` unchanged
    - an untouched list sends no `scope`
    - `scope[1].description` shows under row 1
  - **Done when:** tests pass.

- [x] **5. Offer screen: counter editor, deliverables card and agreement keys**
  - `OfferScreen.tsx` fetches `CB2` while the agreement sheet is open or the
    counter editor is open (`scopeRows !== null`), using the same
    `useGetFeedCampaignQuery`. The engagement detail (`CF3`) carries no
    objective.
  - **While CB2 is loading:** "Add deliverable" is disabled. Existing rows can
    still be re-counted or removed.
  - **If CB2 fails** (for example `404`, because the campaign is no longer
    live):
    - "Add deliverable" stays disabled.
    - A helper line under the editor reads "Couldn't load this campaign's
      deliverable options."
    - Count and remove still work, and the server validates on send.
    - Do not fall back to the legacy list, which could offer pairs the server
      rejects.
  - Editor rows and picker use the objective's labels. Custom rows show their
    title.
  - `isSameScope(checked, currentScope)` decides whether `scope` rides on
    `CG2`.
  - The Deliverables card renders each custom item's title chip, followed by
    its `<RichText>` description.
  - **Keys:** the card and `components/AgreementSheet.tsx` switch from
    `scopePairKey` to `scopeRowKey`. The agreement sheet's labels go through
    `scopeItemLabel`, so custom items show their title.
  - **Tests:** `OfferScreen.test.tsx` covers:
    - a Brand Awareness campaign's picker offers "Post on TikTok" and no
      "Image for Facebook"
    - Add is disabled while CB2 loads and when it errors (helper text shown)
    - a counter that only re-counts a custom item sends `scope` with its
      fields
    - "Keep current deliverables" sends no `scope`
    - two custom items render without key warnings
  - Extend `AgreementSheet.test.tsx` for a custom title.
  - **Done when:** tests pass.

- [x] **6. Deliverables screens: custom piece names**
  - `utils/deliverables.ts` piece label (line ~103) uses `piece.title` for
    custom pieces (`"<title> · <pieceNo>"`), else today's label.
  - `DeliverablesScreen.tsx` and `DeliverablePieceScreen.tsx` show it, using
    the neutral icon for `custom`.
  - **Tests:** extend `deliverables.test.ts`, `DeliverablesScreen.test.tsx`
    and `DeliverablePieceScreen.test.tsx` with a custom piece.
  - **Done when:** `npm run test` and `npm run lint` pass, and
    `npm run format` leaves no diff.

## Files / areas

- `scenes/campaigns/types/campaignFeed.ts`, `types/myEngagement.ts`,
  `types/deliverables.ts`
- `scenes/campaigns/utils/objectives.ts` (new), `scope.ts`,
  `mapCampaignDetails.ts`, `deliverables.ts`, `platformIcon.ts`, plus their
  tests
- `components/elements/RichText/` (new: `RichText.tsx`, `RichText.test.tsx`,
  `index.ts`)
- `scenes/campaigns/CampaignDetails.tsx`,
  `components/details/CampaignSections.tsx`
- `scenes/campaigns/ApplyCampaign.tsx`, `OfferScreen.tsx`,
  `components/AgreementSheet.tsx`
- `scenes/campaigns/DeliverablesScreen.tsx`, `DeliverablePieceScreen.tsx`
- `package.json` / lockfile (`htmlparser2`), and possibly `jest.config.js`
- `components/elements/DeliverablesEditor` stays unchanged: it already takes
  caller-supplied `key`/`label` rows

## Data / contracts

Sources: `../platform-context/api-contracts/campaigns.md` (`CampaignDto`
L135/L140, `EngagementScopeItemDto` ~L831, piece DTO ~L1418) and
`../backend/docs/features/campaign/implementations/CA_OBJECTIVE_AND_CATALOGUE.md`.

### Reads

- **CB2:**
  - `objective: 'ugc_content' | 'brand_awareness' | null`. `objectives` is
    gone.
  - `deliverables[]`: `{ id, value, label, platform, type, count, title:
string|null, description: string|null }`. Custom items are listed last.
- **CF3 `scope[]`:** `{ id, platform, type, count, title, description }`, in
  the order last written.
- **CI1 pieces:** `title: string|null`. For a custom piece `deliverableId` is
  `null`.
- **Custom item:** `platform: 'custom'`, `type: 'custom'`, `title` 1-200
  plain characters (always render escaped, as a `Text` child), `description`
  server-sanitized HTML of at most 5000 characters (sanitize again on render;
  step 2).

### Writes (`CF1` / `CG2` `scope[]`)

- 1-30 items, `count` 1-50.
- A catalogue item is `{ platform, type, count }`. Sending `title` or
  `description` on it is a `422`.
- A custom item is `{ platform: 'custom', type: 'custom', count, title,
description }`, with `title` and `description` echoed byte-for-byte from
  the read.
- Each catalogue pair must be offered for the campaign's objective (any
  non-retired pair when the objective is `null`).
- A repeated catalogue pair is a `422`. Custom items may repeat.
- On `CG2`, a retired pair the scope already holds may stay.

**Errors (`422 VALIDATION_FAILED`):** `errors["scope[i]"]`,
`errors["scope[i].title"]` and `errors["scope[i].description"]` go on row
`i`. `errors.scope` is the list-level message. `409` keeps today's refetch
and server message.

**`scopeChanged` equality:** order-insensitive over `(platform, type, count,
title, description)`. The client's `isSameScope` must match, or a no-op edit
spends a round.

**Objective options:** the 18q doc's table is authoritative. Labels are used
exactly as written there, e.g. `instagram/photo` is "Image for Instagram"
under UGC, and `tiktok/post` is "Post on TikTok" under Brand Awareness.

## Testing

- Jest + RNTL via `npm run test`.
  - Logic tests: `objectives`, `scope`, `mapCampaignDetails`, `deliverables`.
  - Element tests: `RichText`.
  - Scene tests: `CampaignDetails`, `ApplyCampaign`, `OfferScreen`,
    `AgreementSheet`, `DeliverablesScreen`, `DeliverablePieceScreen`, with
    RTK Query mocked as the existing scene tests already do.
- `npm run lint` and `npm run format` before review.
- No browser-test command exists. No live backend run is claimed: the
  shapes come from the contract and the backend doc, which are illustrative
  and not live-captured. The 18q backend is on
  `../backend feat/campaign-negotiation`, so a manual check against a local
  instance is optional (`/check`).

## Notes for the AI

- **Never render HTML strings directly.**
  - `title` is always a `Text` child.
  - `description` only goes through `RichText`.
  - No WebView, and no `dangerouslySetInnerHTML` on web.
- **Echo custom fields untouched.** Don't trim, re-serialize or re-sanitize
  `title`/`description` before sending. The server compares them for
  `scopeChanged`.
- **No legacy fallback on CB2 failure.** The Offer screen must not fall back
  to `LEGACY_OPTIONS` when CB2 fails: the campaign may have an objective the
  app couldn't load.
- **Retired pairs.** Retired `ugc/video` and `ugc/photo` rows already in a
  scope must keep their generic label ("UGC Video") and stay editable. They
  never appear in the add picker.
- **OptionSheet placement.** Keep the OptionSheet a sibling of the scene's
  ScrollView (existing pattern; see `CustomSelectField`).
- **Comments.** Follow the comment style of `scope.ts`: cite the backend rule
  each helper mirrors.

## Open questions

1. **Creator-authored custom deliverables.** May a creator write a new custom
   item on mobile? That needs a rich-text input. This spec assumes **no**:
   creators can only re-count or remove the business's custom items. Adding
   authoring later is additive.
2. **Objective on campaign cards.** Item 35 asks for it, but `CB1`/`CB4`
   rows and the `CF2` `campaign` block don't return `objective`. Either ask
   backend to add `objective` to `CampaignFeedListItemDto` and the `CF2`
   campaign block (then a follow-up shows it on `CampaignCard` and
   `JoinedCampaignCard`), or accept showing it on details only.
