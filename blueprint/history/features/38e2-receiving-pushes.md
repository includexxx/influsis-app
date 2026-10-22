# Current Feature

**Feature:** 38e2. Receiving pushes (backend 24g2, FCM)
**Branch:** feature/receiving-pushes
**Status:** verified
**Base:** `feat/notifications` HEAD (`1a163db`, which has 38a-38e1 and 38e3).

## Goal

A push opens the right screen and marks its notification read, from:

- the background
- a closed app
- signed out

That last case waits until sign-in, through the same held-route path as
38d1's email links.

While the app is open, a push never shows a system notification, never
doubles the socket's in-app banner, and keeps the badge and feed current. On
iOS the app icon's badge matches the unread count after every return to the
app.

## In scope

- **Parsing the push data** (backend §8.1, all strings): `kind`,
  `notificationId`, `eventType`, `urgency`, `targetType`, `targetId`, and
  `targetParams` as a JSON string, parsed in a try/catch.
- **The tap path:**
  - `single` -> `routeFor(...)` (the 38a route map) plus `?n={notificationId}`
  - `kind: 'batch'` -> `/notifications`, with nothing marked read
  - bad data -> `/notifications`
- **Background taps** (`onNotificationOpenedApp`) and **cold-start taps**
  (`getInitialNotification()`, read once at start). Signed in, the app pushes
  the path; restoring or signed out, it holds the path (38a held route). The
  `?n=` it carries is marked read by 38d1's `useNotificationReadParam`.
- **Foreground `onMessage`:**
  - No system notification.
  - Always refetch `NT2`.
  - When the socket hasn't delivered that `notificationId`: refresh the feed
    (38b resync), and show the 38b in-app banner for `urgency: 'high'`.
  - A later socket `notification:new` for the same id doesn't show the
    banner again.
  - `batch` -> refetch `NT2` and refresh the feed only.
- **iOS app badge** = the `NT2` count on every return to the foreground and
  whenever the count changes while open, and `0` after sign-out. It uses
  `expo-notifications` `setBadgeCountAsync`, lazily required (as in 38e1's
  `channels.ts`).

## Out of scope

- A background message handler (`setBackgroundMessageHandler`). The backend
  always sends a `notification` block, so the OS shows background pushes by
  itself. A headless handler would also need a custom JS entry instead of
  `expo-router/entry`.
