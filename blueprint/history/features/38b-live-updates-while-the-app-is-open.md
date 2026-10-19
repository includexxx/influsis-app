# Current Feature

**Feature:** 38b. Live updates while the app is open (backend 24d `/realtime`)
**Branch:** feature/live-updates-while-the-app-is-open
**Status:** verified
**Base:** `feat/notifications` HEAD (`0f3af65`, which has 38a).

## Goal

While the app is in the foreground, keep one Socket.io connection to the
backend's `/realtime` namespace. New notifications, read state, and the unread
count then update without polling, and a high-urgency notification shows an
in-app banner that opens its target. The socket must never start a second
token refresh, must sign out on account-state codes, and must not reconnect in
a storm on flaky mobile networks.

## In scope

- Add the `socket.io-client` dependency (authorized by build-plan 38b).
  Pin the 4.x line to match the backend's `socket.io` 4.8.3.
- Export one shared `refreshSession()` from `services/http.ts`, reusing its
  single-flight `refreshPromise`.
- A socket manager for `/realtime`. It sends `auth: { token, lang }`, uses the
  websocket transport only, refreshes on `auth:expiring`, and follows the
  `connect_error` and server-disconnect decision tables.
- A `notificationsLive` Redux slice: incoming items (deduped by id), read
  events, a resync counter, the banner item, and the connected flag. It is
  reset on sign-out.
- A lifecycle hook mounted in the root layout. It connects only while signed
  in and `AppState` is `active`, debounced by about 1 s, and disconnects on
  background and on sign-out.
- The badge: `notification:unread_count` overwrites `NT2`'s cache. Every
  connect and `realtime:resync` refetches `NT2`. The 60 s poll from 38a runs
  only while the socket is not connected.
- The notifications screen: incoming items are prepended, socket read events
  apply to the list, and a resync or reconnect refreshes page 1 while the
  screen is open.
- An in-app banner for `urgency === 'high'`. A tap marks the item read and
  opens its target through 38a's `openNotification`.

## Out of scope

- Push, foreground `onMessage`, and banner dedupe against pushes (38e). The
  banner keeps one entry point (`showBanner`) so 38e can reuse it.
- Email settings (38c) and app links (38d).
- Messaging over the same socket (backend item 22).
- Any client → server event other than `auth:refresh`.
- `PATCH /auth/me { preferredLocale }`: there is no language setting yet, so
  `lang` is always `APP_LANGUAGE` (`en`).

## Build loop

`workflow.stepReview` is `feature`: build all steps, keeping `npm run test`
green after each, then present one review packet. `workflow.checkpointCommits`
is `disabled`. `/complete` makes the feature commit.

## Build steps

- [x] **1. Dependency, shared refresh, and connection policy**
  - `npm install socket.io-client@^4.8.1`. Check that `package.json` and the
    lockfile change, and that nothing else does. It is pure JS, so no new EAS
    build is needed.
  - `services/http.ts`: export `refreshSession(): Promise<AuthTokens>`.
    - It reads `getTokens()`. With no refresh token it throws
      `ApiError({ code: 'AUTH_TOKEN_MISSING', statusCode: 401 })` and calls
      the unauthorized handler.
    - Otherwise it returns `refreshTokens(refreshToken)`, the existing
      single-flight path, so a socket refresh and an HTTP 401 refresh share
      one request.
    - A dead refresh (401 or 403) already clears tokens and calls the
      unauthorized handler, which signs out. That stays as is.
  - `services/realtime/socketOrigin.ts`: `socketOrigin(apiUrl)` returns the
    scheme and host (`http://10.0.2.2:3000/api/v1` -> `http://10.0.2.2:3000`)
    with a regex. Don't use `URL.origin`, which React Native doesn't implement.
    The socket URL is `${socketOrigin(config.apiUrl)}/realtime`.
  - `services/realtime/policy.ts`, all pure:
    - `connectErrorAction(code)` returns `'refresh-then-retry'` for
      `AUTH_TOKEN_MISSING`, `AUTH_TOKEN_INVALID` and `AUTH_TOKEN_EXPIRED`;
      `'sign-out'` for `AUTH_SESSION_REVOKED`, `ACCOUNT_SUSPENDED`,
      `ACCOUNT_DEACTIVATED` and `ACCOUNT_PENDING_VERIFICATION`; and
      `'retry'` for `INTERNAL_ERROR` or any other code.
    - `backoffDelay(attempt, random)`: base 1000 ms doubling, capped at
      30 000 ms, multiplied by a jitter in [0.5, 1.5) from `random()`, then
      capped at 30 000 again.
    - `serverDisconnectAction(refreshOutcome)`: `'reconnect'` after a
      successful refresh; `'sign-out'` when the refresh failed with 401 or
      403, or with any sign-out code; `'retry'` on a network or other error.
  - **Done when** `socketOrigin.test.ts` and `policy.test.ts` cover every code
    in both tables, the backoff curve (1 s, 2 s, 4 s, ... capped at 30 s, with
    jitter bounds), and https or ports in the origin. An `http.test.ts` case
    proves concurrent `refreshSession()` calls and a 401 retry make one
    `/auth/refresh` request. `npm run test` is green.

