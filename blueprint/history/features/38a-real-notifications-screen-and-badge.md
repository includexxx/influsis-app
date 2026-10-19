# Current Feature

**Feature:** 38a. Real notifications screen and badge (backend 24a-24c `NT1`-`NT4`)
**Branch:** feature/real-notifications-screen-and-badge
**Status:** verified
**Base:** the current `feat/notifications` HEAD (`b675341`). Local `develop` is
114 commits behind its remote and does not contain the item-38 plan commits.

## Goal

Replace the mock notifications screen with the creator's real feed from the
backend, show the real unread count on the bell, and make every notification
tap open the same screen the backend's email links open (or say "This item is
no longer available" when the target is gone).

## In scope

- `services/notificationsApi.ts`: RTK Query API for `NT1`-`NT4`, wired into
  the store, reset on sign-out.
- `x-custom-lang: en` sent with API calls (English is the only language).
- `ACCOUNT_SUSPENDED` / `ACCOUNT_DEACTIVATED` / `ACCOUNT_PENDING_VERIFICATION`
  on any `NT` call signs out, like `AUTH_SESSION_REVOKED`.
- `lib/notifications/route-map.ts` equal to the backend creator table, with a
  test that copies that table for every Phase 1 creator event.
- A held route: a notification opened before the session is restored (or
  while signed out) opens once the creator is signed in.
- "This item is no longer available" on the four target screens that today
  redirect or show a generic error on `404`.
- `(details)/notifications` rewritten on `NT1`: All / Unread, pull-to-refresh,
  infinite scroll with the `before` anchor, optimistic mark-read (tap) and
  "Mark all as read" (`NT4` with `before`), loading / empty / error states.
- `NotificationCard` widened: category icon with a generic fallback, unread
  marker.
- Bell badge from `NT2` (`99+` above 99) on Home and Search, refetched on every
  return to the foreground and every 60 s while foregrounded.
- Delete `data/notifications.ts`.

## Out of scope

- Socket.io live updates, the in-app high-urgency banner, `notification:*`
  events (38b). Until then the 60 s `NT2` poll stands in.
- Email and push settings, `notification-settings` screen (38c, 38e).
- Universal links, `?n={id}` handling (38d).
- FCM, push taps, iOS badge, `NT7`/`NT8` (38e).
- `PATCH /auth/me { preferredLocale }` and any language switcher (no app
  language setting exists).
- A tab-bar badge: no tab hosts notifications; the bell is the badge.
- `resolvedAt` / "Handled": admin-only, never set for a creator.

## Build loop

`workflow.stepReview` is `feature`: build all steps, keeping `npm run test`
green after each, then present one review packet for the whole feature.
`workflow.checkpointCommits` is `disabled`: no per-step commits. `/complete`
makes the feature commit.

## Build steps

- [x] **1. Notifications API, types, and store wiring**
  - `types/notification.ts`: replace `NotificationItem` with the `NT1` feed
    item (see Data / contracts); add `NotificationCategory`,
    `NotificationUrgency`, `NotificationTargetType`, `NotificationTarget`,
    `NotificationsPageArgs`, `UnreadCount`, `MarkReadResult`,
    `MarkAllReadResult`. Keep `NotificationIconName`, adding `'generic'`.
    Export from `types/index.ts`.
  - `services/notificationsApi.ts` (`reducerPath: 'notificationsApi'`,
    `axiosBaseQuery()`, tags `NotificationsFeed`, `UnreadCount`):
    `getNotificationsPage` (`GET /notifications`, params `page`, `limit`,
    `unread` only when true, `before` only when set), `getUnreadCount`
    (`GET /notifications/unread-count`), `markNotificationRead`
    (`PATCH /notifications/:id/read`, id through `encodeURIComponent`),
    `markAllNotificationsRead` (`POST /notifications/read-all`, body
    `{ before }`). Both mutations invalidate `UnreadCount` on success only.
    Export from `services/index.ts`.
  - `utils/store.ts`: reducer, middleware, and the `serializableCheck`
    ignores (queries and mutations) for `notificationsApi`.
    `clearSessionState` in `slices/auth.slice.ts` also calls
    `notificationsApi.util.resetApiState()`.
  - `services/http.ts`: add `'x-custom-lang': 'en'` to `httpClient`'s default
    headers (a named constant, not a magic string).
  - Account-state sign-out: a listener middleware
    (`services/accountStateSignOut.ts`, registered in `utils/store.ts`) that
    dispatches `signOut()` when any `notificationsApi` query or mutation
    rejects with `ACCOUNT_SUSPENDED`, `ACCOUNT_DEACTIVATED` or
    `ACCOUNT_PENDING_VERIFICATION`. `AUTH_SESSION_REVOKED` is a `401` and
    already signs out through the `services/http.ts` refresh path; do not
    duplicate it. Add any missing codes to `ApiErrorCode` in `types/api.ts`.
  - **Done when** `services/notificationsApi.test.ts` proves each endpoint's
    method, URL, params, and body (mocking `services/http` like
    `profilesApi.test.ts`), a listener test proves each account code signs
    out and a `404` / `422` / network error does not, and `npm run test` is
    green.

