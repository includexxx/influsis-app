# Current Feature

**Feature:** 38e1. Push setup and device registration (backend 24g `NT7`, `NT8`, FCM)
**Branch:** feature/push-setup-and-device-registration
**Status:** verified
**Base:** `feat/notifications` HEAD (`b4d8223`, which has 38a-38d1), plus the
uncommitted plan update that split 38e (build-plan, overview). Commit that
update with this feature.

## Goal

Set the app up for push so that a creator who agrees gets their device
registered with the backend, and a signed-out device stops getting pushes.

- **Permission:** asked through an in-app explainer at a moment that shows
  its value, never on first launch.
- **Registration:** after every sign-in, at most daily otherwise, and on every
  token refresh.
- **Builds:** keep working while the Firebase projects don't exist yet.
- **Out of scope here:** receiving pushes and the settings switch (38e2,
  38e3).

## In scope

- New dependencies (authorized by build-plan 38e / 38e1):
  - `@react-native-firebase/app` and `@react-native-firebase/messaging`
  - `expo-build-properties`, for `ios.useFrameworks: 'static'`, which React
    Native Firebase needs on Expo
  - `expo-notifications`, used **only** to create the Android channels
    (decision 2026-10-19)
- `app.config.ts` adds the Firebase files and plugins only when the EAS file
  env vars `GOOGLE_SERVICES_JSON` / `GOOGLE_SERVICE_INFO_PLIST` are set
  (decision 2026-10-19). It exposes `extra.pushEnabled`.
- `plugins/withPushAndroid.js` does two things:
  - writes the monochrome `ic_notification` vector drawable
  - removes `expo-notifications`' own `FirebaseMessagingService` from the
    merged Android manifest, so React Native Firebase's service receives
    messages
- The Android channels `high_priority` and `updates` are created at app
  start.
- A safe push module: no native module, no Firebase app, or web means push is
  "unavailable", never a crash.
- `NT7` / `NT8` endpoints.
- A `push` slice holding `permission`, `availability` and `deviceId`.
- Registration:
  - forced after every sign-in
  - throttled to once a day per user on start
  - on `onTokenRefresh`
  - on permission granted
- The permission explainer, shown once per device after the first:
  - invitation (`engagement.invited` live)
  - join request (`applyToCampaign` succeeds)
  - accepted engagement (`acceptOffer` / `acceptMyEngagement` succeed, or
    `engagement.accepted` live)

  It reports "Push unavailable on this device" when `getToken()` fails.
- Logout runs a best-effort `NT8` (`404` = success, 2 s cap) and
  `deleteToken()` before `signOut()`.

## Out of scope

- `onMessage`, notification taps, `getInitialNotification`, `kind: 'batch'`,
  and the iOS badge (38e2).
- The "Push on this device" switch, Push toggles, and the OS-settings link
  (38e3).
- Creating the Firebase projects, the APNs key, or EAS secrets (backend P4,
  ops).
- The `ic_notification` artwork: a bell vector stands in (see Open
  questions).

## Build loop

`workflow.stepReview` is `feature`: build all steps, keeping `npm run test`
green after each, then present one review packet. `workflow.checkpointCommits`
is `disabled`. `/complete` makes the feature commit.

## Build steps

- [x] **1. Dependencies and conditional native config**
  - Install the dependencies:
    - `npx expo install expo-notifications expo-build-properties`, so the
      versions match SDK 54
    - `npm install @react-native-firebase/app @react-native-firebase/messaging`
      on the current major that supports React Native 0.81 and the New
      Architecture. Check its peer requirements.

    Check that only `package.json` and the lockfile change.
  - `plugins/firebaseConfig.js` (CommonJS, so `app.config.ts` can require
    it): `pushConfig(env)` takes `process.env`-like input.
    - With both `GOOGLE_SERVICES_JSON` and `GOOGLE_SERVICE_INFO_PLIST` set, it
      returns:
      - `{ androidGoogleServicesFile, iosGoogleServicesFile }`
      - the plugins `'@react-native-firebase/app'`,
        `'@react-native-firebase/messaging'`,
        `['expo-build-properties', { ios: { useFrameworks: 'static' } }]` and
        `'./plugins/withPushAndroid'`
      - `pushEnabled: true`
    - Otherwise it returns no files, no plugins, and `pushEnabled: false`.
    - Only one of the two set is treated as unset, with a build-time warning.
  - `app.config.ts`:
    - It spreads those plugins after the existing ones and sets
      `android.googleServicesFile` / `ios.googleServicesFile` when present.
    - It adds `extra.pushEnabled`.
    - Today's builds are unchanged when the env vars are absent.
  - `plugins/withPushAndroid.js`:
    - `withDangerousMod` writes `android/app/src/main/res/drawable/ic_notification.xml`,
      a white Material "notifications" bell vector, 24 dp.
    - `withAndroidManifest` adds
      `<service android:name="expo.modules.notifications.service.ExpoFirebaseMessagingService" tools:node="remove" />`
      (with `xmlns:tools`), so only React Native Firebase's messaging service
      handles FCM.
    - Export the two text and manifest transforms as pure functions.
  - **Done when** `plugins/firebaseConfig.test.js` covers both env vars set,
    neither set, and one set; and `plugins/withPushAndroid.test.js` covers the
    drawable XML content and the manifest transform (adds the remove-node
    once, keeps existing services, idempotent). `npm run test` is green.
    **Check:** `npx expo config --type public` without the env vars shows no
    Firebase plugins. With dummy paths, `npx expo prebuild --no-install
    --platform android` in a scratch copy shows the drawable and the
    manifest remove-node. Record the outcome; skip prebuild if it would touch
    tracked files.

