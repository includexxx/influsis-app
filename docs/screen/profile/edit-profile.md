# Screen Specs — Edit Profile

| | |
|---|---|
| **Figma nodes** | [`6001:39044`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-39044&m=dev) (base state), [`6399:5469`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6399-5469&m=dev) / [`6398:8469`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6398-8469&m=dev) (Gender bottom sheet open - two identical duplicate frames), [`6398:5429`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6398-5429&m=dev) (Date of Birth calendar open) — all named "100_Light_settings, personal info" |
| **Route** | `/profile-edit` (`app/(details)/profile-edit.tsx`) |
| **Scene** | `scenes/main/EditProfile.tsx` |
| **Components used** | `ScreenHeader`, `CircleAvatar` (extended), `UnderlineField` (new), `OptionSheet` (new), `CalendarPicker` (existing, reused from profile-verification) |

## Purpose

Edit personal info: photo, full name, email, phone number, gender, date of birth, and country. Opened from the Account screen's "Profile" row.

## User flow

```
/profile
  │ tap "Profile" row
  ▼
/profile-edit
  │  tap avatar's pencil badge → image picker → photo updates immediately
  │  type into Full Name / Email / Phone Number → commits to Redux on every keystroke
  │  tap Gender → OptionSheet (Male/Female) → tap an option → commits + closes
  │  tap Date of Birth → CalendarPicker → tap a day → commits + closes
  │  tap Country → OptionSheet (6-country mock list) → tap an option → commits + closes
  │
  └─ back chevron (ScreenHeader) → router.back() to /profile
```

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Profile" title, empty right side | `ScreenHeader` |
| 2 | Avatar | 120px circular photo + pink pencil edit badge, centered | `CircleAvatar` (`onEditPress`) |
| 3-8 | Fields | Full Name, Email, Phone Number, Gender, Date of Birth, Country - each label-above/bold-value/underline | `UnderlineField` ×6 |

## Scope notes

- **No explicit Save step.** Figma's navbar right-side icon slot (`Iconly/Regular/Outline/Edit` / `Send` / `Paper Negative`) is present in the layer tree but `hidden="true"` in every one of the 4 captured frames - no visible save/checkmark button in any state. Every field therefore commits to Redux as it's edited (`onChangeText` for typed fields, `onSelect` for pickers), the same "no separate save step" pattern already used elsewhere in this app's forms.
- **Full Name/Email write to the `app` slice's `user`**; **Phone Number/Gender/Date of Birth/Country write to the `profileVerification` slice** (extended with `phoneNumber`/`gender`/`country` - `dateOfBirth` already existed there for the onboarding wizard's own date-of-birth step, so this screen edits that *same* value, not a duplicate).
- **Unset fields fall back to Figma's own example content**, not an empty placeholder: Phone Number defaults to `+1 111 467 378 399`, Gender to "Male", Country to "United States" - matching this project's general practice of using Figma's literal mock values as sensible defaults (e.g. `data/campaigns.ts`'s repeated "Bkash Branding Campaign") rather than inventing blank states Figma doesn't show.
- **Phone Number's flag+chevron prefix is decorative, not a working country-code picker.** Figma shows a UK flag (🇬🇧) next to a US-formatted number (`+1 111...`) - an inconsistency in the source design, preserved as-is (flag emoji, no image asset needed) since no country-code list or picker interaction was specified anywhere in this task.
- **Gender picker (`OptionSheet`) is a new component, not a `SelectField` reuse.** Figma's "Bottom sheet" (node `6399:5570`) shows a drag-handle bar over 2 stacked *rounded pill* rows - visually different from `SelectField`'s existing sheet (plain underlined text rows, built for Create Gig's Category field) - see `README.md`'s "New reusable components".
- **Country's 6-option list (`United States`, `United Kingdom`, `Canada`, `Australia`, `Bangladesh`, `India`) is invented mock content** - Figma's Country field only shows the current "United States" value and a chevron, no option list or country dataset is specified anywhere in the file. Reuses the same `OptionSheet` component as Gender since both are short pick-one lists opened the same way.
- **Date of Birth reuses `CalendarPicker`/its date-key logic verbatim** from the profile-verification wizard's own date-of-birth step (`scenes/profile-verification/DateOfBirth.tsx`) - same component, same `maxDate={new Date()}` guard against future birthdates, same `toISOString()` storage format.
- **Avatar photo picker is local-only, not persisted anywhere beyond this screen's session.** No avatar/photo field exists on the `User` type or in Redux - picking a new photo (`expo-image-picker`, the same library/permission flow `ApplyCampaign.tsx` already uses) only updates this component's own `useState`, and reverts to the mock photo if the screen is left and reopened. No other screen in the app currently reads or displays "my own" avatar, so there was nothing else to keep in sync.
- **The two "Gender bottom sheet open" nodes (`6399:5469`/`6398:8469`) are pixel-identical duplicates** of the same interaction state, not two different designs - implemented once.

## Navigation

- **Entry:** "Profile" row on `/profile` (`scenes/main/Profile.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to `/profile`.