- [x] **2. The `notificationsLive` slice**
  - `slices/notificationsLive.slice.ts`. State:
    - `incoming: NotificationItem[]`, newest first, capped at 50.
    - `read: ReadState`, reusing `scenes/notifications/utils/readState.ts`.
    - `resyncCount: number`.
    - `banner: NotificationItem | null`.
    - `connected: boolean`.
  - Reducers:
    - `notificationReceived(item)`: ignored if its id is already in
      `incoming`. Otherwise it is prepended, and it becomes `banner` when
      `urgency === 'high'`.
    - `notificationsReadReceived({ ids?, all?, before? })`: `ids` go into
      `read.readIds` with the receipt time; `all` with `before` goes through
      `withAllRead`. Unknown ids are harmless.
    - `markedReadLocally(id)` and `markReadReverted(id)`, used by the banner
      tap.
    - `resyncRequested()` increments `resyncCount`.
    - `bannerDismissed()` and `showBanner(item)`.
    - `connectionChanged(connected)`.
    - `reset()`.
  - Register it in `utils/store.ts` and `slices/index.ts`, with a
    `useNotificationsLiveSlice` hook. Add `reset()` to `clearSessionState` in
    `slices/auth.slice.ts`.
  - **Done when** `notificationsLive.slice.test.ts` covers:
    - dedupe by id, including that a duplicate never re-shows the banner
    - the banner only for high urgency
    - the 50 cap
    - ids and all/before read events, plus an unknown id
    - resync increments
    - `reset` on `clearSessionState`

    `npm run test` is green.

- [x] **3. Socket manager**
  - `services/realtime/notificationsSocket.ts`:
    `createNotificationsSocket(deps)`. Its dependencies are injected for
    tests:
    - `io`
    - `url`
    - `getToken` (`peekAccessToken`)
    - `lang`
    - `refreshSession`
    - `random`, `setTimeout`, `clearTimeout`
    - the callbacks `onNew`, `onUnreadCount`, `onRead`, `onResync`,
      `onConnectionChange` and `onSignOut`
  - It returns `{ start(), stop() }` and holds one socket for its lifetime.
  - Socket options:
    - `transports: ['websocket']`
    - `auth: cb => cb({ token: getToken(), lang })`, a function, so every
      (re)connect sends the current token
    - `autoConnect: false`
    - built-in reconnection on, with `reconnectionDelay: 1000`,
      `reconnectionDelayMax: 30000` and `randomizationFactor: 0.5`
  - `start()` calls `socket.connect()` unless the socket is already connected
    or connecting. `stop()` cancels any retry timer, calls
    `socket.disconnect()`, and reports `onConnectionChange(false)`.
  - Events:
    - `connect`: reset the backoff attempt, `onConnectionChange(true)`,
      `onResync()` (refetch `NT2`, and page 1 if open).
    - `notification:new`: `onNew`.
    - `notification:unread_count`: `onUnreadCount(count)`.
    - `notification:read`: `onRead(payload)`.
    - `realtime:resync`: `onResync()`.
    - `auth:expiring`: `await refreshSession()`, then
      `emit('auth:refresh', { token }, ack)`. If the ack is not `ok`,
      disconnect then `connect()`; the auth callback picks up the new token.
      This is not a sign-out. If the refresh itself fails, do nothing: the
      server closes the socket and the server-disconnect path takes over.
  - `connect_error`: read the code from `err.data?.code ?? err.message`.
    - When the server refused the handshake (`socket.active === false`), run
      `connectErrorAction`:
      - `sign-out` calls `onSignOut()`.
      - `refresh-then-retry` calls `refreshSession()`, then schedules
        `connect()` after `backoffDelay(attempt++)`. A failed refresh
        follows `serverDisconnectAction`.
      - `retry` schedules `connect()` after the backoff.
    - When `socket.active` is true (a transport or network error), leave it
      to the built-in reconnection.
  - `disconnect` with reason `io server disconnect`: `onConnectionChange(false)`,
    then refresh and apply `serverDisconnectAction`. That gives `reconnect`
    (`connect()` now), `sign-out`, or `retry` (backoff). Other reasons only
    report `onConnectionChange(false)`. `io client disconnect` (our own
    `stop()`) never triggers this path.
  - Only one retry timer at a time, and no new socket per retry.
  - **Done when** `notificationsSocket.test.ts` drives a fake socket (an
    event emitter with `connect` / `disconnect` / `emit` / `active` /
    `connected`) and covers:
    - options and auth payload
    - every event forwarded
    - `auth:expiring` -> one `refreshSession` -> `auth:refresh` with the new
      token; a not-ok ack reconnects without signing out
    - each `connect_error` row
    - backoff timing with fake timers
    - `io server disconnect`: reconnect, sign out, retry
    - `io client disconnect` is ignored
    - `stop()` cancels a pending retry

    `npm run test` is green.