- [x] **2. Push module, channels, API, and state**
  - `services/push/messaging.ts`: `getMessaging()` returns the
    `@react-native-firebase/messaging` instance or `null`. It returns `null`
    on web, when `Constants.expoConfig?.extra?.pushEnabled !== true`, or when
    the require or Firebase app init throws (Expo Go, a build without the
    plugins). It caches the result. Everything else goes through it.
  - `services/push/channels.ts`: on Android, `createPushChannels()` calls
    `Notifications.setNotificationChannelAsync` for:

    | Id | Name | Importance | Sound | Vibration | Lock screen |
    | --- | --- | --- | --- | --- | --- |
    | `high_priority` | "Important updates" | `HIGH` | `default` | on | private |
    | `updates` | "Other updates" | `DEFAULT` | none | none | private |

    Elsewhere it is a no-op. Errors are swallowed. Call it once at start from
    `app/_layout.tsx`, before any push can arrive.
  - `services/notificationsApi.ts`:
    - `registerPushDevice` (`POST /notifications/push-devices`
      `{ token, platform }`) returns `{ id, platform, createdAt }`.
    - `deletePushDevice` (`DELETE /notifications/push-devices/:id`, id
      encoded).
    - Both are added to the `accountStateSignOut` matcher.
  - `slices/push.slice.ts`:
    - `permission`: `'unknown' | 'granted' | 'provisional' | 'denied' | 'blocked'`.
    - `availability`: `'unknown' | 'available' | 'unavailable'`.
    - `deviceId: string | null`.
    - `promptVisible: boolean`.
    - It is reset in `clearSessionState`. `availability` is per device, so it
      is kept across a reset.
    - Register it in `utils/store.ts` and `slices/index.ts`.
  - Add `PUSH_DEVICE` and `PUSH_PROMPT_SHOWN` to `DataPersistKeys`:
    - `PUSH_DEVICE`: `{ deviceId, userId, registeredAt }`.
    - `PUSH_PROMPT_SHOWN`: `true`.
    - Both are wiped by `signOut`, so the next creator on the device gets
      their own prompt.
  - **Done when** these pass, and `npm run test` is green:
    - `messaging.test.ts` (mocked module) covers `null` on web, `null` when
      `pushEnabled` is false, `null` when the require throws, and the
      instance otherwise.
    - `channels.test.ts` covers both channels with their exact ids and
      importance on Android, and nothing on iOS.
    - `notificationsApi.test.ts` covers the two endpoints.
    - `push.slice.test.ts` covers the reducers and the reset.

