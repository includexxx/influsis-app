# Intro (brand reveal)

|                |                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma node** | [`6360:9089`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6360-9089&m=dev) — "Onboardning 4" |
| **Route**      | `/onboarding` (`app/(auth)/onboarding/index.tsx`)                                                                                               |
| **Scene**      | `scenes/onboarding/Intro.tsx`                                                                                                                   |

## Purpose

A brief branded reveal shown once per fresh flow, before the onboarding carousel — the wordmark "Influsis." over two soft blurred color washes.

## UI elements

- Wordmark text "Influsis." — Figma specifies the Righteous font (not bundled); implemented with `ClashDisplay` bold, `palette.primary[400]` (`#F42E9E`).
- Two decorative blurred ellipses (pink top-right, pale yellow bottom-left) — `assets/images/onboarding/ellipse-top.png` / `ellipse-bottom.png`, rasterized from the Figma SVG exports.

## States

Single state — no interaction, no loading/error variants.

## Navigation

- **Entry:** landed on directly from `app/index.tsx` when `onboarded` is `false`.
- **Exit:** auto-advances to `/onboarding/carousel` after ~1.5s (`AUTO_ADVANCE_DELAY_MS` in `Intro.tsx`). The Figma node has no button, so this mirrors a typical splash/intro beat rather than requiring a tap.
