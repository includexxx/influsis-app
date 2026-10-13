# Influsis - Project Overview

<!-- blueprint:source-hash ddc01c87b1ecd3212c9878f2465ac9748bfcd84db5c4d7f3fd133db6b5d9a43b -->

> A cross-platform marketplace connecting creators and businesses for paid
> promotional work - campaigns and gigs, applications, delivery, messaging, and
> payouts.

## Problem

Businesses need a repeatable way to hire creators for sponsored content, and
today that means ad-hoc DMs, spreadsheets, and manual invoicing. Influsis
replaces that with one marketplace app that handles discovery, applications,
delivery tracking, messaging, and payouts end to end.

## Users

- **Creators** - discover campaigns/gigs, apply, deliver work, message
  businesses, track earnings, and withdraw payouts (bank or bKash).
- **Businesses** - post campaigns and gigs, review creator applications, and
  manage active collaborations.

Both roles share one app shell (`(main)` tabs); screens differ by role. This
repo is the **creator-facing** app - `roleKey: 'creator'` is hard-coded on
register, so businesses cannot sign up here. No anonymous tier: entry is gated
by `utils/authGate.ts` plus the `(auth)`/`(main)`/`(details)` layout guards
(feature 19c).

## Features

UI-complete against mock data, in build order (`data/*.ts` fixtures stand in
for the not-yet-built backend):

1. **Onboarding + auth** - intro carousel, sign-in/sign-up, OTP verification,
   forgot/reset password.
2. **Profile verification wizard** - post-signup steps: date of birth,
   categories, social media, languages, bio, username. **Superseded by item
   20**, which retires these seven routes.
3. **Main app shell** - post-login Tabs: Home, Order, Create Gig, Message,
   Profile.
4. **Home feed** - campaign/gig/creator/business discovery feed. **Headline
   feature** - the primary discovery surface everything else hangs off.
5. **Notifications** - notifications list.
6. **Search** - campaign search.
7. **Live campaigns** - a creator's ongoing campaigns.
8. **Campaigns list + details** - all of a creator's campaigns and a single
   campaign's full detail view.
9. **Apply to campaign** - application form plus a creator's own
   applications/invitations list.
10. **Businesses directory + details** - business logo directory and a single
    business's full profile.
11. **Top gigs + top creators** - ranked directories.
12. **Gig details + creator profile** - single gig detail view and a single
    creator's full profile.
13. **Create gig wizard** - 3-step gig publishing flow: basics, pricing,
    preview.
14. **Order lifecycle** - order list (4 status tabs), order details, delivery
    submission, delivered confirmation.
15. **Messaging** - conversation list and single-chat detail.
16. **Profile / account settings** - settings menu, edit profile, security
    settings, change password, privacy policy, help center.
17. **Balance + transactions** - earnings summary and full transfer history.
18. **Withdrawals** - bank transfer branch and mobile banking/bKash branch,
    sharing amount -> review -> success steps.

**Item 19 (real creator authentication) is complete.** 19a-19g wire the
`/auth/*` endpoints against the NestJS API at `../backend` - login,
registration OTP, password reset, TOTP second factor, token refresh, and route
guarding - on axios (with a refresh interceptor), RTK Query, and
react-hook-form + zod.

**Items 20-22 (creator onboarding wizard, bio step, onboarding UI polish) are
complete.** A ten-step private post-registration wizard replaces the item-2
profile-verification flow.

**Shipped outside the numbered plan (`feat/live-campaigns`):** the campaign
feed (`CB1`/`CB4`), campaign details, Apply (`CF1`), and the Applications
screen's Applied/Request tabs (`CF2`) with quick Accept/Decline of invitations
(`CF4`/`CF5`) - `scenes/campaigns/api/campaignFeedApi.ts`.

**Item 23 (negotiate from an Offer screen) is complete.** Tapping an Applied or
Request row opens `(details)/engagement/[id]`: campaign summary, the offer
thread (`CF3`), "Rounds left", and Accept (`CF4`) / Counter (`CG2`) / Decline
(`CF5`) / Withdraw my offer (`CG3`) / Withdraw application (`CF6`), gated by
engagement status, the pending offer's sender (backend turn rule) and
`roundsRemaining`. The Request tab also lists `countered` invitations. Escrow
funding (backend 19) and messaging-hosted offers (22) are out of scope.

