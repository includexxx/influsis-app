# Influsis - Project Overview

<!-- blueprint:source-hash 2e638d8e7d54b6ffd99f3de603c3d5eacb561b231eaeeea8c4f3befc8cf22dc1 -->

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

**Next up - item 20, creator onboarding wizard.** One private
post-registration route hosting a multi-step form that captures everything the
matching engine, public profile, and verification queue need: basics,
location, categories with subcategories, languages, deliverables, profile and
cover photos, portfolio entries, and a unique handle. It replaces the item-2
profile-verification wizard, which captured no location, subcategories,
deliverables, portfolio, or photos. Split into 20a-20g. Its only server call
today is the public handle-availability check; there is **no submit endpoint
yet**, so Finish assembles the `FormData` payload and `console.log`s it.

Every product screen outside auth still runs on `data/*.ts` mock fixtures
until later items.

## Data model

No backend exists yet - today's screens run on typed mock fixtures
(`data/*.ts` + `types/*.ts`) with UI-specific fields (pre-formatted price/date
strings, local image assets). The models below are the logical shape those
screens imply for the real API; field names follow the existing
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

- Exact commission structure (rate, who it's deducted from).
- Production/staging API endpoints and hosting target.
- Cross-repo `platform-context/open-questions.md` #1 (gig marketplace entity
  model) still blocks wiring the Create Gig wizard to a real endpoint.
