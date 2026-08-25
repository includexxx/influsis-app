# Completed

|                     |                                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma node**      | [`6001:38922`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38922&m=dev) — "Profile_5" / "Cardyy Elearning Cards 13" |
| **Route**           | `/profile-verification/completed` (`app/(auth)/profile-verification/completed.tsx`)                                                                                         |
| **Scene**           | `scenes/profile-verification/Completed.tsx`                                                                                                                                 |
| **Components used** | `Button`, `Image`                                                                                                                                                           |

## Purpose

Terminal screen of the profile-verification wizard — confirms the profile is complete and hands off into the (placeholder) app home.

## UI elements

- A centered card with the confetti illustration as its background, the same green tick-square badge used by `SuccessSheet` (reusing `assets/images/icons/success-check.png` rather than re-extracting it), and "Congratulation! You have completed profile" heading.
- Description text — Figma's copy here is a Lorem Ipsum placeholder; replaced with real copy ("Your profile is ready - businesses can now discover you for campaigns that fit your niche.").
- "Explore" primary button.

## Scope notes

Figma composites this screen with a layered SVG mask (`imgMask`) to clip the confetti image, title, and badge into a rounded card shape with soft edges. That masking technique is Figma-specific compositing, not something meaningfully reproducible (or necessary) in React Native — reimplemented here as a plain rounded, clipped `View` with the confetti image absolutely positioned behind the content, which reads the same visually.

## Navigation

- **Entry:** "Next" on `/profile-verification/username`.
- **Exit:** "Explore" → `router.replace('/home')`, the first tab of the `app/(main)` shell (see `docs/screen/main/README.md`) — same completion path as the auth flow's Sign In (see `docs/screen/auth/README.md`); nothing is persisted, so a reload starts back at `/onboarding`.