- [x] **3. Registration and logout cleanup**
  - `services/push/registration.ts`. Its dependencies are injected for tests:
    messaging, platform, `now`, persistence, and dispatch with the API.
    - `ensurePermissionState()` reads `messaging.hasPermission()` (iOS:
      authorized / provisional / denied / not-determined). On Android 13+ it
      also reads `PermissionsAndroid.check(POST_NOTIFICATIONS)`. It
      dispatches the `permission`.
    - `registerDevice({ force })` returns
      `'registered' | 'skipped' | 'no-permission' | 'unavailable'`:
      - It does nothing when messaging is `null` (availability
        `unavailable`) or the permission isn't granted or provisional.
      - Unless `force`, it skips when `PUSH_DEVICE` has the same `userId` and
        `registeredAt` is under 24 h old.
      - Otherwise `getToken()`. A failure gives availability `unavailable`
        and returns `'unavailable'`, with no retry.
      - Then `NT7 { token, platform: 'ios' | 'android' }`, which stores
        `{ deviceId, userId, registeredAt }` and dispatches `deviceId`. A
        failing `NT7` is logged nowhere and retried at the next trigger.
    - `unregisterDevice({ timeoutMs = 2000 })` sends `NT8` for the stored
      `deviceId`. `404` counts as success, any error or the timeout is
      ignored, and it never throws. Then `messaging.deleteToken()` (errors
      ignored), then it clears `PUSH_DEVICE`.
  - `services/push/pushListener.ts`, a listener middleware registered in
    `utils/store.ts`:
    - `sessionEstablished` -> `registerDevice({ force: true })`. Every
      sign-in is a new backend session the device must be bound to.
    - `restoreSession.fulfilled` with an account -> `registerDevice({ force: false })`.
  - `onTokenRefresh` is subscribed once at start (in `app/_layout.tsx`, when
    messaging exists) -> `registerDevice({ force: true })` while signed in.
    A token refresh needs no `NT7`, since the server moves the device on
    refresh-token rotation.
  - `scenes/profile/Profile.tsx` `handleLogout`:
    `await unregisterDevice()` (at most 2 s, while the logout dialog shows a
    busy state), then the existing `signOut()`, `clearDeviceCaches()`, and
    `router.replace('/auth')`, unchanged. Other sign-out paths (a dead
    session or an account code) don't call it; the server already deleted
    the device.
  - **Done when** these pass, and `npm run test` is green:
    - `registration.test.ts` (fakes, fake timers) covers:
      - no messaging -> `'unavailable'` and no `NT7`
      - no permission -> no `NT7`
      - `force` registers within 24 h; non-`force` skips within 24 h for the
        same user, and registers for another user or after 24 h
      - a `getToken` failure -> `unavailable` and no `NT7`
      - the stored device id
      - `unregisterDevice`: `NT8` `404` -> still `deleteToken` and cleared; a
        hang -> it resolves after 2 s; no stored device -> only
        `deleteToken`
    - `pushListener.test.ts` covers sign-in forcing registration and restore
      not forcing it.
    - `Profile.test.tsx` covers logout calling `unregisterDevice` before
      `signOut`.

- [x] **4. Permission explainer**
  - `components/elements/PushPermissionSheet/` (+ test), presentational, on
    the existing `BottomSheet`:
    - Title "Turn on notifications?".
    - Body "Get a heads-up when a business invites you, replies to your
      request or accepts your offer, even when Influsis is closed."
    - "Turn on" (primary) and "Not now".
    - A `status` prop shows "Push unavailable on this device" or "You can
      turn notifications on later in your phone settings" under the buttons.
  - `services/push/pushPrompt.ts`, a listener middleware. It dispatches
    `promptRequested` on:
    - `applyToCampaign.matchFulfilled`
    - `acceptOffer.matchFulfilled`
    - `acceptMyEngagement.matchFulfilled`
    - `notificationReceived` with `eventType` `engagement.invited` or
      `engagement.accepted`

    It shows the sheet (`promptVisible`) only when all of these hold:
    - messaging exists
    - the permission is `unknown` (not determined)
    - `PUSH_PROMPT_SHOWN` isn't set
    - the creator is signed in

    It sets `PUSH_PROMPT_SHOWN` when it shows.
  - `components/layouts/PushPromptHost.tsx`, mounted in `Router`, renders
    the sheet:
    - **"Turn on":** on iOS, `messaging.requestPermission()`; on Android 13+,
      `PermissionsAndroid.request(POST_NOTIFICATIONS)`. Older Android is
      always granted.
    - Granted or provisional -> `registerDevice({ force: true })`. On
      `'unavailable'` it keeps the sheet open with that status; otherwise it
      closes.
    - Denied (or `never_ask_again`) -> the permission becomes `denied` /
      `blocked`, with the "phone settings" status, then a close.
    - **"Not now"** closes, and the prompt doesn't come back.
  - **Done when** these pass, and `npm run test` and `npm run lint` are
    green:
    - `PushPermissionSheet.test.tsx` covers the copy, both buttons, and the
      status line.
    - `pushPrompt.test.ts` covers each trigger, and no prompt when it was
      already shown, when permission is decided, when messaging is
      unavailable, or when signed out.
    - `PushPromptHost.test.tsx` (mocked messaging and `PermissionsAndroid`)
      covers grant -> `NT7`, denied -> blocked status, unavailable -> the
      status stays open, and Not now.

## Files / areas

