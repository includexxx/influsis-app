# Screen Specs — Change Password

| | |
|---|---|
| **Figma node** | [`6027:8414`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6027-8414&m=dev) — "Change Password" |
| **Route** | `/change-password` (`app/(details)/change-password.tsx`) |
| **Scene** | `scenes/main/ChangePassword.tsx` |
| **Components used** | `ScreenHeader`, `TextField`, `Button`, `SuccessSheet` — all existing, reused |

## Purpose

An in-app password change for an already-signed-in user: current password + new password + confirm, then a success confirmation. Opened from Security Settings' added "Change Password" row.

## User flow

```
/security-settings
  │ tap "Change Password" row
  ▼
/change-password
  │  fill Current Password / New Password / Confirm Password
  │  tap "Next" (validates client-side)
  ▼
SuccessSheet "Password Changed" opens in place
  │  "Done" → router.back()
  ▼
/security-settings
```

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Change Password" title | `ScreenHeader` |
| 2 | Description | "The new password must be different from the current password" | — |
| 3 | Fields | Current Password, New Password, Confirm Password (all `secureTextEntry`, eye toggle built in) | `TextField` ×3 |
| 4 | Next | Primary button | `Button` |
| 5 | Success popup | Green tick badge, "Password Changed", confirmation copy, "Done" button | `SuccessSheet` |

## States

Client-side validation only (no backend — see `docs/PRD.md` §2.2/§4.1):

| Field | Rule | Error text |
| --- | --- | --- |
| Current Password | non-empty | "Enter your current password" |
| New Password | ≥ 6 characters | "Must be at least 6 characters" |
| Confirm Password | equals New Password | "Passwords do not match" |

## Scope notes

- **Field labels are corrected from Figma's own content.** Figma's 2nd and 3rd password fields are both literally labeled "Confirm Password" (node `6212:6791`/`6317:6075` - a copy-paste mistake, not intentional repeated content like some duplicate mock text this project otherwise preserves verbatim). The screen's own subtitle - "must be different from **the current password**" - only makes sense with a first field for the current password, so the 3 fields are implemented as **Current Password / New Password / Confirm Password**, the only labeling that matches both the subtitle and a real change-password form.
- **Button label is "Next"** (confirmed via screenshot), not "Continue" as an instance name in the raw metadata suggested (`get_metadata` reports component instance *names*, not necessarily their text overrides - see the same caveat in `docs/screen/profile/security-settings.md`).
- **Distinct from the auth flow's "Create New Password" screen.** Figma also contains a node named "Create new pass done" (`6212:6801`) with 2 fields (no "current password") and a "Please re-login to get started" success popup - that's the **same screen already implemented** as `docs/screen/auth/reset-password.md` (the unauthenticated forgot-password flow), reused verbatim there, not rebuilt here. This screen is a different, 3-field, in-app flow for an already-signed-in user, so its own success popup doesn't force a re-login - "Done" simply returns to Security Settings.
- **No real backend.** "Changing" the password doesn't verify the current password against anything or persist a new one anywhere - submitting valid-shaped input always succeeds, the same "no fake async" convention used throughout this project.

## Navigation

- **Entry:** "Change Password" row on `/security-settings` (`scenes/main/SecuritySettings.tsx`).
- **Exit:** back chevron → `router.back()`; or successful submit → `SuccessSheet` → "Done" → `router.back()` to `/security-settings`.
