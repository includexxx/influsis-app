# Influsis - Project Overview

<!-- blueprint:source-hash c694aa49a4b56c7096ee36aedac3228024e8a4f09b41e372eb92d8cb12cfbd62 -->

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

Both roles share one app shell (`(main)` tabs); screens differ by role. No
anonymous tier - the onboarding/auth flow gates entry, though route guarding
isn't enforced yet (see Open questions).

## Features

UI-complete against mock data, in build order (`data/*.ts` fixtures stand in
for the not-yet-built backend):

1. **Onboarding + auth** - intro carousel, sign-in/sign-up, OTP verification,
   forgot/reset password.
2. **Profile verification wizard** - post-signup steps: date of birth,
   categories, social media, languages, bio, username.
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

Not yet built (next up, in order; numbers match `build-plan.md`):

- (19) **Real authentication + route guarding**
- (20) **Backend API service layer** (replaces the hardcoded fake user service)
- (21) **Wire product screens to real data** (replaces `data/*.ts` mocks)
- (22) **App identity rebrand** (bundle identifiers, `API_URL`)
- (23) **Push notifications + deep linking**
- (24) **Analytics + crash reporting**

## Data model

No backend exists yet - today's screens run on typed mock fixtures
(`data/*.ts` + `types/*.ts`) with UI-specific fields (pre-formatted price/date
strings, local image assets). The models below are the logical shape those
screens imply for the real API (feature 20); field names follow the existing
mock types where they'll carry over directly.

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
- has many `Review` (id, rating, comment, author, timeAgo)
- has many `Gig` (via `activeGigIds`)

### Campaign

- `id`, `businessId` (-> Business), `title`, `price`/`budget`, `dueDate`,
  `applicationDeadline`, `status`, `tags[]`, `requirements[]`,
  `deliverables[]` (title, description), `followerWanted`

### Gig

- `id`, `creatorId` (-> Creator), `platforms`, `price`, `description`,
  `services[]` (title, description), `status` ('draft' | 'pending' | 'live')
- created via the Create Gig wizard (feature 13); draft/pending statuses come
  from `slices/createGig.slice.ts`

### Application

- `id`, `campaignId` (-> Campaign), `creatorId` (-> Creator), `appliedDate`
- **CampaignRequest** variant: a business-initiated invite (`businessId`,
  `time`), accept/decline only

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
- **Redux Toolkit + react-redux** - global state (`slices/`)
- **AsyncStorage** (via `useDataPersist`) - local persistence
- **StyleSheet + `theme/` tokens** - styling, light/dark mode
- **Jest (`jest-expo`) + React Native Testing Library** - unit/component
  tests, already wired into CI
- **EAS Build / EAS Update / EAS Hosting** - native builds, OTA, web hosting
- **dotenvx** - per-environment config (`.env.dev`, `.env.prod.example`)

> TODO: backend/auth provider not yet chosen (feature 19/20 blocker).

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
- `(auth)/profile-verification/*` - post-signup wizard
- `(main)/home`, `(main)/order`, `(main)/create-gig`, `(main)/message`,
  `(main)/profile` - the Tabs shell
- `(details)/*` - campaign, gig, creator, business, chat, order, withdraw
  detail/sub-flows

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

- Backend/auth provider choice (custom API, BaaS, etc.) - blocks features
  19-21.
- Exact commission structure (rate, who it's deducted from).
- Production/staging API endpoints and hosting target.
