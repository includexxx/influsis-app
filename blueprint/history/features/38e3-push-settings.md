# Current Feature

**Feature:** 38e3. Push settings (backend 24g1 `NT5`-`NT8`)
**Branch:** feature/push-settings
**Status:** verified
**Base:** `feat/notifications` HEAD (`0eb4a03`, which has 38a-38e1).

## Goal

On the Notification settings screen, a creator can:

- turn push on or off for **this device**
- see why it can't be on (the OS blocked it, or push is unavailable here),
  with a way to the phone settings
- choose per category which optional pushes they get, next to the existing
  Email toggles

Turning push off on a device stays off: across restarts and across signing
out and back in.

## In scope

- **A per-user device opt-out.** "Off" sends `NT8` + `deleteToken()` and
  remembers the choice. Registration then skips this user on this device
  until they switch it back on. The choice survives sign-out.
- **The device id after a restart.** The once-a-day skip path loads the
  stored device id into the slice, so the switch reads correctly after a
  restart.
- **Channel-agnostic preferences.** The 38c email preference logic is
  generalized to a `channel` (`email` | `push`) and reused for one **Push**
  toggle per category (`NT5` / `NT6` `push`).
- **A "Push" section** on `NotificationSettings`:
  - the "Push on this device" switch
  - its states: on, off, busy, "Turned off in your phone settings" with an
    "Open settings" link, and "Push unavailable on this device"
  - the Push category toggles, with the locked-events note
  - the permission re-read when the app comes back to the foreground
- **NT5 is always fetched now.** The no-verified-email notice replaces only the
  Email toggles; the Push section still shows.
- The Profile row's subtitle becomes "Email and push".

## Out of scope

- Receiving pushes, taps, and the badge (38e2).
- Web push. On the web, the device switch shows "Push unavailable on this
  device"; the account-wide Push toggles still show.
- Any change to the permission explainer (38e1).

## Build loop

`workflow.stepReview` is `feature`: build all steps, keeping `npm run test`
green after each, then present one review packet. `workflow.checkpointCommits`
is `disabled`. `/complete` makes the feature commit.

## Build steps

- [x] **1. Device opt-out and device-id hydration**
  - Add `PUSH_DEVICE_OFF` to `DataPersistKeys`. It holds a JSON array of the
    user ids that switched push off on this device.
  - `slices/auth.slice.ts`: `signOut` keeps `PUSH_DEVICE_OFF` when it wipes
    `DataPersistKeys`. Keep a small `KEEP_ON_SIGN_OUT` set beside it, with a
    comment that a creator's "push off on this device" must survive signing
    out. Everything else is still wiped.
  - `services/push/registration.ts`:
    - `PushDeps.storage` gains `isOptedOut(userId)` and
      `setOptedOut(userId, optedOut)`.
    - `registerDevice` returns a new result, `'opted-out'`. It checks after
      `userId` and before the throttle, sends no `NT7`, and also applies to
      `force`, so sign-in respects it.
    - On the throttle skip it dispatches `deviceRegistered(stored.deviceId)`.
  - `services/push/deps.ts` implements the two storage calls on
    `PUSH_DEVICE_OFF`.
  - `services/push/pushThunks.ts`:
    - `enablePushOnDevice()` clears the opt-out for the signed-in user, then
      runs `askPushPermission`'s flow (permission, then a forced
      `registerDevice`). It returns `{ permission, result }`.
    - `disablePushOnDevice()` sets the opt-out, then `unregisterDevice()`.
    - `releasePushDevice` (logout) is unchanged and does **not** set the
      opt-out.
  - **Done when** these pass, and `npm run test` is green:
    - `registration.test.ts`: opted out -> `'opted-out'` with no `NT7`,
      forced or not; another user on the same device still registers; the
      throttle skip dispatches the stored device id.
    - `pushThunks.test.ts` (deps mocked): enable clears the opt-out then
      registers; disable sets it then unregisters.
    - `auth.slice.test.ts`: `signOut` removes every key but
      `PUSH_DEVICE_OFF`.