- [x] **2. Route map and held route**
  - `lib/notifications/route-map.ts`: `routeFor({ eventType, target })`
    returns a path string. Lookup: event override, then `target.type`, then
    `/notifications`. Ids go through `encodeURIComponent`, as in the backend.
    Export `NOTIFICATIONS_PATH = '/notifications'`.
  - `lib/notifications/pendingRoute.ts`: in-memory `holdNotificationRoute(path)`
    and `takeNotificationRoute()` (returns and clears; the last hold wins). Not
    persisted.
  - `lib/notifications/openNotification.ts`:
    `openNotification(item, { status, markRead, currentPath })`. It marks the
    item read through `markRead` when `readAt` is null, resolves `routeFor`,
    then holds the path if `status !== 'authenticated'`. Otherwise it
    `router.push`es the path. When the path equals `currentPath` (a fallback
    tap on the notifications screen) it does not navigate.
  - `app/(main)/_layout.tsx`: once the gate allows, take any held route and
    `router.push` it (one effect, runs once per held value).
  - **Done when** `route-map.test.ts` copies the backend creator table and
    asserts all 18 Phase 1 creator events below resolve as listed, plus:
    an unknown `eventType` on a known target uses the target; an unknown
    target type goes to `/notifications`; both overrides beat their target;
    ids with `/` are encoded. `pendingRoute.test.ts` and
    `openNotification.test.ts` cover hold-while-restoring,
    hold-while-signed-out, push-when-authenticated, no navigation for the
    current path, and no `markRead` call for an already-read item.
    `npm run test` is green.

