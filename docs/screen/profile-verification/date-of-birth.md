# Date of Birth

|                     |                                                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma nodes**     | [`6449:5583`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6449-5583&m=dev) (closed field), [`6001:38419`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38419&m=dev) (calendar expanded) |
| **Route**           | `/profile-verification/date-of-birth` (`app/(auth)/profile-verification/date-of-birth.tsx`)                                                                                                                                                                                                       |
| **Scene**           | `scenes/profile-verification/DateOfBirth.tsx`                                                                                                                                                                                                                                                     |
| **Components used** | `ProfileStepHeader`, `DateField`, `CalendarPicker`, `Button`                                                                                                                                                                                                                                      |

## Purpose

Step 1 of 5. Collects date of birth, used (per the screen's own copy) so brands can target creators within an age range.

## UI elements

- `ProfileStepHeader` — progress bar at 1/5, "1 of 5", "When were you born?" heading, description.
- `DateField` — the collapsed "Date" input showing the selected value (`MM/DD/YYYY`) and a calendar icon button; tapping anywhere on it opens `CalendarPicker`.
- `CalendarPicker` — a month-grid calendar rendered in a `BottomSheet`. Prev/next chevrons step the month and year independently; tapping a day calls back with the selected `Date` and closes the sheet. Dates after today are disabled (a birth date can't be in the future).
- "Next" primary button.

## States

- **Empty** — no date selected yet; `DateField` shows the "Select date" placeholder in a muted color.
- **Filled** — `DateField` shows the selected date formatted `MM/DD/YYYY`.
- **Error** — pressing "Next" with no date selected shows "Please select your date of birth" below the field (client-side only, no backend to validate age against — see `docs/PRD.md` §2.2/§4.1).

## Scope notes

Figma's `6001:38419` shows a full desktop-style Material "Docked Input Date Picker" expanded inline on the page — a UI-kit component from Figma's design system, not a realistic mobile interaction. This project has no calendar/date-picker dependency, and native date-picker packages (e.g. `@react-native-community/datetimepicker`) don't support the web target this app also ships to. So `CalendarPicker` was built as a small from-scratch month-grid component instead, opened in the existing `BottomSheet` — matching the Figma calendar's visual structure (weekday header, day grid, pink selected-day circle, month/year navigation row) without a platform-specific dependency. The month/year dropdown carets in Figma (for jumping directly to an arbitrary month/year) are decorative here; only the prev/next chevron buttons are functional.

Per the `SuccessSheet` lesson (`docs/screen/auth/README.md`), `CalendarPicker` is only mounted while open (`{isPickerOpen && <CalendarPicker ... />}`) rather than kept mounted with an `isOpen` toggle, so it can't interfere with keyboard/focus elsewhere on the screen.

## Navigation

- **Entry:** "Next" on the sign-up `SuccessSheet` (`/auth/verify-otp`, `flow=signup`) — see `docs/screen/auth/verify-otp.md`.
- **Exit:** successful "Next" → `router.push('/profile-verification/categories')`.
