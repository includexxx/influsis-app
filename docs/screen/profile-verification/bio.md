# Bio

|                     |                                                                                                                                                                                                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma nodes**     | [`6001:38894`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38894&m=dev) (empty), [`6312:8368`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6312-8368&m=dev) (filled, keyboard open) |
| **Route**           | `/profile-verification/bio` (`app/(auth)/profile-verification/bio.tsx`)                                                                                                                                                                                                                        |
| **Scene**           | `scenes/profile-verification/Bio.tsx`                                                                                                                                                                                                                                                          |
| **Components used** | `ProfileStepHeader`, `TextField`, `Button`                                                                                                                                                                                                                                                     |

## Purpose

First half of step 5 of 5 (see [README.md](./README.md) on why bio + username share "5 of 5"). A free-form multiline "about you" field.

## UI elements

- `ProfileStepHeader` — progress bar fully filled, "5 of 5", "Write something about passion" heading, description.
- A multiline `TextField` (reused as-is — passing `multiline`/`numberOfLines` and sizing it via the existing `inputStyle` prop into the ~208px box Figma specifies, rather than building a separate textarea component).
- "Write max 250 words" helper text below the field.
- "Next" primary button.

## States

- **Empty** — placeholder "Tell businesses about your passion...".
- **Filled** — free text.
- **Error** — pressing "Next" with more than 250 words shows "Please keep it under 250 words" (word count, not character count, computed client-side on submit — not truncated while typing).

## Navigation

- **Entry:** "Next" on `/profile-verification/languages`.
- **Exit:** "Next" → `router.push('/profile-verification/username')`.