**Items 24-25 (the creator side of deliverables, backend 18l, 18m) are
complete.** 24: the Offer screen shows the engagement's own `scope`, tags
`scopeChanged` rounds, and Counter can change the deliverables; Apply can
propose a different list (`CF1` `scope`). 25: an accepted engagement's pieces
(`CI1`), submitting an image or link (`CI2`), resubmitting after a change
request, and recording the live post URL (`CI4`); a completed engagement
never says "paid".

**Item 34 (review the agreement before accepting) is complete.** Accept opens
an agreement sheet ("You'll receive ৳X" = pending offer + the tier's licensing
markup, or `agreedAmountMinor` + `licensingMarkupMinor` once accepted);
confirming sends `CF4`. The creator never sees the platform fee, VAT,
processing fee or the business's total (F-2, F-6). Items 26-33 are the
backend-19 escrow items on `feat/escrow`, not in this checklist.

**Campaign objective & bundle delivery (backend 18q/18r).** Product decision
2026-10-10: each campaign has one objective, **UGC Content** or **Brand
Awareness**, which decides the deliverables it can hold; businesses can add
custom deliverables described in rich text. Delivery becomes one bundle per
engagement: a draft round (original + up to 2 revisions; a 3rd change request
escalates to a dispute), then a final round (approve-only since the backend
fix of 2026-10-11: approved by the business, or automatically 72 hours after
submission).
Contracts: `../backend/docs/features/campaign/implementations/CA_OBJECTIVE_AND_CATALOGUE.md`,
`CI_DELIVERY_ROUNDS.md` and `../platform-context/api-contracts/campaigns.md`. Business side: `web`
items 44-46.

35. **Campaign objective and custom deliverables (backend 18q, complete)** -
    cards and details show the objective and custom deliverables (plain
    `title`, `description` through a sanitizing HTML renderer). Apply and
    Counter offer only the objective's options; custom items can be
    re-counted or removed. Pre-18q campaigns keep the catalogue minus retired
    `ugc` options; `422` `scope[i]` errors show per row.
36. **Deliver all content together, then the final delivery (backend 18r,
    complete)** - replaces item 25's per-piece submit and "record posted"
    flow (the backend `404`s `CI2`/`CI3`/`CI4`).
    - **36a. Submit the draft as one delivery** - the Deliverables screen
      reads `GET /engagements/:id/delivery`. "Submit delivery" has a slot per
      piece (a link, or an image via `POST /media` -> `mediaId`, plus a
      caption), Submit disabled until every slot is filled. After a change
      request it shows the reason and per-piece comments, carries unchanged
      pieces over (`reuseItemId`) and shows revisions left (2 -> 0).
      Escalated = "In dispute", no actions.
    - **36b. Make the final delivery** - a link per piece by `finalKind`:
      a file link (UGC) or the live post URL on the piece's platform (Brand
      Awareness). No uploads; approval completes the engagement
      ("Delivered", never "paid"). Drops `CI4`.

**Reviews, testimonials & campaign portfolio (backend 23).** Product decision
2026-10-12: once an engagement completes (final approved, or auto-approved
after 72 hours), creator and business review each other - 0-5 stars in half
steps plus a required 10-2000 character message. Reviews stay blind until both
submit or 7 days pass, can't be edited, and have no deadline; they then show as
testimonials on the reviewee's profile. Every completed engagement joins the
creator's "Campaign work" portfolio automatically; the creator can hide
entries, and UGC file links are never shown. Contract:
`../backend/docs/features/campaign/implementations/CK_REVIEWS_AND_PORTFOLIO.md`
(design: `REVIEWS_AND_PORTFOLIO.md` §11). Business side: `web` item 47.

