# Current Feature

**Feature:** 38c. Email notification settings (backend 24b `NT5`, `NT6`)
**Branch:** feature/email-notification-settings
**Status:** verified
**Base:** `feat/notifications` HEAD (`7c84d86`, which has 38a and 38b).

## Goal

A creator can choose, per category, whether to get the optional notification
emails, from a new Notification settings screen linked from the Profile menu.
Locked events (final decisions and deadlines) are always sent, and the screen
says so. A creator without a verified email sees why email can't reach them
instead of toggles.

## In scope

- `NT5` / `NT6` endpoints in `services/notificationsApi.ts`.
- The new route `app/(details)/notification-settings.tsx`, which renders
  `scenes/notifications/NotificationSettings.tsx`.
- A "Notifications" row in the Profile tab's Account section.
- One **Email** toggle per category `NT5` returns, in its order.
  - In-app is shown as always on.
  - Locked events show "Always sent: final decisions and deadlines".
- Saves with `NT6`: partial and optimistic, reverted on error, with rapid
  toggles serialized so the last state wins, and never an empty channel
  object.
- No verified email (`GET /auth/me` `emailVerified`): the notice "Add an email
  to get important updates when the app is closed" replaces the toggles.
- Loading, error-with-retry, and empty states.
- The account-state sign-out listener covers the two new endpoints.

## Out of scope

- The `push` block of `NT5`/`NT6`, the "Push on this device" switch and the
  Push toggles (38e). `push` is typed and ignored.
- Adding or verifying an email: no add-email screen exists in the app (see
  Open questions). The notice has no link for now.
- The `/notification-settings` email "manage" link opening the app (38d).
  This route is the one that link targets.
- The mock "Email notification" toggle in `scenes/profile/SecuritySettings.tsx`
  is untouched (see Open questions).

## Build loop

`workflow.stepReview` is `feature`: build all steps, keeping `npm run test`
green after each, then present one review packet. `workflow.checkpointCommits`
is `disabled`. `/complete` makes the feature commit.

## Build steps

- [x] **1. Preferences API and types**
  - `types/notification.ts`:
    - `NotificationChannelPreference`: `{ enabled: boolean; lockedEvents: string[]; optionalEvents: string[] }`.
    - `NotificationPreference`: `{ category: NotificationCategory | (string & {}); inApp: { enabled: boolean; locked: boolean }; email: NotificationChannelPreference | null; push: NotificationChannelPreference | null }`.
    - `UpdateNotificationPreferencesRequest`: `{ email?: Record<string, boolean>; push?: Record<string, boolean> }`.
  - `services/notificationsApi.ts`:
    - Add the tag `NotificationPreferences`.
    - `getNotificationPreferences` (`GET /notifications/preferences`)
      provides it.
    - `updateNotificationPreferences` (`PATCH /notifications/preferences`,
      body as given) returns `NotificationPreference[]`. On success it writes
      the response into the `getNotificationPreferences` cache with
      `updateQueryData`; it does not invalidate.
    - Add both to the matcher in `services/accountStateSignOut.ts`.
  - **Done when** `notificationsApi.test.ts` covers both endpoints' method,
    URL, and body, and a successful update replacing the cached `NT5` data.
    `accountStateSignOut.test.ts` covers an `ACCOUNT_SUSPENDED` on `NT6`.
    `npm run test` is green.

- [x] **2. Save logic: optimistic, serialized, last state wins**
  - `scenes/notifications/utils/emailPreferences.ts`, all pure:
    - `emailToggles(prefs)` returns `{ category, enabled, hasLocked }[]` for
      entries with a non-null `email`, in `NT5` order.
    - `diffEmail(desired, confirmed)` returns `Record<string, boolean>` with
      only the categories whose desired value differs, or `null` when nothing
      differs. `null` means no request is sent, so an empty `email: {}` is
      never sent.
  - `scenes/notifications/hooks/useEmailPreferences.ts`:
    - It reads `getNotificationPreferences` (skipped when `skip` is true) and
      keeps the `confirmed` (server) and `desired` (on-screen) maps.
    - `toggle(category)` flips `desired` at once (optimistic). It then sends
      `NT6 { email: diffEmail(desired, confirmed) }` when no request is in
      flight. While one is in flight, it only records the new desired state.
    - When a request settles, `confirmed` becomes the response. If `desired`
      still differs, it sends the new diff. That repeats until they agree,
      so the last state wins with one request at a time.
    - On error it sets `desired` back to `confirmed` and drops queued
      changes. It sets `saveError`: the server message for a `422`,
      otherwise "Couldn't save your email settings. Try again." Starting
      another toggle clears it.
    - Returns `toggles` (desired values plus `hasLocked`), `isLoading`,
      `isError`, `retry`, `isSaving`, `saveError`, and `toggle`.
  - **Done when** `emailPreferences.test.ts` covers the toggle list (`email`
    null skipped, order kept) and the diff (only changed categories, `null`
    when equal). `useEmailPreferences.test.tsx` (mocked HTTP, fake timers)
    covers:
    - one toggle sends `{ email: { offer: false } }`
    - three quick toggles on one category while the first is in flight end
      with exactly one follow-up carrying only the final value, or none when
      it returns to the confirmed value
    - toggles on two categories while one is in flight are sent together
    - a failed save reverts and sets `saveError`; a `422` uses the server
      message
    - an empty object is never sent

    `npm run test` is green.