- New:
  - `plugins/firebaseConfig.js` and `plugins/withPushAndroid.js`, with tests
  - `services/push/messaging.ts`, `channels.ts`, `registration.ts`,
    `pushListener.ts` and `pushPrompt.ts`, with tests
  - `slices/push.slice.ts` and its test
  - `components/elements/PushPermissionSheet/`
  - `components/layouts/PushPromptHost.tsx` and its test
- Changed:
  - `package.json` and the lockfile
  - `app.config.ts`
  - `app/_layout.tsx` (channels, `onTokenRefresh`, `PushPromptHost`)
  - `services/notificationsApi.ts`, `services/accountStateSignOut.ts`, and
    their tests
  - `utils/store.ts`, `slices/index.ts`, `slices/auth.slice.ts` (reset)
  - `hooks/useDataPersist.ts` (keys)
  - `scenes/profile/Profile.tsx` and `Profile.test.tsx`

## Data / contracts

Sources: `../backend/docs/features/notifications/API_ENDPOINTS_LIST.md`
NT7/NT8, `PUSH_NOTIFICATIONS.md` §4, §8 and §12.1, and build-plan 38e. Built
in backend 24g1 and 24g2, behind `NOTIFICATION_PUSH_ENABLED` (off until P4).

- **NT7** `POST /notifications/push-devices` with
  `{ token: string (20-4096), platform: 'ios' | 'android' | 'web' }` returns
  `{ id, platform, createdAt }`.
  - It is an idempotent upsert bound to the caller's **current session**.
  - The same token from another user or session moves to the caller.
  - Above 10 devices, the oldest is dropped.
  - A malformed token or platform is a `422`.
  - The token is never logged.
- **NT8** `DELETE /notifications/push-devices/:id` returns `null` data.
  - A `404` (not the caller's device, or not a uuid) counts as success here.
  - The server also deletes devices on every sign-out and revoke, and a
    refresh moves them to the new session.
- **Channels.** The backend sets the Android `channelId` to `high_priority`
  or `updates`, `icon: 'ic_notification'`, colour `#e8467c`, and
  `visibility: 'private'`. The ids must match exactly.
- **Firebase files** must belong to the same Firebase project as that
  environment's backend `FIREBASE_PROJECT_ID`.
- **Permission states.**
  - iOS: `authorized`, `provisional` (counts as granted), `denied`, and
    `not-determined` (`unknown`).
  - Android 13+ `POST_NOTIFICATIONS`: `granted`, `denied`, and
    `never_ask_again` (`blocked`).
  - Below Android 13, the permission is granted at install.

## Testing

`npm run test` is the gate for every step; `npm run lint` and
`npx tsc --noEmit` before review. No combined Verify command exists. `tsc`
already reports two `isOnboardingComplete` errors in `services/authApi.test.ts`
and `slices/auth.slice.test.ts`; don't add new ones. Last observed: all 207
suites and 1,391 tests passed on `b4d8223` (pre-commit hook, 38d1 merge).
React Native Firebase, `expo-notifications` and `PermissionsAndroid` are
mocked in every test; nothing native runs in Jest.

Can't be checked yet: a real device registration needs the Firebase projects
(P4), EAS file secrets, and a new EAS development build. Until then, check by
hand that:

- `npm run dev:build:mobile` still builds without the env vars
- the app starts in a build without push, and nothing prompts

## Notes for the AI

- The guard for builds without Firebase is `services/push/messaging.ts`.
  Every push call goes through it, and it must never throw.
- `expo-notifications` is only for `setNotificationChannelAsync`. Don't use
  its push tokens, listeners or permission APIs, and don't add its config
  plugin. Its Android FCM service is removed by `withPushAndroid`.
- Registration is keyed by user, not session id: sign-in (a new session)
  always forces, and a restore reuses the session, so the 24 h throttle is
  safe.
- Keep `signOut()`'s synchronous contract; push cleanup happens in Profile's
  handler before it.
- Never log the FCM token.

## Open questions

- **iOS risk with `expo-notifications` (decision 2026-10-19).** On iOS it
  takes over the `UNUserNotificationCenter` delegate, which can stop React
  Native Firebase's tap handlers (`onNotificationOpenedApp`,
  `getInitialNotification`) from firing. 38e1 doesn't depend on taps, so
  this must be verified on a device at the start of 38e2. If it conflicts,
  38e2 has to work around it or replace channel creation with a small custom
  config plugin.
- **`ic_notification` artwork.** A Material bell vector stands in. A
  monochrome Influsis mark from design would replace it.
