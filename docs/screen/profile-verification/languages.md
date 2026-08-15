# Languages

|                     |                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma nodes**     | [`6001:38834`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38834&m=dev) ("What languages you will use?", none selected), [`6312:8304`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6312-8304&m=dev) ("What languages are you fluent?", one selected) |
| **Route**           | `/profile-verification/languages` (`app/(auth)/profile-verification/languages.tsx`)                                                                                                                                                                                                                                                                             |
| **Scene**           | `scenes/profile-verification/Languages.tsx`                                                                                                                                                                                                                                                                                                                     |
| **Components used** | `ProfileStepHeader`, `SelectableListItem`, `Button`                                                                                                                                                                                                                                                                                                             |

## Purpose

Step 4 of 5. Multi-select list of languages the creator is fluent in.

## UI elements

- `ProfileStepHeader` — progress bar at 4/5, "4 of 5", heading, description.
- Five `SelectableListItem` rows, each with a flag icon: English, Spanish, French, Russian, Hindi.
- "Next" primary button — disabled until at least one language is selected.

## States

Same pattern as [categories.md](./categories.md): unselected (default) / selected (pink border) per row, independently toggleable; "Next" disabled with zero languages selected.

## Scope notes

Figma has two slightly different headings for this screen across its two state variants — "What languages you will use?" (`6001:38834`) and "What languages are you fluent?" (`6312:8304`). Treated as one screen (both are step 4 of 5 with identical layout), using a grammatically-cleaned "What languages are you fluent in?" as the final copy.

## Navigation

- **Entry:** "Next" on `/profile-verification/social-media`.
- **Exit:** "Next" → `router.push('/profile-verification/bio')`.
