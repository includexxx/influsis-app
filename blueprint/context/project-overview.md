# Influsis - Project Overview

<!-- blueprint:source-hash fc80fb73e38860ab166141642e4789755fad48a87d0cdbbbb4e8b5d1af532b80 -->

> A cross-platform marketplace connecting creators and businesses for paid
> promotional work - campaigns and gigs, applications, delivery, messaging, and
> payouts.

## Problem

Businesses hire creators for sponsored content through ad-hoc DMs,
spreadsheets, and manual invoicing. Influsis replaces that with one marketplace
app covering discovery, applications, delivery tracking, messaging, and
payouts.

## Users

- **Creators** - discover campaigns/gigs, apply, deliver, message businesses,
  track earnings, withdraw (bank or bKash).
- **Businesses** - post campaigns and gigs, review applications, manage
  collaborations.

This repo is the **creator-facing** app: `roleKey: 'creator'` is hard-coded on
register, so businesses cannot sign up here. No anonymous tier; entry is gated
by `utils/authGate.ts` plus the `(auth)`/`(main)`/`(details)` layout guards
(19c). Business side: `web`; staff: `admin`.

## Features

### Shipped against mock data (1-18)

1. Onboarding + auth - intro carousel, sign-in/up, OTP, forgot/reset password.
2. Profile verification wizard - **superseded by item 20**.
3. Main app shell - post-login Tabs: Home, Order, Create Gig, Message, Profile.
4. **Home feed (headline)** - campaign/gig/creator/business discovery.
5. Notifications - list (mock; made real by item 38).
6. Search - campaign search.
7. Live campaigns - a creator's ongoing campaigns.
8. Campaigns list + details.
9. Apply to campaign - form plus own applications/invitations list.
10. Businesses directory + details.
11. Top gigs + top creators.
12. Gig details + creator profile.
13. Create gig wizard - basics, pricing, preview.
14. Order lifecycle - 4-tab list, details, deliver, delivered.
15. Messaging - conversation list + chat.
16. Profile / account settings - menu, edit profile, security, change
    password, privacy policy, help center.
17. Balance + transactions.
18. Withdrawals - bank and bKash branches: amount -> review -> success.

Orders, gigs, messaging, and balance still run on `data/*.ts` fixtures.

### Backend-wired (complete)

- **19. Real creator auth** - `/auth/*` login, registration OTP, password
  reset, TOTP second factor, token refresh, route guarding; axios with a
  single-flight refresh interceptor (`services/http.ts` `refreshPromise`), RTK
  Query, react-hook-form + zod.
- **20-22. Creator onboarding wizard** - ten private steps (basics, bio,
  location, categories, subcategories, languages, deliverables, photos,
  portfolio, handle) replacing item 2; handle availability is live, Finish
  only `console.log`s (no submit endpoint).
- **Outside the numbered plan (`feat/live-campaigns`)** - campaign feed
  (`CB1`/`CB4`), details, Apply (`CF1`), Applications Applied/Request tabs
  (`CF2`) with quick Accept/Decline (`CF4`/`CF5`).
- **23. Offer screen** `(details)/engagement/[id]` - offer thread (`CF3`),
  rounds left, Accept / Counter (`CG2`) / Decline / Withdraw offer (`CG3`) /
  Withdraw application (`CF6`), gated by status, turn rule, and
  `roundsRemaining`. Every `409` refetches.
- **24. Deliverables on Offer and Apply** - per-engagement `scope`,
  `scopeChanged` rounds, scope editor (1-30 rows, count 1-50).
- **25. Per-piece delivery** - **replaced by 36** (backend `404`s
  `CI2`/`CI3`/`CI4`).
- **34. Agreement sheet** - Accept opens "You'll receive ৳X" (pending offer +
  licensing markup, or `agreedAmountMinor` + `licensingMarkupMinor`), then
  `CF4`. Never shows platform fee, VAT, processing fee, or business total
  (F-2, F-6). Items 26-33 are backend-19 escrow on `feat/escrow`, not here.