- [x] **4. Lifecycle and badge**
  - `hooks/useRealtimeNotifications.ts`, mounted once in `Router` in
    `app/_layout.tsx`:
    - It creates the manager once (a ref) with `io` from `socket.io-client`,
      the URL from `socketOrigin(config.apiUrl)`, `peekAccessToken`,
      `APP_LANGUAGE`, and `refreshSession`.
    - Its callbacks dispatch:
      - `onNew` -> `notificationReceived`.
      - `onUnreadCount` -> `notificationsApi.util.upsertQueryData('getUnreadCount', undefined, { count })`.
      - `onRead` -> `notificationsReadReceived`.
      - `onResync` -> `notificationsApi.util.invalidateTags(['UnreadCount'])`
        plus `resyncRequested()`.
      - `onConnectionChange` -> `connectionChanged`.
      - `onSignOut` -> `signOut()`.
    - It wants a connection when `status === 'authenticated'` and `AppState`
      is `active`. Changes in that wish are debounced 1 000 ms, so an
      active/background flap opens no new connection. Then it calls
      `start()` or `stop()`.
    - Sign-out drops the wish at once, with no debounce. `stop()` also runs on
      unmount.
  - `hooks/useUnreadCount.ts`: `pollingInterval` is 60 000 ms only while
    active and `connected` is false. The refetch on return to `active` stays.
  - **Done when** `useRealtimeNotifications.test.tsx` (manager mocked, fake
    timers, mocked `AppState`) covers:
    - connect once after authenticated + active plus 1 s
    - no connect when signed out
    - background then active within 1 s opens no new connection
    - background past 1 s stops
    - sign-out stops immediately
    - each callback dispatches its action

    `useUnreadCount.test.tsx` adds the case where the socket is connected and
    there is no polling. `npm run test` is green.

- [x] **5. Live list on the notifications screen**
  - `scenes/notifications/Notifications.tsx`:
    - Items are `applyReadState(applyReadState(mergeIncoming(feed.items, live.incoming), live.read), readState)`.
    - `mergeIncoming` lives in `scenes/notifications/utils/readState.ts` or a
      sibling. For the Unread tab it takes incoming items with
      `readAt === null`. It drops ids already in the feed and puts the rest
      first, newest first.
    - When `live.resyncCount` changes while the screen is mounted, call
      `feed.refresh()`. Ignore the value at mount.
    - The Mark all `before` keeps using the newest `createdAt` on screen, so
      it now includes socket items.
  - **Done when**:
    - `readState.test.ts` covers `mergeIncoming`: dedupe against pages, the
      Unread filter, and order.
    - `Notifications.test.tsx` covers:
      - a dispatched `notificationReceived` appears at the top
      - a dispatched `notificationsReadReceived` clears its unread mark
      - `resyncRequested` refetches page 1 without `before`

    `npm run test` is green.

- [x] **6. In-app banner**
  - `components/elements/InAppBanner/`, presentational, with an `index.ts` and
    a test.
    - Props: `title`, `body`, `onPress`, `onDismiss`.
    - It shows a card at the top of the screen with the bell icon, the title,
      and one line of the body (plain `<Text>`).
    - It has a close button labelled "Dismiss notification".
    - It has `accessibilityRole="button"`, and
      `accessibilityLiveRegion="polite"` on Android. On iOS it calls
      `AccessibilityInfo.announceForAccessibility(title)` on show.
    - It uses theme tokens only and works in light and dark.
  - `components/layouts/NotificationBannerHost.tsx`, mounted in `Router` above
    the `Stack` and inside the safe area:
    - It renders `live.banner` and auto-dismisses after 6 s. A new banner
      restarts the timer; the latest wins.
    - A tap dismisses, dispatches `markedReadLocally(id)`, and calls `NT3`,
      reverting with `markReadReverted(id)` on failure (silent, `404`
      included). It then runs `openNotification(item, { status, markRead: () => {} })`,
      because the read is already handled. That reuses 38a's route map and the
      held-route rule.
    - It renders nothing while signed out.
  - **Done when**:
    - `InAppBanner.test.tsx` covers the content, a press, dismiss, and the
      accessibility label.
    - `NotificationBannerHost.test.tsx` (fake timers, mocked router) covers:
      - a high item shows
      - a normal item shows nothing
      - an auto-dismiss after 6 s
      - a tap that marks read, calls `NT3`, and pushes the mapped route
      - a failed `NT3` that reverts the read mark

    `npm run test` and `npm run lint` are green.

