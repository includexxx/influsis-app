# Screen Specs — Edit Profile

| | |
|---|---|
| **Figma nodes** | [`6001:39044`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-39044&m=dev) (base state), [`6399:5469`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6399-5469&m=dev) / [`6398:8469`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6398-8469&m=dev) (Gender bottom sheet open - two identical duplicate frames), [`6398:5429`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6398-5429&m=dev) (Date of Birth calendar open) — all named "100_Light_settings, personal info" |
| **Route** | `/profile-edit` (`app/(details)/profile-edit.tsx`) |
| **Scene** | `scenes/main/EditProfile.tsx` |
| **Components used** | `ScreenHeader`, `CircleAvatar` (extended), `TextField` (existing, extended with `onPress`), `OptionSheet` (new), `CountryCodeSheet` (new), `CalendarPicker` (existing, reused from profile-verification) |

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
  │  tap Phone Number's flag/dial-code prefix → CountryCodeSheet (searchable) → tap a country → commits + closes
  │  tap Gender → OptionSheet (Male/Female) → tap an option → commits + closes
  │  tap Date of Birth → CalendarPicker → tap a day → commits + closes
  │  tap Country → OptionSheet (full country list) → tap an option → commits + closes
  │
  └─ back chevron (ScreenHeader) → router.back() to /profile
```

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Profile" title, empty right side | `ScreenHeader` |
| 2 | Avatar | 120px circular photo + pink pencil edit badge on a soft tinted disc, centered | `CircleAvatar` (`onEditPress`) |
| 3-8 | Fields | Full Name, Email, Phone Number, Gender, Date of Birth, Country - each label-above over a bordered input row | `TextField` ×6 |

## Scope notes

- **No explicit Save step.** Figma's navbar right-side icon slot (`Iconly/Regular/Outline/Edit` / `Send` / `Paper Negative`) is present in the layer tree but `hidden="true"` in every one of the 4 captured frames - no visible save/checkmark button in any state. Every field therefore commits to Redux as it's edited (`onChangeText` for typed fields, `onSelect` for pickers), the same "no separate save step" pattern already used elsewhere in this app's forms.
- **Full Name/Email write to the `app` slice's `user`**; **Phone Number/Gender/Date of Birth/Country write to the `profileVerification` slice** (extended with `phoneNumber`/`phoneCountry`/`gender`/`country` - `dateOfBirth` already existed there for the onboarding wizard's own date-of-birth step, so this screen edits that *same* value, not a duplicate).
- **Unset fields fall back to Figma's own example content**, not an empty placeholder: Phone Number defaults to `111 467 378 399` (prefix `+1`), Gender to "Male", Country to "United States" - matching this project's general practice of using Figma's literal mock values as sensible defaults (e.g. `data/campaigns.ts`'s repeated "Bkash Branding Campaign") rather than inventing blank states Figma doesn't show.
- **Phone Number's prefix is a working country-code picker** (`CountryCodeSheet`), added after the initial build. Tapping the flag opens a searchable bottom sheet of every country in `@/data/country-flags` joined with its E.164 calling code from `@/data/dial-codes` (a new dataset - dial codes appear nowhere in Figma), filterable by name or code. The chosen country is stored as `phoneCountry` (ISO code) in Redux, separate from `phoneNumber`, which now holds only the local digits.
  - **The default flag changed 🇬🇧 → 🇺🇸.** Figma drew a UK flag next to a US-formatted `+1 111...` number - an inconsistency in the source design that was harmless while the flag was decorative but not once the prefix became real, so the default is `us` (also matching the Country field's "United States" default).
  - **`phoneCountry` is distinct from `country`.** The residence country field is unchanged and moves independently - picking a dial code does not rewrite it.
- **Gender picker (`OptionSheet`) is a new component, not a `SelectField` reuse.** Figma's "Bottom sheet" (node `6399:5570`) shows a drag-handle bar over 2 stacked *rounded pill* rows - visually different from `SelectField`'s existing sheet (plain underlined text rows, built for Create Gig's Category field) - see `README.md`'s "New reusable components".
- **Country's option list is app-supplied content** (every entry in `@/data/country-flags`, alphabetical) - Figma's Country field only shows the current "United States" value and a chevron, no option list or country dataset is specified anywhere in the file. Reuses the same `OptionSheet` component as Gender since both are pick-one lists opened the same way; the *phone* country picker uses `CountryCodeSheet` instead because it also needs a search field and a dial-code column.
- **Date of Birth reuses `CalendarPicker`/its date-key logic verbatim** from the profile-verification wizard's own date-of-birth step (`scenes/profile-verification/DateOfBirth.tsx`) - same component, same `maxDate={new Date()}` guard against future birthdates, same `toISOString()` storage format.
- **Avatar photo picker is local-only, not persisted anywhere beyond this screen's session.** No avatar/photo field exists on the `User` type or in Redux - picking a new photo (`expo-image-picker`, the same library/permission flow `ApplyCampaign.tsx` already uses) only updates this component's own `useState`, and reverts to the mock photo if the screen is left and reopened. No other screen in the app currently reads or displays "my own" avatar, so there was nothing else to keep in sync.
- **The two "Gender bottom sheet open" nodes (`6399:5469`/`6398:8469`) are pixel-identical duplicates** of the same interaction state, not two different designs - implemented once.

## Presentation

The fields, values and pickers above are as specified; their *presentation* was moved onto the bordered form shape the auth screens use ([sign-up.md](../auth/sign-up.md), `scenes/auth/SignUp.tsx`) so a form on the settings side of the app reads the same as one on the sign-up side:

- Each of the 6 fields is now a `TextField` - 14px label above a 12px-radius bordered row on `colors.card` - stacked in `layoutStyle.fieldGroup`, replacing the previous `UnderlineField` (label above an 18px bold value over a hairline rule). `UnderlineField` itself is untouched and still exported; this screen was its only caller.
- The three picker fields (Gender, Date of Birth, Country) use `TextField`'s new opt-in `onPress`, which wraps the field in a pressable and stops the input row taking touches, so they open their caller-owned sheet instead of a keyboard. Their chevron/calendar glyphs moved from `UnderlineField`'s `trailingAdornment` to `TextField`'s `rightAdornment`.
- The phone dial-code picker rides in `TextField`'s `leftAdornment` exactly as it does on Sign Up, sized to that row's 14px type, with a hairline separating the prefix from the number.
- The avatar sits on a `primary/25` disc (a low-alpha wash of the same accent on the dark theme) so the photo still reads as the focal point of an otherwise plain form.

## Navigation

- **Entry:** "Profile" row on `/profile` (`scenes/main/Profile.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to `/profile`.
