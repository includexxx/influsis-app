# Content Categories

|                     |                                                                                                                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma nodes**     | [`6243:5491`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6243-5491&m=dev) (none selected), [`6312:8145`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6312-8145&m=dev) (one selected) |
| **Route**           | `/profile-verification/categories` (`app/(auth)/profile-verification/categories.tsx`)                                                                                                                                                                                                       |
| **Scene**           | `scenes/profile-verification/ContentCategories.tsx`                                                                                                                                                                                                                                         |
| **Components used** | `ProfileStepHeader`, `SelectableListItem`, `Button`                                                                                                                                                                                                                                         |

## Purpose

Step 2 of 5. Multi-select list of the kinds of content the creator makes.

## UI elements

- `ProfileStepHeader` — progress bar at 2/5, "2 of 5", "What content do you create?" heading, description.
- Seven `SelectableListItem` rows (icon + label), one per category: Education, Beauty & Life Style, Travel, Music, Gym & Body Building, Sports, Health. Tapping a row toggles its selected (pink border) state independently of the others.
- "Next" primary button — disabled until at least one category is selected.

## States

| State         | Trigger                                                          |
| ------------- | ---------------------------------------------------------------- |
| Unselected    | initial, or a row tapped again to deselect                       |
| Selected      | row tapped — pink border (Figma `6312:8145`'s "Education" state) |
| Next disabled | zero categories selected                                         |

## Scope notes

Figma lists "Health" twice (identical icon/label, nodes `6245:5627` and `6243:5573`) — treated as a duplicate and collapsed to one option. Figma's screenshots only show a single row selected at a time, but nothing in the design constrains this to one choice — a creator plausibly makes content in more than one category — so this is implemented as independent multi-select toggles, not a radio group.

## Navigation

- **Entry:** "Next" on `/profile-verification/date-of-birth`.
- **Exit:** "Next" → `router.push('/profile-verification/social-media')`.