- [x] **3. Notification settings screen and menu row**
  - Add `app/(details)/notification-settings.tsx` as a thin re-export. Export
    the screen from `scenes/notifications/index.ts`.
  - `scenes/notifications/NotificationSettings.tsx` (+ `notificationSettings.style.ts`):
    - A `ScreenHeader` "Notification settings" with a back button.
    - An "In-app" note: "In-app notifications are always on." No toggle.
    - With a verified email (`useAuthSlice().account?.emailVerified === true`),
      an "Email" section:
      - One `SettingsRow` per category with a trailing `Toggle`
        (`accessibilityLabel` "Email for {label}", `accessibilityState`
        checked), so a row press flips it.
      - A row description of "Always sent: final decisions and deadlines"
        when `hasLocked`, appended to the category description.
    - Category labels and descriptions, a fixed map. Each description comes
      from that category's optional creator events in the backend
      EVENT_CATALOG. An unknown category shows its key in title case, with
      no description.

      | Category | Label | Description |
      | --- | --- | --- |
      | `engagement` | Invitations and requests | New invitations and declined requests |
      | `offer` | Offers | Counter-offers |
      | `delivery` | Deliveries | Draft approvals |
      | `review` | Reviews | Reviews published about you |
      | `account` | Account | Verification approvals |

    - `saveError` shows under the section with `accessibilityRole="alert"`.
    - Loading: a spinner in the section. Error: "Couldn't load your settings"
      with "Try again". Empty (no category has `email`): "There are no email
      settings for your account."
    - No verified email: instead of the toggles, the notice "Add an email to
      get important updates when the app is closed" (with
      `accessibilityRole="text"`). `NT5` is not requested.
  - `scenes/profile/Profile.tsx`: in `accountItems`, after Security, add a row
    with `icon: 'bell'`, title "Notifications", subtitle "Email alerts", a
    push to `/notification-settings`, and `testID` `account-row-notifications`.
  - **Done when** `NotificationSettings.test.tsx` (mocked HTTP, auth slice
    seeded) covers:
    - the toggles render in `NT5` order with labels and the locked note
    - pressing one sends `NT6` and shows the new value at once
    - a failed save reverts and shows the alert
    - loading, then error with retry
    - empty
    - no verified email shows the notice and makes no `NT5` call

    `Profile.test.tsx`'s row table includes
    `['account-row-notifications', '/notification-settings']`.
    `npm run test` and `npm run lint` are green.

## Files / areas

- New:
  - `app/(details)/notification-settings.tsx`
  - `scenes/notifications/NotificationSettings.tsx`, `notificationSettings.style.ts`
    and `NotificationSettings.test.tsx`
  - `scenes/notifications/utils/emailPreferences.ts` and its test
  - `scenes/notifications/hooks/useEmailPreferences.ts` and its test
- Changed:
  - `types/notification.ts`
  - `services/notificationsApi.ts` and its test
  - `services/accountStateSignOut.ts` and its test
  - `scenes/notifications/index.ts`
  - `scenes/profile/Profile.tsx` and `Profile.test.tsx`

## Data / contracts

Source: `../backend/docs/features/notifications/API_ENDPOINTS_LIST.md` NT5,
NT6; `EVENT_CATALOG.md` §2. Built in backend 24b and 24g1.

- **NT5** `GET /notifications/preferences` returns `NotificationPreference[]`.
  - Category order is fixed: `campaign`, `engagement`, `offer`, `delivery`,
    `review`, `account`. Creators get no `campaign`.
  - A category is listed only when it has an optional event for the
    caller's audience.
  - `email.enabled` controls only the optional events. `lockedEvents` always
    send.
  - `inApp.locked` is always `true`.
  - `account.suspended` is in `email.lockedEvents` only.
- **NT6** `PATCH /notifications/preferences` takes
  `{ email?: Record<category, boolean>, push?: Record<category, boolean> }`
  and returns the `NT5` shape.
  - It is partial: only the categories sent change.
  - `422 VALIDATION_FAILED`: an unknown category or channel, a non-boolean,
    no channel at all, or an empty channel object.
  - Turning a category off also skips that category's batched emails.
- **No verified email.** Decided from `GET /auth/me` `emailVerified` (already
  in `auth.account`). `NT5` doesn't say.
- **Errors.** `401 AUTH_*` goes through the shared refresh.
  `ACCOUNT_SUSPENDED` / `_DEACTIVATED` / `_PENDING_VERIFICATION` sign out
  through the listener. A `422` shows inline. Offline or anything else shows
  the error with retry.

## Testing

`npm run test` is the gate for every step; `npm run lint` and
`npx tsc --noEmit` before review. No combined Verify command exists. `tsc`
already reports two `isOnboardingComplete` errors in `services/authApi.test.ts`
and `slices/auth.slice.test.ts`; don't add new ones. Last observed: all 201
suites and 1,327 tests passed on `7c84d86` (pre-commit hook, 38b merge).

Predicted tests:

- notificationsApi, accountStateSignOut
- emailPreferences, useEmailPreferences
- NotificationSettings
- the Profile row table

Check by hand against the local backend on `feat/notifications`:

- the toggles match the backend
- turning off "Offers" stops counter-offer emails
- a phone-only creator sees the notice

## Notes for the AI

- Keep the push block out of the UI; 38e adds the Push toggles and the device
  switch to this same screen and the same hook pattern.
- The serialize rule matters: two overlapping `NT6` calls could land out of
  order and leave the server on a stale value. One request at a time, then
  send the difference between the on-screen and server state.
- Copy is plain text. Category labels come from the fixed map, never from
  server strings.

## Open questions

- **Where does "Add an email" go?** No add-email screen exists in the app.
  The backend has an `email_change` OTP purpose but no add-email flow for a
  phone sign-up in the contracts (backend README O2). For now the notice is
  text only. Linking it later needs a product decision and possibly backend
  work.
- **The Security screen's mock "Email notification" toggle**
  (`scenes/profile/SecuritySettings.tsx`, local state, not wired) now
  overlaps with this screen. Remove it, or leave it until Security is wired?
  This spec leaves it.