37. **Reviews, testimonials and campaign portfolio (`CK1`-`CK8`, next up)**
    - **37a. Rate the business after completion (`CK1`, `CK2`, `CK8`)** -
      `campaignFeedApi` gains `getEngagementReviews`, `submitEngagementReview`,
      `getPendingReviews`. New `StarRatingInput` element (half-star taps,
      `accessibilityRole="adjustable"`, 0.5 steps) and half-star `StarRating`.
      Route `(details)/engagement/[id]/review` -> `ReviewBusinessScreen`
      (rating, message with counter, "can't be edited" note; `422` on fields,
      `409 ALREADY_EXISTS` refetches to the submitted state, `409 CONFLICT`
      refetches `CK1`). `meta.revealed` shows both reviews at once; an
      admin-hidden review shows "Hidden by Influsis", never as deleted. The
      engagement screen gets a `CK1`-driven review card; Home a "Reviews to
      write" banner (hidden when empty); the delivered stage a "Rate
      {business}" button.
    - **37b. My campaign portfolio and reviews (`CK3`, `CK6`, `CK7`,
      `reputation`)** - `MyProfile` stats use `reputation.averageRating` (or
      "New - no ratings yet") and `completedEngagements`, read from E4
      `GET /creator-profiles/:ownUserId`, reviews from `CK3`. Both `404` while
      the creator isn't discoverable: show "Turn on discoverability to show
      your rating and reviews". "Campaign work" lists completed campaigns with
      an optimistic Hide/Show toggle (`CK7 { hidden }`; `409` reverts; hidden
      cards dimmed; UGC entries say files were delivered privately). `CK6`
      ignores discoverability.
    - **37c. Reviews on other creators and businesses (`CK3`-`CK5`, E1/E3
      `reputation`)** - `CreatorProfile` `CredStrip` uses E4 `reputation` and
      `completedEngagements`, lists `CK3` reviews and "Campaign work" (`CK5`);
      `BusinessDetails` shows the rating summary and "Reviews from creators"
      (`CK4`); `CreatorDirectoryCard` and `BusinessCard` show
      `reputation { averageRating, reviewCount }`. A "Former Influsis member"
      reviewer isn't tappable; live-post links open http(s) only.

Other product screens (orders, gigs, messaging, balance) still run on
`data/*.ts` mock fixtures.

## Data model

Auth, onboarding, campaigns, engagements and delivery are wired to the backend;
the other screens still run on typed mock fixtures (`data/*.ts` +
`types/*.ts`) with UI-specific fields (pre-formatted price/date strings, local
image assets). The models below are the logical shape those screens imply for
the real API; field names follow the existing types where they carry over.

### User

- `id`, `name`, `email`
- `role` ('creator' | 'business')
- profile-verification fields (creator): `dateOfBirth`, `categories[]`,
  `socialMedia[]`, `languages[]`, `bio`, `username`

### Business

- `id`, `name`, `logo`, `verified`, `bannerImage`, `website`, `description`
- has many `Campaign`, `Gig`

### Creator

- `id`, `name`, `image`, `verified`, `topRated`, `location`, `tags[]`,
  `followers`, `engagement`, `bio`, `categories[]`, `customerRating`
- has many `Review` (mock today: id, rating, comment, author, timeAgo; real
  shape under EngagementReview, item 37)
- has many `Gig` (via `activeGigIds`)
- `reputation` (E1/E3/E4, item 37): `averageRating` (0-5 | null),
  `reviewCount`, `completedEngagements`; absent on the own-profile read

### Campaign

- `id`, `businessId` (-> Business), `title`, `price`/`budget`, `dueDate`,
  `applicationDeadline`, `status`, `tags[]`, `requirements[]`,
  `followerWanted`
- `objective` ('ugc_content' | 'brand_awareness' | null) - null only for
  campaigns created before backend 18q (item 35)
- `deliverables[]`: `id`, `value` (catalogue key, or `"custom"`), `label`,
  `platform`, `type`, `count`, `title` (string | null), `description`
  (sanitized HTML | null) - `title`/`description` set only on custom items;
  each `(platform, type)` must be offered for the objective (item 35)

### Gig

- `id`, `creatorId` (-> Creator), `platforms`, `price`, `description`,
  `services[]` (title, description), `status` ('draft' | 'pending' | 'live')
