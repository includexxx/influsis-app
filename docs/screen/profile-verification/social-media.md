# Social Media

|                     |                                                                                                                                                                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma nodes**     | [`6001:38776`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38776&m=dev) (none selected), [`6312:8242`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6312-8242&m=dev) (one selected) |
| **Route**           | `/profile-verification/social-media` (`app/(auth)/profile-verification/social-media.tsx`)                                                                                                                                                                                                     |
| **Scene**           | `scenes/profile-verification/SocialMedia.tsx`                                                                                                                                                                                                                                                 |
| **Components used** | `ProfileStepHeader`, `SelectableListItem`, `Button`                                                                                                                                                                                                                                           |

## Purpose

Step 3 of 5. Multi-select list of the social platforms the creator is active on.

## UI elements

- `ProfileStepHeader` — progress bar at 3/5, "3 of 5", "Connect your social media" heading, description.
- Five `SelectableListItem` rows: Facebook, Instagram, Tiktok, Youtube, Likee.
- "Next" primary button — disabled until at least one platform is selected.

## States

Same pattern as [categories.md](./categories.md): unselected (default) / selected (pink border) per row, independently toggleable; "Next" disabled with zero platforms selected.

## Scope notes

The Facebook and Instagram icons are reused as-is from `assets/images/icons/` (already extracted for the auth flow's social sign-in buttons) rather than re-extracted from this screen's Figma nodes — same glyphs. Tiktok, Youtube, and Likee icons are new extractions (`assets/images/profile-verification/social-*`).

Multi-select rationale: same as categories — a creator plausibly posts to more than one platform, and nothing in the Figma design constrains this to a single choice.

## Navigation

- **Entry:** "Next" on `/profile-verification/categories`.
- **Exit:** "Next" → `router.push('/profile-verification/languages')`.
