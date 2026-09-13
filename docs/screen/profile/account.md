# Screen Specs — Account (Profile tab)

| | |
|---|---|
| **Figma nodes** | [`6001:38957`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38957&m=dev) ("93_Light_account", base state, with tab bar), [`6027:8164`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6027-8164&m=dev) (same screen, logout confirmation popup open) |
| **Route** | `/profile` (`app/(main)/profile.tsx`, unchanged - the Profile tab) |
| **Scene** | `scenes/main/Profile.tsx` |
| **Components used** | `CircleAvatar`, `SettingsRow`, `ConfirmDialog` (new/extended, see [README.md](./README.md)) |

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
| 1 | Profile header | Full-bleed brand-gradient hero: 84px circular avatar in a translucent ring + name + email, centered | `CircleAvatar` + `LinearGradient` |
| 2 | General | Uppercase section label + an elevated card grouping 4 divider-separated rows (Profile, Security, Billing, My Applications) | `SettingsRow` (`variant="flat"`) ×4 |
| 3 | About | Uppercase section label + an elevated card grouping 2 divider-separated rows (Help Center, Privacy Policy) | `SettingsRow` (`variant="flat"`) ×2 |
| 4 | Logout | Single red/pink row in its own card, no chevron | `SettingsRow` (`destructive`, `showChevron={false}`) |
| 5 | Logout confirmation | Centered popup, mounted only while open | `ConfirmDialog` |

## Scope notes

- **Supersedes the previous Profile tab entirely.** The old screen (name/username/read-only profile-verification fields) is gone; none of that data (content categories, social platforms, languages, bio) is shown on this screen anymore - Figma's Account design doesn't include it, and no other screen in this task's scope was designated to show it either. It remains readable/editable through the profile-verification wizard's own slice, just not surfaced here.
- **Avatar and name/email are read-only here.** Editing happens on `/profile-edit` (tap "Profile"); this screen only displays `useAppSlice()`'s current `user.name`/`user.email` and a static mock avatar photo (`assets/images/account/avatar.png`, the exact photo Figma uses for its "Andrew Ainsley" example - there's no real avatar-upload persistence anywhere in the app yet, see `docs/screen/profile/edit-profile.md` "Scope notes").
- **Logout button/link polarity matches Figma exactly, not the usual destructive-action convention.** The *prominent pink button* is "Cancel" (stay logged in) and the *plain text link* is "Log Out" (the actual destructive action) - preserved as designed rather than "corrected" to make Log Out the prominent button, since this is a deliberate, unambiguous Figma choice (de-emphasizing the destructive path), not an error like the content-duplication bugs fixed elsewhere in this flow.
- **"Billing" is visually present but inert.** No Figma screen for it was provided anywhere in this task; matches this project's precedent for links without a backing destination (e.g. Campaign Details' "Visit website").

## Presentation

The rows, copy and destinations above are as specified; their *presentation* was reworked for a more modern settings-screen look, without changing any content:

- The identity block is a full-bleed vertical brand-gradient header (`primary/400` -> `primary/600`) with rounded bottom corners, two out-of-frame translucent discs for depth, and white type on a translucent avatar ring. The scene's `SafeAreaView` is filled with the gradient's top color so the header reads as continuous under the status bar (the app's global `StatusBar style="light"` already suits it).
- Menu rows are grouped into `colors.card` cards (`radius.xl`, `colors.border` hairline, `Shadow/sm`) with left-inset dividers between rows, under small uppercase section labels - replacing the previous label + full-width-rule pattern.
- Each row's glyph sits in a 40px tinted chip (`SettingsRow`'s new opt-in `iconBackground`), primary-tinted on the menu rows and error-tinted on Logout. On the dark theme the 50-step tints are swapped for low-alpha washes of the same accents.

## Navigation

- **Entry:** `(main)` tab bar's "Profile" tab (always available, no auth gate - `docs/PRD.md` §2.2).
- **Exit:** each row pushes its own destination (see flow above); "Log Out" replaces the whole stack with `/auth/sign-in`.