- created via the Create Gig wizard (feature 13); draft/pending statuses come
  from `slices/createGig.slice.ts`

### Application

- `id`, `campaignId` (-> Campaign), `creatorId` (-> Creator), `appliedDate`
- **CampaignRequest** variant: a business-initiated invite (`businessId`,
  `time`), accept/decline only
- Real API shape: the backend engagement (`MyEngagementItem` /
  `MyEngagementDetail`, `scenes/campaigns/types/myEngagement.ts`) - `origin`
  invited|requested, `status` pending|countered|accepted|declined|withdrawn|
  expired|completed|cancelled, and an `offers[]` negotiation thread (item 23);
  its own negotiated deliverables list (`scope`, item 24) and the deliverable
  pieces created from it on acceptance, each with its submissions (item 25)
- `scope[]`: `id`, `platform`, `type`, `count`, `title`, `description` - same
  rules as Campaign `deliverables` (1-30 items; item 35)
- Delivery (item 36, `GET /engagements/:id/delivery`): `stage` (computed:
  awaiting_draft | draft_in_review | draft_changes_requested | awaiting_final |
  final_in_review | delivered | escalated | null), `objective`,
  `revisionsRemaining` (2 -> 0, draft only), escalation, `pieces[]` (with
  `finalKind` file_link | live_post) and `rounds[]` (phase, roundNo, status,
  review reason, `reviewDueAt`, `autoApproved`, `items[]` with link or
  `mediaId`, caption, `reviewComment`); replaces item 25's per-piece
  submissions and counters

### EngagementReview (item 37, backend 23)

- One per side per completed engagement (`CK1` list, `CK2` submit):
  reviewer side (creator | business), `rating` (0-5, 0.5 steps), `message`
  (10-2000 chars), `revealAt`, `hidden` (admin-hidden, backend 23d)
- Immutable once submitted; blind until both sides submit or 7 days pass
  (`meta.revealed`)
