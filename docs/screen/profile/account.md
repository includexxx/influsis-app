# Screen Specs — Account (Profile tab)

| | |
|---|---|
| **Figma nodes** | [`6001:38957`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38957&m=dev) ("93_Light_account", base state, with tab bar), [`6027:8164`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6027-8164&m=dev) (same screen, logout confirmation popup open) |
| **Route** | `/profile` (`app/(main)/profile.tsx`, unchanged - the Profile tab) |
| **Scene** | `scenes/profile/Profile.tsx` |
| **Components used** | Scene-local `ProfileHeader`, `ProfileStats`, `ProfileStrengthCard`, `ProfileMenuSection` (`scenes/profile/components/`); shared `CircleAvatar`, `ConfirmDialog` |

## Purpose

The Profile tab's landing screen: a settings menu, not a data display. Shows the signed-in user's avatar/name/email, then two sections of navigable rows (`General`: Profile, Security, Billing, My Applications; `About`: Help Center, Privacy Policy), and a Logout action that confirms before signing out.

## User flow

```
(main) tab bar → Profile tab
  ▼
/profile
  ├─ tap "Profile"          → /profile-edit (docs/screen/profile/edit-profile.md)
  ├─ tap "Security"         → /security-settings (docs/screen/profile/security-settings.md)
  ├─ tap "Billing"          → (inert, no Figma design provided)
  ├─ tap "My Applications"  → /applications (docs/screen/apply-campaign/campaign-list.md)
  ├─ tap "Help Center"      → /help-center (docs/screen/profile/help-center.md)
  ├─ tap "Privacy Policy"   → /privacy-policy (docs/screen/profile/privacy-policy.md)
  └─ tap "Logout"
       ▼
     ConfirmDialog "Are you sure you want to logout?"
       ├─ Cancel / close X → dismiss, stay on /profile
       └─ Log Out → clear session → router.replace('/auth/sign-in')
```

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Profile header | Full-bleed brand gradient (or the cover photo under a brand-tinted overlay) painted under the status bar: "Profile" title + glass edit button, 76px avatar with a green tick when verified, name, `@handle` (or account email), city/country, verification pill, white "View profile" pill | `ProfileHeader` |
| 2 | Stats | Card overlapping the header's bottom edge: Portfolio / Platforms / Categories counts from the profile, dashes while loading. Hidden for a non-creator account or a failed load | `ProfileStats` |
| 3 | Profile strength | Percent + gradient progress bar + which fields are missing (`utils/profileCompletion.ts`, 10 equal-weight checks), tapping opens Edit Profile. Hidden at 100%. A creator with no profile yet (404) sees a "Start onboarding" variant instead | `ProfileStrengthCard` |
| 4 | Account | My Profile, Edit Profile, Security | `ProfileMenuSection` |
| 5 | Work | Balance, My Applications | `ProfileMenuSection` |
| 6 | Support | Help Center, Privacy Policy | `ProfileMenuSection` |
| 7 | Logout | Full-width error-tinted button, then the app version | `Pressable` |
| 8 | Logout confirmation | Centered popup with a log-out icon and a one-line explanation, mounted only while open | `ConfirmDialog` (`icon`, `message`, `tone="danger"`) |

## Scope notes

- **Supersedes the previous Profile tab entirely.** The old screen (name/username/read-only profile-verification fields) is gone; none of that data (content categories, social platforms, languages, bio) is shown on this screen anymore - Figma's Account design doesn't include it, and no other screen in this task's scope was designated to show it either. It remains readable/editable through the profile-verification wizard's own slice, just not surfaced here.
- **Avatar and name/email are read-only here.** Editing happens on `/profile-edit` (tap "Profile"); this screen only displays `useAppSlice()`'s current `user.name`/`user.email` and a static mock avatar photo (`assets/images/account/avatar.png`, the exact photo Figma uses for its "Andrew Ainsley" example - there's no real avatar-upload persistence anywhere in the app yet, see `docs/screen/profile/edit-profile.md` "Scope notes").
- **Logout button/link polarity matches Figma exactly, not the usual destructive-action convention.** The *prominent pink button* is "Cancel" (stay logged in) and the *plain text link* is "Log Out" (the actual destructive action) - preserved as designed rather than "corrected" to make Log Out the prominent button, since this is a deliberate, unambiguous Figma choice (de-emphasizing the destructive path), not an error like the content-duplication bugs fixed elsewhere in this flow.
- **"Billing" is visually present but inert.** No Figma screen for it was provided anywhere in this task; matches this project's precedent for links without a backing destination (e.g. Campaign Details' "Visit website").

## Presentation

The destinations and the logout flow are as specified; the presentation was redesigned:

- Menu rows are a tinted Feather-icon chip + title + one-line subtitle + chevron, grouped into rounded `colors.card` cards with inset hairline dividers under uppercase section labels. Each row has its own accent (primary, navy, success, warning) from `scenes/profile/components/tones.ts`, which swaps the 50-step tints for low-alpha washes on the dark theme.
- The rows are regrouped into Account / Work / Support (was General / About), and "Ballance" now reads "Balance" (the route is still `/ballance`). Row `testID`s are unchanged.
- The header extends under the status bar (the `SafeAreaView` only handles left/right; the header adds the top inset itself), and a header-colored cap above the content covers the iOS overscroll bounce.
- Stats and profile strength only use fields `GET /profiles/me` returns - no invented follower or rating numbers.
- `ConfirmDialog` gained optional `icon`, `message` and `tone` props. The Figma polarity is kept (Cancel is the prominent button, Log Out the text action); `tone="danger"` colors the Log Out text red so the destructive action is still recognizable.

## Navigation

- **Entry:** `(main)` tab bar's "Profile" tab (always available, no auth gate - `docs/PRD.md` §2.2).
- **Exit:** each row pushes its own destination (see flow above); "Log Out" replaces the whole stack with `/auth/sign-in`.