## Files / areas

- New:
  - `services/realtime/socketOrigin.ts`, `policy.ts` and
    `notificationsSocket.ts`, each with tests
  - `slices/notificationsLive.slice.ts` and its test
  - `hooks/useRealtimeNotifications.ts` and its test
  - `components/elements/InAppBanner/`
  - `components/layouts/NotificationBannerHost.tsx` and its test
- Changed:
  - `package.json` and the lockfile (`socket.io-client`)
  - `services/http.ts` and `http.test.ts`
  - `utils/store.ts`, `slices/index.ts`, `slices/auth.slice.ts`
  - `hooks/index.ts`, `hooks/useUnreadCount.ts` and its test
  - `app/_layout.tsx`
  - `scenes/notifications/Notifications.tsx` and its test,
    `scenes/notifications/utils/readState.ts` and its test

## Data / contracts

Sources: `../backend/docs/features/notifications/API_ENDPOINTS_LIST.md` §2,
`ARCHITECTURE.md` §8, `CLIENT_INTEGRATION.md` §6, and
`../backend/src/realtime/realtime.gateway.ts` / `socket-auth.ts`. Backend
24d1-24d3 is built on backend `feat/notifications`.

- **Connect.** URL `${origin}/realtime`. `auth: { token: <access token>, lang }`.
  The token is accepted only in `auth`; a query string is ignored.
  `transports: ['websocket']`.
- **Server.** On a valid handshake the server joins `user:{id}` and
  `session:{sessionId}`. It emits `auth:expiring` about 60 s (±20 s) before
  the access token's `exp`. Without a valid `auth:refresh`, it disconnects
  30 s after `exp`.
- **Events, server to client.**
  - `notification:new`: an `NT1` feed item.
  - `notification:unread_count`: `{ count }`. Always overwrite; never
    increment locally.
  - `notification:read`: `{ ids?: string[]; all?: boolean; before?: string }`.
  - `realtime:resync`: `{}`.
  - `auth:expiring`: `{ expiresAt }`.
- **Events, client to server.** `auth:refresh { token }` with ack
  `{ ok: true } | { ok: false; code: string }`. It is the only client event.
- **`connect_error`.** The code is in `err.data.code`, and also in
  `err.message`.
- **Forced disconnects** (24d3). A revoked session, revoke-all (including
  refresh-reuse detection), or a suspended, deactivated or deleted account
  closes the socket with reason `io server disconnect`. Socket.io does not
  reconnect by itself after that.
- **Events are not replayed.** After every connect, refetch `NT2`; REST is the
  source of truth.
- **Refresh token.** It is single-use, and reusing one revokes every session.
  The socket must use `refreshSession()`, never its own `/auth/refresh` call.

## Testing

`npm run test` is the gate for every step; `npm run lint` and
`npx tsc --noEmit` before review. No combined Verify command exists.
`tsc` already reports two `isOnboardingComplete` errors in
`services/authApi.test.ts` and `slices/auth.slice.test.ts`; don't add new
ones. Last observed: all 194 suites and 1,239 tests passed on `0f3af65`
(pre-commit hook, 38a merge).

Predicted tests:

- socketOrigin, policy, `http` `refreshSession`
- the notificationsLive slice
- notificationsSocket, with a fake socket
- useRealtimeNotifications, useUnreadCount
- readState `mergeIncoming`, the Notifications screen live cases
- InAppBanner, NotificationBannerHost

No test opens a real socket.

Check by hand against the local backend on `feat/notifications`:

- a notification raised from the web app appears live, with the badge
- a high one shows the banner and opens its target
- reading on another device clears it here
- token expiry after 15 minutes refreshes without a sign-out
- logging out elsewhere or a suspension signs out
- airplane mode on and off reconnects without a storm

## Notes for the AI

- Socket.io v4: after a middleware rejection (`connect_error` with
  `socket.active === false`), the client does **not** retry. Only transport
  failures auto-reconnect. That is why the manager schedules its own retries
  for handshake codes.
- Keep the manager free of React and Redux: inject everything so it is
  testable with a fake socket. The hook is the only glue.
- `refreshSession()` must go through the existing `refreshTokens()`
  single-flight. Never call `/auth/refresh` from realtime code.
- The live slice reuses 38a's `ReadState` helpers. The screen layers
  live read state under its own optimistic overlay.
- Don't increment the badge on `notification:new`; the server sends
  `notification:unread_count`.
- The banner's `showBanner` action is the entry point 38e will reuse for
  foreground pushes when the socket is down.
- Order on logout: `signOut` clears state first, then the hook's effect stops
  the socket. The server also closes it on logout, so a brief overlap is
  harmless. Do not import realtime code into `auth.slice.ts`.
