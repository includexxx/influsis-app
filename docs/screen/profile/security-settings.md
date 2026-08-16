# Screen Specs — Security Settings

| | |
|---|---|
| **Figma node** | [`6398:5198`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6398-5198&m=dev) — "101_Light_settings, security" |
| **Route** | `/security-settings` (`app/(details)/security-settings.tsx`) |
| **Scene** | `scenes/main/SecuritySettings.tsx` |
| **Components used** | `ScreenHeader`, `SettingsRow` (`variant="card"`, new), `Toggle` (new) |

## Purpose

4 security-related toggles (SMS Authenticator, Email notification, Use FaceID, Account Recovery), plus an added entry point into Change Password. Opened from the Account screen's "Security" row.

## User flow

```
/profile
  │ tap "Security" row
  ▼
/security-settings
  │  tap any toggle → flips on/off (local state only)
  │  tap "Change Password" → /change-password (docs/screen/profile/change-password.md)
  │
  └─ back chevron (ScreenHeader) → router.back() to /profile
```

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Security Settings" title | `ScreenHeader` |
| 2 | Toggle rows | 4 white rounded-shadow cards, icon + title(+description) + `Toggle` | `SettingsRow` (`variant="card"`) ×4 |
| 3 | Change Password | Single flat chevron row (added, see below) | `SettingsRow` (`variant="flat"`) |

## Scope notes

- **Toggles are local UI state only**, seeded from Figma's own on/off states rather than all defaulting to off: SMS Authenticator off, Email notification **on**, Use FaceID off, Account Recovery **on**. No backend exists to persist a real security preference (`docs/PRD.md` §2.2/§4.1).
- **Only "SMS Authenticator" has a description line** ("Shake your phone to randomize your acocunt balances.", including Figma's own typo "acocunt" - kept verbatim like every other real-content typo this project preserves, e.g. `docs/screen/apply-campaign/README.md`'s "Appled 10 July"). The other 3 rows' description text nodes are `hidden="true"` in Figma - `SettingsRow`'s `description` prop is simply omitted for those three.
- **"Use FaceID" row's icon/label came from a component-instance override, not the master's own default content.** `get_metadata` reported this row's underlying component as "Settings Complex" with default text "Help Center" and a "human head" icon - clearly a copy-pasted instance whose *text override* wasn't reflected in the metadata tool's output. The rendered screenshot is unambiguous ("Use FaceID", a head/face-outline icon) and is what's implemented; metadata's default content was not used.
- **"Change Password" entry was added, not present in Figma's Security Settings screen.** Figma provided a standalone Change Password screen (node `6027:8414`) but nothing in this screen, the Account menu, or anywhere else in this task links to it - this row is the most direct, lowest-risk entry point (the same reasoning Profile's "My Applications" link and Live Campaigns' entry-point choice both used - see `docs/screen/apply-campaign/campaign-list.md` and `docs/screen/live-campaign/README.md`).

## Navigation

- **Entry:** "Security" row on `/profile` (`scenes/main/Profile.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to `/profile`; "Change Password" → `/change-password`.