- [x] **3. "This item is no longer available"**
  - New `components/elements/ItemUnavailable/` (`ItemUnavailable.tsx`,
    `index.ts`, test): title "This item is no longer available", one line
    "It may have been removed, or you no longer have access to it.", a
    primary "Go back" button (`router.back()` when `router.canGoBack()`, else
    `router.replace('/home')`) and a "View notifications" link that pushes
    `/notifications`. Theme tokens only; works in light and dark.
  - Replace the current `NOT_FOUND` handling with `ItemUnavailable` (under
    the screen's existing header and back button) in:
    - `scenes/campaigns/OfferScreen.tsx` (today: the generic error state for
      every error)
    - `scenes/campaigns/SubmitDeliveryScreen.tsx` (today: `Redirect` to
      `/live-campaign`)
    - `scenes/campaigns/ReviewBusinessScreen.tsx` (today: `Redirect` to
      `/home`)
    - `scenes/campaigns/CampaignDetails.tsx` (today: `Redirect` to `/home`)
  - A missing route param (`!id`) keeps today's redirect. Other errors keep
    today's error-with-retry state.
  - `/my-profile` needs no change: its own-profile read cannot 404 for the
    signed-in creator, and its public-profile `404` is handled already.
  - **Done when** the `ItemUnavailable` test covers both buttons and the
    can't-go-back fallback, and the four screens' existing tests are updated
    so a `NOT_FOUND` response renders "This item is no longer available"
    instead of redirecting. `npm run test` is green.

- [x] **4. Feed paging and read-state logic**
  - `scenes/notifications/hooks/useNotificationsFeed.ts`
    (`filter: 'all' | 'unread'`): page-indexed accumulation as in
    `useCampaignFeedPages`, plus the anchor. Page 1 is fetched without
    `before`; the newest `createdAt` it returns becomes the anchor and is sent
    with pages 2+. `hasMore` is "the page came back full" (`limit` 20; the
    envelope's `meta` is dropped by `services/http.ts`). The flattened list is
    deduped by `id`, keeping the first occurrence. `refresh()` (pull-to-refresh)
    drops the anchor and later pages, refetches page 1 with
    `forceRefetch`, and resolves when it settles. Changing `filter` starts
    over. Returns `items`, `isInitialLoading`, `isLoadingMore`,
    `isInitialError`, `isLoadMoreError`, `hasMore`, `loadMore`, `retry`,
    `refresh`.
  - `scenes/notifications/utils/readState.ts`, pure:
    `applyReadState(items, state)` returns items with `readAt` filled for ids
    in `state.readIds` and for unread items with `createdAt <= state.allBefore`.
    Helpers `withRead(state, id)`, `withAllRead(state, before)`, and their
    reverts `withoutRead(state, id)`, `restore(prev)`.
  - `scenes/notifications/hooks/useNotificationReadState.ts`: holds that state
    for the screen (shared by both tabs). `markRead(item)` applies optimistically
    and calls `NT3`. On failure it reverts, and it never alerts on `404` or any
    other `NT3` error. `markAllRead(before)` applies optimistically and calls
    `NT4`. On failure it reverts and exposes `markAllError`. `updated: 0` is
    success.
  - **Done when** `readState.test.ts`, `useNotificationsFeed.test.tsx` and
    `useNotificationReadState.test.tsx` cover: anchor sent on page 2+ and not
    on page 1, dedupe across pages, `hasMore` false on a short page, refresh
    resets the anchor, optimistic mark-read reverts on failure, the `NT3`
    `404` reverts silently, mark-all marks only items at or before `before`
    and reverts on failure. `npm run test` is green.

- [x] **5. Real Notifications screen**
  - `components/elements/NotificationCard`: `icon` accepts `'generic'` (a
    Feather `bell` in the same circle); new `unread?: boolean` shows a dot and
    puts "Unread, " in front of the accessibility label; `accessibilityRole`
    stays `button` when `onPress` is set. `title` and `description` render as
    plain `<Text>` (server text, never HTML) and wrap; `numberOfLines` is not
    set on the title.
  - `scenes/notifications/Notifications.tsx` rewritten. Keep the Figma header
    ("Notification", back). Below it:
    - The All / Unread tabs. Reuse `ApplicationsTabs` from
      `@/scenes/campaigns/components/applications/ApplicationsTabs` if its
      props fit; otherwise build a local equivalent with the same look.
    - A "Mark all as read" text button, shown when the visible list has an
      unread item and disabled while `NT4` is in flight. It sends `before` =
      the newest `createdAt` in the visible list. `markAllError` shows inline
      under it with `accessibilityRole="alert"`: "Couldn't mark everything as
      read. Try again."
    - A `FlatList` of `NotificationCard`s:
      - `icon` from `category`: `offer` -> `money-tick`, `engagement` ->
        `wallet`, anything else -> `generic`.
      - `description` = `body`.
      - `time` = `formatRelativeTime(createdAt)` from
        `@/scenes/campaigns/utils/mapApplication`.
      - `unread` = `readAt === null` after `applyReadState`.
      - The list has `RefreshControl` and `onEndReached` -> `loadMore`.
    - A footer: a spinner while loading more, or a "Couldn't load more.
      Retry" row on a load-more error.
  - Tap -> `openNotification` with `markRead` from `useNotificationReadState`,
    `status` from `useAuthSlice()`, `currentPath` `/notifications`. Unknown
    `eventType`s still show their `title`/`body` and open via the target or
    the fallback.
  - States:
    - Initial loading: three card-shaped skeletons, built with
      `useSkeletonPulse` from `@/scenes/campaigns/hooks/useSkeletonPulse`.
    - Initial error, including offline: an error state with "Try again".
    - Empty: All shows "No notifications yet" with "Updates about your
      campaigns, offers and deliveries show up here." Unread shows "You're
      all caught up".
  - The Figma "Last 24 Hours" grouping is dropped: one list, newest first.
  - Items marked read on the Unread tab stay listed (now read) until refresh
    or tab change.
  - Delete `data/notifications.ts`.
  - **Done when** `NotificationCard.test.tsx` covers the generic icon and the
    unread marker. `scenes/notifications/Notifications.test.tsx` (mocking the
    API hooks, as `Applications.test.tsx` does) covers loading, empty for
    each tab, error with retry, a tap that marks read and pushes the mapped
    route, and "Mark all as read" sending the newest `createdAt`.
    `npm run test` and `npm run lint` are green.

- [x] **6. Bell badge**
  - `components/elements/AppHeader`: replace the unused `hasUnread` prop with
    `unreadCount?: number`. When it is above 0, a count pill on the bell shows
    `formatBadgeCount(n)` (`1`-`99`, else `99+`). The bell's accessibility
    label becomes "Notifications, N unread" (`99+` for N above 99), otherwise
    "Notifications".
  - `formatBadgeCount` lives in `lib/notifications/badge.ts`.
  - `hooks/useUnreadCount.ts` (exported from `hooks/index.ts`) wraps
    `useGetUnreadCountQuery` with `pollingInterval` 60 000 ms while
    `AppState` is `active` and 0 otherwise, and calls `refetch()` on every
    transition to `active`. It returns `count` (0 while loading or on error;
    a failed count never shows an error).
  - `scenes/home/Home.tsx` and `scenes/search/Search.tsx` pass
    `unreadCount={useUnreadCount()}` to `AppHeader`.
  - Marking read on the notifications screen invalidates `UnreadCount` (step
    1), so the badge is current when the creator goes back.
  - **Done when** `AppHeader.test.tsx` covers no badge at 0, `5`, `99`,
    `99+` and the accessibility label. `badge.test.ts` covers the formatter.
    `useUnreadCount.test.tsx` (fake timers, mocked `AppState`) covers a
    refetch on return to `active`, polling only while active, and `0` on
    error. `npm run test` and `npm run lint` are green.

## Files / areas

- New:
  - `services/notificationsApi.ts`, `services/notificationsApi.test.ts`
  - `services/accountStateSignOut.ts` and its test
  - `lib/notifications/route-map.ts`, `pendingRoute.ts`,
    `openNotification.ts`, `badge.ts`, each with a co-located test
  - `components/elements/ItemUnavailable/`
  - `scenes/notifications/hooks/useNotificationsFeed.ts`,
    `useNotificationReadState.ts`
  - `scenes/notifications/utils/readState.ts`
  - `scenes/notifications/Notifications.test.tsx`
  - `hooks/useUnreadCount.ts`
- Changed:
  - `types/notification.ts`, `types/index.ts`, `types/api.ts`
  - `services/index.ts`, `services/http.ts`, `utils/store.ts`,
    `slices/auth.slice.ts`
  - `app/(main)/_layout.tsx`
  - `scenes/notifications/Notifications.tsx`, `notifications.style.ts`
  - `components/elements/NotificationCard/*`, `components/elements/AppHeader/*`
  - `scenes/home/Home.tsx`, `scenes/search/Search.tsx`
  - `scenes/campaigns/OfferScreen.tsx`, `SubmitDeliveryScreen.tsx`,
    `ReviewBusinessScreen.tsx`, `CampaignDetails.tsx` and their tests
  - `hooks/index.ts`
- Deleted: `data/notifications.ts`

## Data / contracts

Source: `../backend/docs/features/notifications/API_ENDPOINTS_LIST.md`
(NT1-NT4), `CLIENT_INTEGRATION.md` §1, §2, §4, §6, `EVENT_CATALOG.md`, and
`../backend/src/notifications/links/notification-links.ts`. Backend 24 is
built on backend `feat/notifications`, so run the local backend from that
branch.

- **All calls**:
  - Base `/api/v1` (the axios `baseURL`) and the standard envelope.
    `request()` unwraps `data` and drops `meta`.
  - Bearer auth through `services/http.ts`; no permission and no 2FA
    step-up.
  - Someone else's id, or a malformed one, returns `404 NOT_FOUND`, never
    `403`.
- **NT1** `GET /notifications?page&limit&unread&before`:
  - `page` >= 1. `limit` 1-50, clamped at 50; the app sends 20. `unread` is
    a boolean. `before` is an ISO-8601 string, and an invalid one is a `422`.
  - Order: `createdAt DESC, id DESC`. No total count; the last page is the
    first one that comes back short.
- **Feed item** (`NotificationItem`):
  - `id` string (uuid), `eventType` string (open set), `category`
    `'campaign' | 'engagement' | 'offer' | 'delivery' | 'review' | 'account'`,
    `urgency` `'high' | 'normal' | 'low'`.
  - `title` and `body`: plain-text strings.
  - `target`: `{ type: string; id: string; params: Record<string, string> }`.
    Keep `type` a `string` so unknown values compile; known values are in
    `NotificationTargetType`.
  - `readAt`, `resolvedAt`: `string | null`. `createdAt`: ISO string.
- **NT2** `GET /notifications/unread-count` -> `{ count: number }`.
- **NT3** `PATCH /notifications/:id/read` -> `{ id, readAt }`. Idempotent.
  `404` when not the caller's or not a uuid.
- **NT4** `POST /notifications/read-all` with `{ before?: string }` ->
  `{ updated: number }`. `422` when `before` isn't ISO-8601. `updated: 0` is
  success.
- **Route map**: override, then target, then fallback. Phase 1 creator events:

  | Event | Target type | Path |
  | --- | --- | --- |
  | `campaign.cancelled` (creator copy) | `engagement` | `/engagement/{id}` |
  | `engagement.invited`, `.accepted`, `.declined`, `.cancelled`, `.completed` | `engagement` | `/engagement/{id}` |
  | `offer.countered`, `offer.withdrawn`, `offer.limit_raised` | `engagement` | `/engagement/{id}` |
  | `delivery.changes_requested`, `delivery.draft_approved` | `delivery` | `/engagement/{id}/submit-delivery` |
  | `delivery.escalated` (override) | `delivery` | `/engagement/{id}` |
  | `review.prompt` | `review` | `/engagement/{id}/review` |
  | `review.hidden` (override) | `engagement` | `/engagement/{id}/review` |
  | `review.published` | `profile` | `/my-profile` |
  | `verification.approved`, `verification.rejected` | `account` | `/my-profile` |
  | `account.suspended` | `account` | `/my-profile` |
  | `campaign` target (fallback for unknown events) | `campaign` | `/campaign/{id}` |
  | anything else | - | `/notifications` |

- **Error handling** (every `NT` call):
  - `401 AUTH_*` goes through the shared refresh; never start a second
    refresh.
  - `404` = gone; `NT3` never alerts on it.
  - `422` shows inline.
  - Offline or anything else: the error state with retry.
  - A failed optimistic change reverts.
  - `ACCOUNT_SUSPENDED` / `_DEACTIVATED` / `_PENDING_VERIFICATION` sign out.

## Testing

`npm run test` (Jest + RNTL) is the gate for every step; `npm run lint` before
review. No combined Verify command exists. Before this spec,
the pre-commit hook on `b675341` ran the full suite: 182 suites and 1,144
tests passed.

Predicted tests:

- notificationsApi
- account-state listener
- route map, compared with the backend table
- pendingRoute, openNotification
- ItemUnavailable
- updated NOT_FOUND cases in the four target screens' tests
- readState, useNotificationsFeed, useNotificationReadState
- NotificationCard
- the Notifications screen
- AppHeader, badge formatter, useUnreadCount

None of these need a running backend.

Not covered by automated tests, so it must be checked by hand against the
local backend on `feat/notifications`:

- real feed rendering
- tap -> target screen for at least an engagement, a delivery, and a review
  notification
- mark all
- badge refresh on return from background

## Notes for the AI

- Follow the coding standards:
  - Route files stay thin.
  - `StyleSheet.create` with `theme/` tokens only.
  - Light and dark must both work.
  - No `console.log`.
- Use `router.push(path as Href)` for mapped paths. They are plain strings
  shared with the backend table, so don't rebuild them as typed route
  objects.
- The route map is a contract shared with
  `notification-links.ts`. Copy it; never reinterpret it. If the table and
  the docs disagree, the backend file wins, and say so in the review.
- Keep the read-state overlay separate from the RTK cache: earlier pages of
  the feed are local state in the hook, not live cache entries, so patching
  the cache alone would miss them. 38b will feed `notification:read` into the
  same overlay.
- `x-custom-lang` goes on every request, not just `NT`. The backend falls
  back to English, and sign-up stores `preferredLocale` from it, which is
  `en` either way.
- The held route is only reachable from 38d/38e, but 38a's plan requires it.
  Keep it in memory, and do not clear it on sign-out: a link tapped while
  signed out must survive until sign-in.
- Do not add the socket, push, or settings. Do not touch `my-profile`.
