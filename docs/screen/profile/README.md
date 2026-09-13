# Screen Specs — Profile / Account Settings

Source: [Influsis Project — Brand & App Version (Figma)](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38957&m=dev)

The Profile tab's settings menu ("Account") and its 5 sub-screens: editing personal info, security toggles, changing password, privacy policy, and a help center FAQ.

## Flow

```
(main) tab bar "Profile" tab
  ▼
/profile                             Account                [(main) Tabs - has tab bar]
  │  avatar, name, email
  │  General: Profile / Security / Billing / My Applications
  │  About: Help Center / Privacy Policy
  │  Logout
  │
  ├─ tap "Profile"          ──▶ /profile-edit           Edit Profile      [(details) - no tab bar]
  │                              Full Name/Email/Phone (typable)
  │                              Gender/Country (OptionSheet) · Date of Birth (CalendarPicker)
  │
  ├─ tap "Security"         ──▶ /security-settings       Security Settings
  │                              4 toggle rows
  │                              │  tap "Change Password" (added, see below)
  │                              ▼
  │                              /change-password          Change Password
  │                                Current/New/Confirm Password → SuccessSheet → back
  │
  ├─ tap "Billing"          ──▶ (inert - no Figma design provided)
  │
  ├─ tap "My Applications"  ──▶ /applications (docs/screen/apply-campaign/campaign-list.md)
  │
  ├─ tap "Help Center"      ──▶ /help-center              Help Center (FAQ accordion)
  │
  ├─ tap "Privacy Policy"   ──▶ /privacy-policy           Privacy Policy (static text)
  │
  └─ tap "Logout"           ──▶ ConfirmDialog "Are you sure you want to logout?"
                                  │  Cancel → dismiss
                                  └  Log Out → clears session → /auth/sign-in
```

- `/profile` is the `(main)` Tabs group's Profile tab (`app/(main)/profile.tsx`, unchanged route) - it now renders the Figma "Account" design (a settings menu) instead of the previous read-only field dump.
- Every sub-screen (`/profile-edit`, `/security-settings`, `/change-password`, `/privacy-policy`, `/help-center`) lives in `app/(details)/` - pushed with no tab bar, the same reasoning as every other `(details)` screen (gig/brand/campaign details, notifications, applications, ...).

## Screens

| # | Screen | Spec | Route |
|---|---|---|---|
| 1 | Account (Profile tab) | [account.md](./account.md) | `/profile` |
| 2 | Edit Profile | [edit-profile.md](./edit-profile.md) | `/profile-edit` |
| 3 | Security Settings | [security-settings.md](./security-settings.md) | `/security-settings` |
| 4 | Change Password | [change-password.md](./change-password.md) | `/change-password` |
| 5 | Privacy Policy | [privacy-policy.md](./privacy-policy.md) | `/privacy-policy` |
| 6 | Help Center (FAQ) | [help-center.md](./help-center.md) | `/help-center` |

## New reusable components

Built for this flow, in `components/elements/`, none tied to a single screen:

- **`Toggle`** — on/off switch (Security Settings' 4 rows). No switch/toggle component existed in this project before.
- **`SettingsRow`** — icon + title(+description) + trailing slot, in a `flat` (Account's chevron-terminated menu rows) or `card` (Security Settings' white shadow-card toggle rows) variant.
- **`UnderlineField`** — label-above/bold-value-below field with a hairline underline divider, typable or pressable-to-open-a-picker (Edit Profile's 6 fields). Visually distinct from every existing bordered-box field (`TextField`, `SelectField`, `DateField`), so none of those fit this screen.
- **`OptionSheet`** — short single-select list in a `BottomSheet` with rounded pill rows (Edit Profile's Gender/Country pickers) - a different sheet shape than `SelectField`'s own underlined-row list.
- **`ConfirmDialog`** — centered popup (close X, primary button, secondary text link) over a dimmed backdrop, via `Modal` (Account's logout confirmation) - generic beyond logout, since the caller supplies both button labels/handlers.
- **`AccordionItem`** — expandable question/answer row (Help Center's FAQ list).

## Extended existing components

- **`CircleAvatar`** gained optional `onEditPress`, rendering a small pink pencil badge overlapping the circle's bottom-right corner, sized proportionally to `size` (Edit Profile's avatar photo picker).
- **`CampaignCard`**-adjacent: none this round; the extension work here was all above.

## Cross-cutting scope notes

- **No real backend.** As with every other flow, there's no accounts/settings API (`docs/PRD.md` §2.2/§4.1). Full Name/Email write to the existing `app` slice's `user` (`setUser`); Phone Number/Gender/Date of Birth/Country write to the `profileVerification` slice (extended with 3 new fields - `dateOfBirth` already lived there for the onboarding wizard, so Edit Profile now edits the *same* canonical value rather than a second copy). Security Settings' 4 toggles and the avatar photo picker are local component state only - nothing else in the app reads them yet.
- **Icons extracted via the Dev Mode MCP server, unlike a prior session's attempt at a different screen** (`docs/screen/apply-campaign/campaign-list.md` "Scope notes" — `get_design_context` was unavailable there) — it worked normally for every icon this flow needed (`assets/images/account/*`), rasterized to PNG the same way `scripts/rasterize-icons.py` already does (`scripts/rasterize-account-assets.py`). One planned icon (a right-chevron) was dropped in favor of reusing the existing `assets/images/icons/arrow-right.png` once the fresh export turned out to need an in-app rotation that an already-correct asset didn't.
- **"Billing" has no Figma design.** The Account screen's row exists (Figma shows it, node `6001:38992`) but no destination screen was provided anywhere in this task - left inert (no `onPress`), the same treatment Campaign Details' "Visit website" link got when it had no backing flow.
- **"My Applications" row is a carry-over addition, not new.** It previously lived as a standalone link under the username on the old Profile tab (see `docs/screen/apply-campaign/campaign-list.md`); moved into the Account menu's "General" section as a 4th row now that the screen has a real menu structure to live in, reusing the existing calendar icon (`assets/images/profile-verification/calendar-today.png`) rather than exporting a new one.
- **Logout actually clears session state**, not just a visual confirmation: `removePersistData(DataPersistKeys.USER)` (so a relaunch doesn't silently restore the session - `app/_layout.tsx` would otherwise read it back from `AsyncStorage`), `setUser(undefined)`, `setLoggedIn(false)`, then `router.replace('/auth/sign-in')`.
- **Figma content corrections**, each detailed in its own screen's doc: Change Password's duplicate "Confirm Password" label (should be 3 distinct labels), Privacy Policy's fully-duplicated content block, Help Center's Lorem Ipsum answers and placeholder 6th question title.