- **35. Campaign objective + custom deliverables (backend 18q)** - one
  objective per campaign, **UGC Content** or **Brand Awareness**, decides the
  allowed deliverables; custom items have a plain `title` and a sanitized-HTML
  `description`. Pre-18q campaigns keep the catalogue minus retired `ugc`.
- **36. Bundle delivery (backend 18r)** - 36a: one draft round per submit
  (`GET /engagements/:id/delivery`, `POST .../delivery/rounds`, images via
  `POST /media` -> `mediaId`, `reuseItemId` carry-over, revisions 2 -> 0, a
  3rd change request escalates to "In dispute"). 36b: final round, a link per
  piece by `finalKind` (UGC file link / Brand Awareness live post URL on the
  piece's platform); approve-only, auto-approved after 72 h. "Delivered",
  never "paid".
- **37. Reviews + portfolio (backend 23 `CK1`-`CK8`)** - after completion
  each side rates the other (0-5 in 0.5 steps, 10-2000 char message), blind
  until both submit or 7 days pass, immutable. 37a: rate the business
  (`(details)/engagement/[id]/review`, `StarRatingInput`, Home "Reviews to
  write" from `CK8`). 37b: own rating via E4 (`404` while not discoverable ->
  "Turn on discoverability..."), "Campaign work" with optimistic Hide/Show
  (`CK7`). 37c: reviews and `reputation` on other creators, businesses, and
  directory cards.

### Next: 38. Real notifications (backend 24 `NT1`-`NT8`, `/realtime`, FCM)

Product decisions 2026-10-17/18: every notification is a backend row (feed +
unread badge), announced over Socket.io while the app is open. Outside the
app: **email** (high urgency always; normal in a 15-min digest, per-category
opt-out) and **FCM push** (high always; normal per category in a 2-min batch;
low never). A creator with push blocked and no verified email gets nothing
outside the app. Notifications carry a `target` (`type`, `id`, `params`),
never a path. Contract: `../backend/docs/features/notifications/`
(`CLIENT_INTEGRATION.md` §4, §6, §7.3; `PUSH_NOTIFICATIONS.md` §12.1).
Backend 24a-24g2 is built on backend `feat/notifications` (not yet in
`develop`); push sits behind `NOTIFICATION_PUSH_ENABLED`, off until the
Firebase projects exist (P4). Business side: `web` 48; staff: `admin` 34.

- **38a. Screen + badge (24a-24c, `NT1`-`NT4`)** - `notificationsApi` RTK
  Query slice; `(details)/notifications` on `NT1` (pull-to-refresh, infinite
  scroll, All/Unread, Mark all with `before`); optimistic mark-read; badge from
  `NT2` (`99+`), refetched on `AppState` active and every 60 s until 38b.
  `lib/notifications/route-map.ts` (below). Tap marks read then pushes; a
  pre-session tap is held until auth; unknown `eventType` shows server text.
- **38b. Live updates (24d `/realtime`)** - `socket.io-client`, foreground
  only (debounced ~1 s), `auth: { token }`, websocket transport.
  Connect/`realtime:resync` -> refetch `NT2` (+ page 1). Handles
  `notification:new` (dedupe by `id`, high-urgency in-app banner),
  `notification:unread_count`, `notification:read` (incl. `all` + `before`),
  `auth:expiring` -> shared refresh -> `auth:refresh`. `connect_error`:
  `AUTH_TOKEN_*` refresh + jittered backoff 1-30 s; `INTERNAL_ERROR` backoff;
  `AUTH_SESSION_REVOKED`/`ACCOUNT_*` sign out. `io server disconnect` does not
  auto-reconnect: refresh, then sign out or reconnect.
- **38c. Email settings (24b `NT5`, `NT6`)** - `(details)/notification-settings`
  from the settings menu: one Email toggle per `NT5` category, in its order
  (creators: engagement, offer, delivery, review, account; no `campaign`);
  locked events read "Always sent: final decisions and deadlines". Partial,
  optimistic, serialized `NT6`; never an empty channel object. No verified
  email (`GET /auth/me` `emailVerified`) -> "Add an email..." prompt instead.
- **38d. Email links open the app (24e)** - links use
  `https://app.influsis.com` (decided 2026-10-19), which serves this app's
  web build, so desktops open the same screen on the web. 38d1: screens read
  `?n={id}`, call `NT3` (404 ignored), drop the param; signed-out or
  pre-restore links wait for sign-in (works via `influsis://` and the web).
  38d2: `associatedDomains`, `intentFilters` `autoVerify`, AASA +
  `assetlinks.json` in the web build's `public/.well-known/`.
- **38e. Push (24g, `NT5`-`NT8`, FCM)** - `@react-native-firebase/app` +
  `messaging` (new EAS dev build), per-env Firebase files via EAS secrets,
  Android channels `high_priority` + `updates`, monochrome `ic_notification`
  drawable. Ask permission only after the first invitation, join request, or
  accepted engagement. `NT7` after every sign-in and on `onTokenRefresh` (else
  at most daily, keyed by user + session); logout sends best-effort `NT8`
  (`404` = success) + `deleteToken()`. Foreground: banner only if the socket
  hasn't shown it. Taps (background + cold start) mark read via `NT3` and run
  the route map; `kind: 'batch'` opens `/notifications`. iOS badge = `NT2`.
  Settings gain "Push on this device" and a Push toggle per category.

**Route map** (must equal backend
`src/notifications/links/notification-links.ts`; overrides first):

| Event or target | Screen |
| --- | --- |
| `delivery.escalated` (override) | `/engagement/{id}` |
| `review.hidden` (override) | `/engagement/{id}/review` |
| `engagement` target (incl. creator `campaign.cancelled`) | `/engagement/{id}` |
| `delivery` target | `/engagement/{id}/submit-delivery` |
| `review` target | `/engagement/{id}/review` |
| `profile`, `account` targets | `/my-profile` |
| `campaign` target | `/campaign/{id}` |
| Unknown | `/notifications` |

**Cross-cutting rules for 38:** standard envelope; `401 AUTH_*` via the
`services/http.ts` refresh (single-use refresh token: never a parallel
refresh, reuse revokes every session); `404` = gone, `NT3` 404 always ignored
silently and the target screen shows "This item is no longer available";
`422` inline; offline -> retry state; `ACCOUNT_SUSPENDED`/`_DEACTIVATED`/
`_PENDING_VERIFICATION` sign out like `AUTH_SESSION_REVOKED`; `limit` <= 50,
`hasNextPage`, no total; merge socket/pages/refresh by `id`; `params` are
strings, `title`/`body` plain text; send `x-custom-lang` (REST) and
`auth.lang` (socket), `PATCH /auth/me { preferredLocale }` on language change
(English only today). Required tests: route map vs backend table, optimistic
revert, `NT3` 404 (38a); event reducers + disconnect/refresh table (38b);
push-to-route incl. bad `targetParams` and batch, registration, foreground
dedupe (38e).

## Data model

Wired: auth, onboarding, campaigns, engagements, delivery, reviews; next,
notifications. Other screens use `data/*.ts` + `types/*.ts` fixtures
(pre-formatted strings, local assets); shapes below follow those types.

- **User** - `id`, `name`, `email`, `emailVerified` (38c), `preferredLocale`
  (38), `role` ('creator' | 'business'), onboarding profile fields.
- **Business** - `id`, `name`, `logo`, `verified`, `bannerImage`, `website`,
  `description`, `reputation`; has many Campaign, Gig.
- **Creator** - `id`, `name`, `image`, `verified`, `topRated`, `location`,
  `tags[]`, `followers`, `engagement`, `bio`, `categories[]`;
  `reputation { averageRating (0-5 | null), reviewCount }`,
  `completedEngagements` (E1/E3/E4; absent on own-profile read).
- **Campaign** - `id`, `businessId`, `title`, `budget`, `dueDate`,
  `applicationDeadline`, `status`, `tags[]`, `requirements[]`,
  `followerWanted`, `objective` ('ugc_content' | 'brand_awareness' | null for
  pre-18q), `deliverables[]` (`id`, `value` catalogue key or `"custom"`,
  `label`, `platform`, `type`, `count`, `title`/`description` custom only).
- **Gig** - `id`, `creatorId`, `platforms`, `price`, `description`,
  `services[]`, `status` ('draft' | 'pending' | 'live').
- **Engagement** (real Application; `scenes/campaigns/types/myEngagement.ts`)
  - `origin` invited|requested; `status` pending|countered|accepted|declined|
  withdrawn|expired|completed|cancelled; `offers[]` (round, sender, amount,
  note, status, `scopeChanged`); `scope[]` (as Campaign deliverables, 1-30);
  `agreedAmountMinor`, `licensingMarkupMinor`.
- **Delivery** (`GET /engagements/:id/delivery`) - `stage` awaiting_draft |
  draft_in_review | draft_changes_requested | awaiting_final |
  final_in_review | delivered | escalated | null; `objective`,
  `revisionsRemaining`, escalation, `pieces[]` (`finalKind` file_link |
  live_post), `rounds[]` (phase, roundNo, status, reason, `reviewDueAt`,
  `autoApproved`, `items[]` link or `mediaId`, caption, `reviewComment`).
- **EngagementReview** - side, `rating`, `message`, `revealAt`, `hidden`;
  reviewer `displayName`, `handle`/`avatarUrl` (null = "Former Influsis
  member"). **PendingReview** (`CK8`) - `engagementId`, `completedAt`,
  `theirsSubmitted`, `campaign { id, title }`, `counterparty`.
- **PortfolioEntry** - one per completed engagement, `hidden`; UGC entries
  never expose file links.
- **Notification** (38) - `id`, `eventType`, `category`, `urgency`
  (high | normal | low), `title`, `body`, `target { type, id, params }`,
  `readAt`, `createdAt`. Unread count (`NT2`). Retention: read 180 days,
  unread 365.
- **NotificationPreferences** (`NT5`/`NT6`) - per category `email` (and
  `push`, 38e) booleans plus locked events; device-level push switch.
- **PushDevice** (`NT7`/`NT8`) - id returned by `NT7`, `platform` ios |
  android, FCM token; bound to the session; backend keeps at most 10.
- **Push payload** (24g2, all strings) - `kind` single | batch,
  `notificationId` (absent on batch), `eventType`, `urgency`, `targetType`,
  `targetId`, `targetParams` (JSON; bad data -> `/notifications`); no `url`.
- **Order** - `id`, `tab` ('campaign' | 'gig-order' | 'completed' |
  'cancelled'), `campaignId`|`gigId`, `businessId`, `creatorId`, `price`,
  `status`, dates; has many deliverables, activity events, tracker steps.
- **Conversation / ChatMessage** - participants, `lastMessage`, `time`,
  `unreadCount` / `conversationId`, `sender`, `text`, `time`.
- **BalanceSummary / WalletTransaction** - totals and signed `amount`.
- **WithdrawMethodOption / Bank / SavedPaymentMethod** - provider (`bank` |
  `bkash`), bank directory, masked account.

> Lock: `Order.tab` and `Gig.status` are separate lifecycle enums by design
> (`types/order.ts`, `types/createGig.ts`) - don't merge them.

## Tech stack

- Expo SDK 54 / React Native 0.81.5 / React 19.1, New Architecture
- TypeScript 5.9 strict
- Expo Router v6 (route files delegate to `scenes/`)
- Redux Toolkit + RTK Query; axios under `services/` with token +
  single-flight refresh interceptors
- react-hook-form + zod; AsyncStorage via `useDataPersist`
- StyleSheet + `theme/` tokens, light/dark via `useColorScheme`
- Jest (`jest-expo`) + React Native Testing Library
- Planned in 38: `socket.io-client` (38b), `@react-native-firebase/app` +
  `messaging` (38e, needs an EAS dev build; not Expo Go)
- EAS Build / Update / Hosting; dotenvx env files

Backend: the NestJS API at `../backend`, consumed read-only via
`../platform-context/api-contracts/` and backend feature docs. Custom JWT
(access + one-shot-rotating refresh), no third-party auth.

> TODO: production/staging API base URLs (`.env.dev` points at a local
> backend).

## Monetization

Commission on payouts flowing from businesses to creators.

> TODO: exact rate and who pays it (creator payout vs. business charge).

## UI/UX

Follow `docs/design-system.md` and `docs/screen/*` (the real Figma design).
Light/dark via `theme/colors.ts`.

Main routes (`app/`):

- `(auth)/onboarding`, `(auth)/auth/*` - intro, sign-in/up, OTP, 2FA, reset
- `creator-onboarding` - ten-step wizard (plan says `(auth)/`; the file is
  `(details)/creator-onboarding.tsx`)
- `(main)/*` - the Tabs shell
- `(details)/*` - campaign, gig, creator, business, chat, order, withdraw,
  `my-profile`, settings screens
- `(details)/engagement/[id]` (+ `/deliverables`, `/submit-delivery`,
  `/review`) - items 23-37
- `(details)/notifications` (38a), `(details)/notification-settings` (38c,
  new)

## Deployment

- Expo-managed app, iOS + Android + Web from one codebase
- EAS Build (`npm run dev:build:mobile`) native, `expo export` web
- EAS Update (OTA) for JS-only changes, EAS Hosting for web
- dotenvx env files; secrets via `npm run dev:secret:push`
- CI: GitHub Actions `format` -> `lint` -> `test` (`.github/workflows/test.yml`);
  no unified `Verify` command (`/ci`)
- Item 38 adds: a new EAS development build (native Firebase modules);
  `google-services.json` / `GoogleService-Info.plist` per environment via EAS
  secrets, matching that environment's backend `FIREBASE_PROJECT_ID`;
  `associatedDomains` / `intentFilters` in `app.config.ts`; AASA and
  `assetlinks.json` served by the production web build on
  `app.influsis.com` (also the creator link domain). Verify links and push on
  real iOS (TestFlight) and Android (13+ and older) devices.

> TODO: production/staging API endpoints and hosting; `API_URL` defaults to a
> placeholder.

## Open questions

- 38d2: needs the Apple Team ID, Android signing SHA-256 fingerprints and
  production bundle ids (not in the repo), and a decision on dev/staging
  link domains.
- 38e: Firebase projects and the APNs key don't exist yet (P4); push stays
  off until they do.
- 38: backend `feat/notifications` isn't merged into `develop`; build against
  that branch.
- 38c: points to "the existing email flow" for adding an email, but no
  add-email screen is listed in the plans or routes (backend O2 pending).
- 38: language switching assumes an app language setting; only English exists
  (O3), and neither plan names an i18n setup.
- Item 35: may a creator write a new custom deliverable on mobile, or only
  keep/adjust the business's?
- Item 36: `build-plan.md` still says "a final can be sent back once"; the
  backend fix of 2026-10-11 made the final approve-only.
- Item 37: the section intro says backend 23a-23c are "planned, not built";
  the item says they're built.
- Item 37b: no own-reviews read exists for a non-discoverable creator.
- `feat/escrow` item 28 assumes per-piece review; re-scope to rounds.
- Commission structure: F-2 implies the business pays the fee;
  `project-plan.md` §6 still says undecided.
- `platform-context/open-questions.md` #1 (gig entity model) blocks wiring
  Create Gig.