- [x] **2. Channel-agnostic preference toggles**
  - `scenes/notifications/utils/emailPreferences.ts` becomes
    `channelPreferences.ts`. `channelToggles(prefs, channel)`,
    `channelMap(prefs, channel)` and `diffChannel(desired, confirmed)` keep
    the same rules: `NT5` order, `null` channel skipped, `hasLocked` from that
    channel's `lockedEvents`, and `null` when nothing differs.
  - `hooks/useEmailPreferences.ts` becomes
    `useChannelPreferences({ channel, skip })`:
    - The `NT6` body is `{ [channel]: diff }`.
    - The error copy is "Couldn't save your {email|push} settings. Try
      again."
    - Everything else is unchanged: optimistic, one request at a time, last
      state wins, revert on error, the `422` message.
    - Two instances (email and push) share the `NT5` cache. Each tracks only
      its own channel, and a save on one never reverts the other.
  - Rename the tests to match, and keep all their cases.
  - **Done when** `channelPreferences.test.ts` covers both channels
    (including a category whose `push` is `null` while `email` isn't), and
    `useChannelPreferences.test.tsx` keeps the 38c cases for email. Add for
    push:
    - one toggle sends `{ push: { offer: false } }`
    - email and push saves in flight together each land, and neither undoes
      the other

    `npm run test` is green.

- [x] **3. The Push section on Notification settings**
  - `scenes/notifications/hooks/usePushDeviceSwitch.ts`. It returns:
    - `state`: one of `'on' | 'off' | 'blocked' | 'unavailable'`:
      - `unavailable` when `getPushMessaging()` is `null` or
        `availability === 'unavailable'`
      - `blocked` when the permission is `blocked`, or `denied` on iOS
      - `on` when `deviceId` is set and the permission is granted or
        provisional
      - otherwise `off`
    - `busy`
    - `toggle()`: `enablePushOnDevice` or `disablePushOnDevice`
    - `openSettings()`: `Linking.openSettings()`

    It re-reads the permission (`readPushPermission` through a thunk) on
    mount and on every `AppState` return to `active`. Android `denied`
    (asked once, can ask again) stays `off` and switchable.
  - `scenes/notifications/NotificationSettings.tsx`:
    - **In-app** note: unchanged.
    - **Email** section: the toggles from `useChannelPreferences({ channel: 'email' })`
      when the email is verified; otherwise the existing notice.
    - **Push** section:
      - The "Push on this device" switch row (`accessibilityRole="switch"`,
        disabled while busy).
      - Under it, by state: blocked shows "Turned off in your phone
        settings" with an "Open settings" link; unavailable shows "Push
        unavailable on this device".
      - Then one Push toggle per category from
        `useChannelPreferences({ channel: 'push' })`, with the same labels
        and locked note as Email. Toggle labels are "Push for {label}".
      - Its own `saveError` alert, and the shared loading, error and empty
        states.
    - `NT5` is no longer skipped for an unverified email: the hook's `skip`
      is `false` for both channels.
  - `scenes/profile/Profile.tsx`: the Notifications row's subtitle is
    "Email and push".
  - **Done when** these pass, and `npm run test` and `npm run lint` are
    green:
    - `usePushDeviceSwitch.test.tsx` (store, mocked thunks, `AppState`
      and `Linking`) covers each state, toggle on and off, a permission
      re-read on return to `active`, and `openSettings`.
    - `NotificationSettings.test.tsx` keeps the 38c cases (adjusted for
      `NT5` always being fetched), and covers:
      - the Push toggles render from the `push` block and save
        `{ push: {...} }`
      - the device switch on and off calls the thunks
      - the blocked state shows the settings link
      - unavailable shows its note
      - an unverified email still shows the Push section
    - `Profile.test.tsx` checks the new subtitle.

## Files / areas

- New:
  - `scenes/notifications/utils/channelPreferences.ts` and its test (from
    `emailPreferences`)
  - `scenes/notifications/hooks/useChannelPreferences.ts` and its test (from
    `useEmailPreferences`)
  - `scenes/notifications/hooks/usePushDeviceSwitch.ts` and its test
  - `services/push/pushThunks.test.ts`
- Changed:
  - `hooks/useDataPersist.ts`
  - `slices/auth.slice.ts` and its test
  - `services/push/registration.ts`, `deps.ts` and `pushThunks.ts`, plus
    `registration.test.ts`
  - `scenes/notifications/NotificationSettings.tsx`,
    `notificationSettings.style.ts` and `NotificationSettings.test.tsx`
  - `scenes/profile/Profile.tsx` and `Profile.test.tsx`
- Removed (renamed): `emailPreferences.ts`, `useEmailPreferences.ts` and
  their tests.

## Data / contracts

Sources: `../backend/docs/features/notifications/API_ENDPOINTS_LIST.md` NT5-NT8,
`CLIENT_INTEGRATION.md` §6 (Settings) and `PUSH_NOTIFICATIONS.md` §12.1.

- **NT5 `push` block:** `{ enabled, lockedEvents[], optionalEvents[] } | null`.
  - `enabled` is the **account-wide** preference for the category's optional
    pushes. `lockedEvents` always push.
  - Whether this device gets push is separate: `NT7` / `NT8`.
  - `account.suspended` has no push.
  - Creators get no `campaign` category.
- **NT6** `{ push: Record<category, boolean> }`: partial; a `422` for an
  unknown category, a non-boolean, or an empty channel object. Never send an
  empty `push: {}`.
- **NT7 / NT8:** as in 38e1. `NT8` `404` = success.
- **Device switch:**
  - On -> clear the opt-out, ask the OS (iOS
    `requestPermission`, Android 13+ `POST_NOTIFICATIONS`), then `NT7`.
  - Off -> set the opt-out, `NT8`, then `deleteToken()`.
  - Blocked by the OS -> "Turned off in your phone settings" and
    `Linking.openSettings()`.
  - A `getToken()` failure -> "Push unavailable on this device".
- **Opt-out persistence:** `PUSH_DEVICE_OFF` (a JSON array of user ids) is
  per device and per user, and kept across sign-out. A different user on the
  same device is unaffected.

## Testing

`npm run test` is the gate for every step; `npm run lint` and
`npx tsc --noEmit` before review. No combined Verify command exists. `tsc`
already reports two `isOnboardingComplete` errors in `services/authApi.test.ts`
and `slices/auth.slice.test.ts`; don't add new ones. Last observed: all 217
suites and 1,470 tests passed on `0eb4a03` (pre-commit hook, 38e1 merge).
React Native Firebase, `PermissionsAndroid` and `Linking` are mocked; nothing
native runs in Jest.

Check by hand: the Push category toggles work against the local backend
today. The device switch needs a push-enabled build (Firebase, P4): switch
it off and confirm the backend's device row is gone; restart and confirm it
stays off; sign out and in and confirm it's still off; switch it on and
confirm a new row.

## Notes for the AI

- The device switch and the category toggles are different things: the
  switch is this device (`NT7` / `NT8`), the toggles are the account (`NT6`).
  Copy should not blur them.
- Rename with `git mv` so the 38c history stays readable.
- `releasePushDevice` (logout) must not set the opt-out: logging out is not
  "turn push off".
- Keep `signOut()` synchronous for its in-memory part; only the key list it
  wipes changes.

## Open questions

- **The opt-out survives sign-out** (default chosen here). A creator who
  switched push off on this device keeps it off after logging out and back
  in, and other creators on the device are unaffected. If you'd rather a
  fresh sign-in re-enable push, the change is one line in `signOut`'s keep
  list.