- Reviewer summary: `displayName`, `handle`/`avatarUrl` (null for "Former
  Influsis member")
- `PendingReview` (`CK8`): `engagementId`, `completedAt`, `theirsSubmitted`,
  `campaign { id, title }`, `counterparty { userId, displayName, avatarUrl }`

### PortfolioEntry ("Campaign work", item 37)

- One per completed engagement, added automatically; `hidden` (bool,
  creator-toggled via `CK7`); own list `CK6`, public list `CK5`
- UGC entries never expose file links; Brand Awareness entries carry live-post
  links (http(s) only)

### Order

- `id`, `tab` ('campaign' | 'gig-order' | 'completed' | 'cancelled'),
  `campaignId` or `gigId`, `businessId`, `creatorId`, `price`, `status`,
  `orderedDate`, `dueDate`, `deliveryDate`
- has many `OrderDeliverable`, `OrderActivityEvent` (timeline), `OrderTrackerStep`

### Conversation / Message

- `Conversation`: `id`, participant ids, `lastMessage`, `time`, `unreadCount`
- `ChatMessage`: `id`, `conversationId`, `sender`, `text`, `time`

### Notification

- `id`, `userId`, `icon`, `title`, `description`, `time`

### Balance / Transaction

- `BalanceSummary`: `userId`, `total`, `monthlyEarning`, `totalEarning`,
  `change`, `changeDirection`
- `WalletTransaction`: `id`, `userId`, `title`, `date`, `amount` (signed)

### WithdrawMethod / Bank

- `WithdrawMethodOption`: `id`, provider (`bank` | `bkash` | other wallet),
  `label`
- `Bank`: `id`, `name`, `logo` (for the bank-transfer branch's directory)
- `SavedPaymentMethod`: `id`, `account` (masked), `provider`

> Lock: `Order.tab` and `Gig.status`/`CreateGigStatus` are separate lifecycle
> enums by design (see `types/order.ts`, `types/createGig.ts`) - don't merge
> them when wiring the real backend.

## Tech stack

- **Expo SDK 54 / React Native 0.81.5 / React 19.1** - cross-platform app
  (iOS, Android, Web), New Architecture enabled
- **TypeScript 5.9 (strict)** - all app code
- **Expo Router v6** - file-based routing; route files re-export scene
  components
- **Redux Toolkit + react-redux** - global state (`slices/`); **RTK Query**
  for server state and cache (auth endpoints, feature 19)
- **axios** - HTTP client under `services/`, with interceptors for the bearer
  token and one-shot 401 refresh (feature 19)
- **react-hook-form + zod** (`@hookform/resolvers`) - form validation and
  error handling on the auth screens (feature 19)
- **AsyncStorage** (via `useDataPersist`) - local persistence
- **StyleSheet + `theme/` tokens** - styling, light/dark mode
- **Jest (`jest-expo`) + React Native Testing Library** - unit/component
  tests, already wired into CI
- **EAS Build / EAS Update / EAS Hosting** - native builds, OTA, web hosting
- **dotenvx** - per-environment config (`.env.dev`, `.env.prod.example`)

Backend: the Influsis NestJS API (`../backend`), consumed read-only via
`../platform-context/api-contracts/`. Auth is a custom JWT scheme (access +
one-shot-rotating refresh), no third-party provider.

> TODO: production/staging API base URLs (`.env.dev` points at a local
> backend).

## Monetization

Commission on payouts: Influsis takes a percentage cut of payments that flow
from businesses to creators through the balance/withdrawal system.

> TODO: exact commission rate and whether it's deducted from the creator
> payout or charged to the business are not yet decided.

## UI/UX

Design system and every screen's look/feel are documented in
`docs/design-system.md` and `docs/screen/*` (already reflects the real Figma
design, not the original boilerplate). Automatic light/dark theme via
`useColorScheme` and `theme/colors.ts`.

Main routes (`app/`, Expo Router groups):

- `(auth)/onboarding`, `(auth)/auth/*` - intro, sign-in/up, OTP, password reset
- `(auth)/creator-onboarding` - ten-step post-registration wizard (item 20;
  replaced `(auth)/profile-verification/*`)
- `(main)/home`, `(main)/order`, `(main)/create-gig`, `(main)/message`,
  `(main)/profile` - the Tabs shell
- `(details)/*` - campaign, gig, creator, business, chat, order, withdraw
  detail/sub-flows
- `(details)/engagement/[id]` - Offer screen: negotiation, agreement,
  deliverables (items 23-25, 34)
- `(details)/engagement/[id]/review` - rate the business (item 37a)

## Deployment

- **App type**: Expo-managed RN app, iOS + Android + Web from one codebase
- **Build**: EAS Build (`npm run dev:build:mobile`) for native, `expo export`
  for web
- **Distribution**: EAS Update (OTA) for JS-only changes, EAS Hosting for web
- **Environments**: dotenvx env files, secrets pushed via
  `npm run dev:secret:push`
- **CI**: GitHub Actions already run `format` -> `lint` -> `test` on PR/push
  (`.github/workflows/test.yml`); no unified `Verify` command yet (`/ci`)

> TODO: production/staging API endpoints not yet defined - `API_URL` still
> defaults to a placeholder.

## Open questions

- Item 35: may a creator write a new custom deliverable on mobile (needs a
  rich-text input), or only keep/adjust the business's?
- Item 36 (decided in backend 18r and its 2026-10-11 fix): the final round
  can't be sent back; video drafts are linked (today's media limit is 5 MB).
  `build-plan.md` item 36 still says "a final can be sent back once".
- Item 37: the section intro says backend 23a-23c are "planned, not built",
  while the item says every endpoint is built (validated 2026-10-12 against
  23a-23d).
- Item 37b: no own-reviews read exists for a non-discoverable creator (backend
  not planned yet).
- `feat/escrow` item 28 (per-piece money and decline reasons) assumes
  per-piece review and must be re-scoped to delivery rounds.
- Exact commission structure. F-2 (creator receives 100% of the deal) implies
  the fee is charged to the business, but `project-plan.md` §6 still lists
  this as undecided.
- Production/staging API endpoints and hosting target.
- Cross-repo `platform-context/open-questions.md` #1 (gig marketplace entity
  model) still blocks wiring the Create Gig wizard to a real endpoint.