- Showing pushes on the web (web push is the `web` and `admin` apps' job).
- Universal links (38d2) and any settings change (38e3, done).

## Build loop

`workflow.stepReview` is `feature`: build all steps, keeping `npm run test`
green after each, then present one review packet. `workflow.checkpointCommits`
is `disabled`. `/complete` makes the feature commit.

## Build steps

- [x] **1. Push data and the tap path**
  - `services/push/pushData.ts`, all pure:
    - `parsePushData(data)` returns one of:
      - `{ kind: 'batch' }`
      - `{ kind: 'single', notificationId, eventType, urgency, target: { type, id, params } }`
      - `null`

      Rules:
      - A non-string value counts as missing.
      - `single` requires `notificationId`, `eventType`, `targetType` and
        `targetId`.
      - `targetParams` that isn't valid JSON of string values counts as bad
        data, giving `null`.
      - An unknown `kind` gives `null`.
      - An unknown `urgency` reads as `normal`.
    - `pushTapPath(parsed)`:
      - `batch` or `null` -> `/notifications`
      - `single` -> `routeFor({ eventType, target })` with
        `n={encodeURIComponent(notificationId)}` appended (`?`, or `&` when
        the path already has a query)
  - **Done when** `pushData.test.ts` covers:
    - a full `single` for each Phase 1 target type (paths equal to the 38a
      table, plus `?n=`)
    - `batch`
    - bad `targetParams` (invalid JSON, a non-object, non-string values) ->
      `/notifications`
    - missing fields -> `/notifications`
    - an unknown `kind`
    - an id needing encoding

    `npm run test` is green.

- [x] **2. Tap and foreground handlers**
  - `services/push/messaging.ts`: `PushMessaging` gains
    `onMessage(listener)`, `onNotificationOpenedApp(listener)` and
    `getInitialNotification()`, wrapping the modular API like the rest. The
    listener receives `{ data?, notification?: { title?, body? } }`.
  - `slices/notificationsLive.slice.ts`:
    - New `pushBannerShown(id)` records the id in `bannerShownIds` (capped
      at 50).
    - `notificationReceived` doesn't set `banner` for an id already in
      `bannerShownIds`, and records the ids it bans. So the second arrival,
      socket or push, never shows the banner again.
    - `reset` clears them.
  - `services/push/pushHandlers.ts`, logic with injected `dispatch`,
    `getState`, `push` (router) and `hold`:
    - **`handlePushTap(message)`:**
      - path = `pushTapPath(parsePushData(message.data))`
      - signed in -> `router.push(path)`
      - otherwise -> `holdNotificationRoute(path)`
      - The `?n=` in the path is marked read by 38d1, so a held path marks it
        after sign-in.
    - **`handleForegroundPush(message)`:**
      - Always invalidate the `UnreadCount` tag.
      - Parse the data. For `batch`, or for `single` when the id isn't in
        `notificationsLive.incoming`: `resyncRequested()`, which makes the
        open feed reload page 1.
      - For `single`, `urgency: 'high'`, and the id in neither `incoming`
        nor `bannerShownIds`: `showBanner(item)` and `pushBannerShown(id)`.
        The `item` is built from the push:
        - `id` = `notificationId`
        - `title` / `body` from `notification`, or `''`
        - `target`, `eventType` and `urgency` from the data
        - `category: ''` (the data carries none)
        - `readAt: null`, `resolvedAt: null`
        - `createdAt` = the receipt time
      - Nothing when signed out.
  - **Done when**:
    - `pushHandlers.test.ts` covers taps signed in (push), restoring
      (held), and signed out (held); a batch tap (`/notifications`); and bad
      data (`/notifications`).
    - It also covers foreground pushes:
      - a high push the socket hasn't seen -> banner, resync, `NT2`
        invalidated
      - one the socket already delivered -> no banner, no resync, `NT2` still
        invalidated
      - normal -> resync only
      - batch -> resync only
      - signed out -> nothing
    - `notificationsLive.slice.test.ts` covers a push-then-socket arrival of
      the same id showing one banner, and the reverse.
    - `messaging.test.ts` covers the three new wrappers.

    `npm run test` is green.

- [x] **3. Wiring and the iOS badge**
  - `hooks/usePushHandlers.ts`, mounted once in `Router` (`app/_layout.tsx`),
    out of the `@/hooks` barrel like the other root hooks:
    - When messaging exists, subscribe `onMessage` ->
      `handleForegroundPush`, and `onNotificationOpenedApp` ->
      `handlePushTap`.
    - Call `getInitialNotification()` once. If it returns a message ->
      `handlePushTap`, which holds the path while the session restores and
      the `(main)` layout opens it after.
    - Unsubscribe on unmount. A no-op when messaging is `null`.
  - `services/push/badge.ts`: `setAppBadge(count)`, iOS only, lazy
    `require('expo-notifications')` in a try/catch, errors swallowed.
  - `hooks/useAppBadge.ts`, mounted in `Router`:
    - iOS and signed in: subscribe to `useGetUnreadCountQuery`, refetch on
      every `AppState` return to `active`, and `setAppBadge(count)` whenever
      the count changes.
    - On sign-out: `setAppBadge(0)`.
    - Elsewhere: nothing.
  - **Done when** these pass, and `npm run test` and `npm run lint` are
    green:
    - `usePushHandlers.test.tsx` (mocked messaging) covers subscribe and
      unsubscribe, a background tap routed, a cold-start message routed
      once, a foreground message handled, and nothing when messaging is
      `null`.
    - `badge.test.ts` covers iOS setting the count, Android doing nothing,
      and a missing module not throwing.
    - `useAppBadge.test.tsx` covers the badge following the `NT2` count, a
      refetch on return to `active`, `0` on sign-out, and nothing on Android.

## Files / areas

- New:
  - `services/push/pushData.ts`, `pushHandlers.ts` and `badge.ts`, each with
    a test
  - `hooks/usePushHandlers.ts` and `hooks/useAppBadge.ts`, each with a test
- Changed:
  - `services/push/messaging.ts` and its test
  - `slices/notificationsLive.slice.ts` and its test
  - `app/_layout.tsx`
- Reused:
  - `lib/notifications/route-map.ts` and `pendingRoute.ts` (38a)
  - `hooks/useNotificationReadParam.ts` (38d1)
  - `components/layouts/NotificationBannerHost` (38b)

## Data / contracts

Source: `../backend/docs/features/notifications/PUSH_NOTIFICATIONS.md` §6, §8
and §12.1, and `CLIENT_INTEGRATION.md` §1, §4 and §6. Built in backend 24g2,
behind `NOTIFICATION_PUSH_ENABLED`.

- **`data` (strings only):**
  - `kind`: `single` | `batch`
  - `notificationId`, `eventType`, `targetType` and `targetId` (all
    `single` only)
  - `urgency`
  - `targetParams` (a JSON string of `target.params`)

  Creators get **no `url`**.
- **Title and body:** Android `notification.title` / `.body`; iOS
  `aps.alert`. React Native Firebase exposes both as `message.notification`.
- **Batched push:**
  - Title "You have {N} new updates", `kind: 'batch'`, `urgency: 'normal'`.
  - It opens `/notifications` and marks nothing read.
  - Tray tag `batch`: a new batch replaces the previous one.
- **Collapse:** Android `notification.tag` / iOS `apns-collapse-id` =
  `notificationId`, so a duplicate replaces the first in the tray.
- **iOS badge:** `aps.badge` = the unread count while in the background. The
  app sets it to `NT2` on every foreground.
- **Expiry:** high 24 h, normal 1 h. The feed stays the record.
- **NT3 on tap:** through `?n=` (38d1). A `404` (another account's push
  tapped after sign-out and a new sign-in, or deleted by retention) is
  ignored, and the target screen handles its own `404`.

## Testing

`npm run test` is the gate for every step; `npm run lint` and
`npx tsc --noEmit` before review. No combined Verify command exists. `tsc`
already reports two `isOnboardingComplete` errors in `services/authApi.test.ts`
and `slices/auth.slice.test.ts`; don't add new ones. Last observed: all 219
suites and 1,501 tests passed on `1a163db` (pre-commit hook, 38e3 merge).
React Native Firebase and `expo-notifications` are mocked; nothing native
runs in Jest.

Release gate (can't run here; needs the Firebase projects, P4, and a new
push-enabled EAS build): on real Android (13+ and older) and iOS
(TestFlight), with the app in the foreground, in the background, and killed,
check that:

- a tap opens the mapped screen and the notification turns read
- a batch tap opens Notifications
- the foreground shows the banner once
- the iOS badge matches the unread count

**First** confirm on iOS that background and cold-start taps reach React
Native Firebase despite `expo-notifications` (see Open questions).

## Notes for the AI

- A foreground push is never added to the feed's `incoming` list: the push
  data has no `createdAt` or `category`. The resync reloads page 1 from the
  server instead.
- Marking read on tap goes through `?n=` so held taps (cold start, signed
  out) mark read after sign-in with no extra code.
- Keep the handlers free of React; the hooks are glue only.
- Never log push payloads; titles and bodies are user content.

## Open questions

- **iOS taps with `expo-notifications` installed (decision 2026-10-19,
  carried from 38e1).** `expo-notifications` takes over the
  `UNUserNotificationCenter` delegate on iOS. If, on the first push-enabled
  TestFlight build, `onNotificationOpenedApp` / `getInitialNotification`
  don't fire, the fix is outside this spec: either read taps from
  `expo-notifications`' response listener on iOS, or replace it for channels
  with a small custom plugin. That needs a decision then; it can't be tested
  before Firebase exists.
