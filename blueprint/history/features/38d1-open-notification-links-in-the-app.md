# Current Feature

**Feature:** 38d1. Open notification links in the app
**Branch:** feature/open-notification-links-in-the-app
**Status:** verified
**Base:** `feat/notifications` HEAD (`adfce7f`, which has 38a-38c), plus the
uncommitted plan update that split 38d (build-plan, project-plan §8,
overview). Commit that update with this feature, or before it.

## Goal

A notification link opens the right screen and marks that notification read,
however it arrives:

- an email button through `influsis://`
- the web build on `app.influsis.com`
- (later) a universal link or a push tap

A link that arrives before the session is restored, or while signed out, is
kept and opened after sign-in instead of being lost on the onboarding
redirect.

## In scope

- `?n={id}` on any route: once signed in, call `NT3` for that id, mark it
  read locally, and drop `n` from the URL. A `404` is ignored silently.
- Incoming links that arrive while signed out, or whose session restore ends
  signed out, are held with 38a's `holdNotificationRoute`. The
  `(main)` layout opens them after sign-in.
- Only notification paths are held: the 38a route table plus
  `/notifications` (digest) and `/notification-settings` (manage).
- It works for the cold-start URL and for warm-start `url` events, and on the
  web build through its initial URL.

## Out of scope

- `associatedDomains`, `intentFilters`, AASA and `assetlinks.json`: those are
  38d2, which needs the Apple Team ID, the signing fingerprints and a new
  native build.
- Push taps (38e). They will reuse the same held-route and `?n=`-free
  `openNotification` path.
- Any change to the backend link format.

## Build loop

`workflow.stepReview` is `feature`: build all steps, keeping `npm run test`
green after each, then present one review packet. `workflow.checkpointCommits`
is `disabled`. `/complete` makes the feature commit.

## Build steps

- [x] **1. Parse incoming links**
  - `lib/notifications/linkPath.ts`: `notificationLinkPath(url)` returns the
    app path with its query (`/engagement/e-1?n=abc`), or `null` when the
    path is not a notification path. It is pure, with no `URL` (React
    Native doesn't implement it fully). It handles:
    - `https://app.influsis.com/engagement/e-1?n=abc`
    - `influsis://engagement/e-1?n=abc`. The custom-scheme host is the first
      path segment, the way Expo Router reads it.
    - the dev client's `exp://host:8081/--/engagement/e-1?n=abc`: everything
      after `/--`
    - a trailing slash and a `#fragment`, both dropped
  - Notification paths:
    - `/engagement/{id}`, `/engagement/{id}/submit-delivery`,
      `/engagement/{id}/review`
    - `/campaign/{id}`
    - `/my-profile`
    - `/notifications`
    - `/notification-settings`

    Anything else (the root, auth, onboarding, other screens) gives `null`.
  - `readParam(url)` returns the `n` value of a path or URL, or `null`.
  - **Done when** `linkPath.test.ts` covers each URL form above, every
    notification path, non-notification paths, the query kept intact, and a
    missing or empty `n`. `npm run test` is green.

- [x] **2. Hold links that arrive signed out**
  - `hooks/useIncomingNotificationLinks.ts`, mounted in `Router` in
    `app/_layout.tsx`:
    - It reads the cold-start URL once (`Linking.getInitialURL()` from
      `expo-linking`), and every warm-start `url` event
      (`Linking.addEventListener('url', ...)`).
    - Each one that passes `notificationLinkPath` becomes a `pending` path in
      a ref; the latest wins.
    - When the auth status is, or becomes, `unauthenticated` while a path is
      pending: `holdNotificationRoute(path)` and clear it.
    - When the status is `authenticated`: clear it without holding. Expo
      Router has already opened that path.
    - While `restoring`, wait.
    - The `(main)` layout's existing flush opens the held path after sign-in.
      The `?n=` it carries is handled by step 3.
  - **Done when** `useIncomingNotificationLinks.test.tsx` (mocked
    `expo-linking`, auth slice in a test store) covers:
    - a cold-start link while signed out is held
    - a cold-start link while restoring, then authenticated, is not held
    - while restoring, then unauthenticated, it is held
    - a warm-start link while signed in is not held
    - a non-notification link is never held
    - two links while signed out keep the latest

    `npm run test` is green.

- [x] **3. Read `?n={id}` on any screen**
  - `hooks/useNotificationReadParam.ts`, mounted in `Router`:
    - It reads `n` from `useGlobalSearchParams()`, and acts only when the
      status is `authenticated` and `n` is a non-empty string the hook hasn't
      already handled (a ref of ids).
    - It dispatches `markedReadLocally(n)` (the 38b live slice, so an open
      feed shows it read) and calls `markNotificationRead({ id: n })`.
    - On any error it dispatches `markReadReverted(n)`. There's never an
      alert; a `404` (another account's link, or a deleted notification) is
      expected.
    - Then it calls `router.setParams({ n: undefined })` to drop the param.
      **Checked:** Expo Router builds the query with `query-string`, which
      leaves out `undefined` values (`fork/getPathFromState.js`), so this
      removes `n`. The fallback isn't needed.
  - **Done when** `useNotificationReadParam.test.tsx` (mocked `expo-router`
    hooks, mocked HTTP) covers:
    - signed in with `n` -> one `PATCH /notifications/{n}/read`, then
      `setParams({ n: undefined })`
    - the same `n` again -> no second call
    - `restoring` -> nothing until `authenticated`
    - a `404` reverts the local mark with no alert
    - no `n` -> nothing

    `npm run test` and `npm run lint` are green.

## Files / areas

- New:
  - `lib/notifications/linkPath.ts` and its test
  - `hooks/useIncomingNotificationLinks.ts` and its test
  - `hooks/useNotificationReadParam.ts` and its test
- Changed:
  - `app/_layout.tsx` (mount the two hooks)
- Already there:
  - `lib/notifications/pendingRoute.ts`, and the `(main)` layout flush (38a)
  - `slices/notificationsLive.slice.ts` (38b)
  - `services/notificationsApi.ts` (`markNotificationRead`)

## Data / contracts

Sources: backend `CLIENT_INTEGRATION.md` §4 and §6 (`?n={id}`),
`EMAIL_TEMPLATES.md` (creator links),
`../backend/src/notifications/links/notification-links.ts`.

- **Email link.** `${CREATOR_APP_LINK_URL}${path}?n={notificationId}`, or
  `&n=` when the path already has a query. Production is
  `https://app.influsis.com` (decided 2026-10-19).
- **Paths.** The 38a route table (`routeFor`), plus `/notifications`
  (digest, "and N more") and `/notification-settings` (manage). Path
  segments are `encodeURIComponent`'d ids.
- **NT3** `PATCH /notifications/:id/read` is idempotent. It answers `404` for
  another account's id or a malformed one, and for a notification deleted by
  retention (read ones after 180 days, unread after 365). Ignore it silently.
- **Held route.** It is in memory only, the last one wins, and it is not
  cleared on sign-out. If a different user signs in, the `NT3` `404` is
  ignored and the target screen handles its own `404` with "This item is no
  longer available".

## Testing

`npm run test` is the gate for every step; `npm run lint` and
`npx tsc --noEmit` before review. No combined Verify command exists. `tsc`
already reports two `isOnboardingComplete` errors in `services/authApi.test.ts`
and `slices/auth.slice.test.ts`; don't add new ones. Last observed: all 204
suites and 1,349 tests passed on `adfce7f` (pre-commit hook, 38c merge).

Predicted tests: linkPath, useIncomingNotificationLinks, and
useNotificationReadParam.

Check by hand:

- `npx uri-scheme open "influsis://engagement/<id>?n=<id>" --ios` (and
  `--android`), with the app killed, in the background, and signed out
- on the web build: open `/engagement/<id>?n=<id>`

The notification turns read (badge, feed) and `n` disappears from the URL.

## Notes for the AI

- Expo Router already opens the incoming path. These hooks only cover what
  it doesn't: marking read, cleaning the URL, and keeping the path across the
  signed-out redirect.
- Holding only notification paths stops an ordinary sign-out on, say,
  `/order/1` from reopening it for the next user.
- Keep both hooks out of the `@/hooks` barrel (as with
  `useRealtimeNotifications`). They pull in routing, linking and the
  notifications API.
