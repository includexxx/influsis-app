# Screen Specs — Onboarding + Auth Flow

Source: [Influsis Project — Brand & App Version (Figma)](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6360-9089&m=dev)

This is the first product flow implemented on top of the foundation described in [`docs/PRD.md`](../PRD.md). It covers app launch through to a signed-in placeholder home (`scenes/welcome`) — brand intro, a 3-slide onboarding carousel, and the sign-in/sign-up/OTP-verification auth screens. Each screen below has its own spec file with the Figma node link, UI elements, states, and navigation.

## Flow

```
app launch
  │
  ▼
app/index.tsx  ─────────────────▶  /onboarding  (Intro, auto-advance)
                                          │
                                          ▼
                                   /onboarding/carousel  (3 slides)
                                          │  (last slide's button)
                                          ▼
                                       /auth  (Sign-in method chooser)
                                ┌──────────┴──────────┐
                                ▼                     ▼
                       /auth/sign-in          /auth/sign-up
                                │                     │
                                │                     ▼
                                │            /auth/verify-otp
                                │                     │
                                └─────────┬───────────┘
                                          ▼
                                      /welcome
```

- `app/index.tsx` always redirects to `/onboarding` once the app-level splash/hydration check (`checked` in `slices/app.slice.ts`) resolves — there is currently no "already completed onboarding" fast path, so every fresh launch or reload starts at the brand intro. This is intentional for now (easier to test the flow repeatedly); see [`sign-in.md`](./sign-in.md) "Scope notes" for how to reintroduce persistence later.
- `/welcome` is the existing placeholder screen (`scenes/welcome/Welcome.tsx`); no real product home screen exists yet (out of scope, see `docs/PRD.md` §4). Reaching it only happens via `router.replace('/welcome')` from a successful Sign In or OTP verify — reloading the page does not remember that you got there.

## Screens

| # | Screen | Spec | Route |
|---|---|---|---|
| 1 | Brand intro | [intro.md](./intro.md) | `/onboarding` |
| 2 | Onboarding carousel | [onboarding-carousel.md](./onboarding-carousel.md) | `/onboarding/carousel` |
| 3 | Sign-in method chooser | [sign-in-landing.md](./sign-in-landing.md) | `/auth` |
| 4 | Sign In | [sign-in.md](./sign-in.md) | `/auth/sign-in` |
| 5 | Sign Up | [sign-up.md](./sign-up.md) | `/auth/sign-up` |
| 6 | OTP verification | [verify-otp.md](./verify-otp.md) | `/auth/verify-otp` |

## Cross-cutting scope notes

- **No real backend.** `docs/PRD.md` §2.2/§4.1 confirm no auth API exists yet. Sign In / Sign Up / OTP verify simulate success locally (matching the existing fake `getUserAsync` pattern) rather than calling a network endpoint.
- **Brand color.** Figma specifies `#F42E9E` as "Brand Color" throughout these screens, which is `palette.primary[400]`, not the semantic `colors.primary` (`palette.primary[500]` in light mode — see `docs/design-system.md`, which already flags the light/dark semantic mapping as an unconfirmed interpretation). These screens use `palette.primary[400]` directly to match Figma pixel-for-pixel; `colors.*` semantic tokens are still used for backgrounds/text so dark mode still adapts sensibly.
- **Input borders.** Similarly, `#D2D2D5` (`palette.gray[100]`) and `#A5A5AB` (`palette.gray[200]`) are used directly for form/OTP borders to match Figma, rather than the semantic `colors.border` token (`neutralGray[100]` / `#E0E2E7`, a different value — also an unconfirmed mapping per `docs/design-system.md`).
- **Fonts.** Figma specifies Roboto (body/buttons) and Righteous (intro wordmark), neither of which is bundled in this project (only Open Sans and ClashDisplay are — see `theme/fonts.ts`). Headings use the bundled `ClashDisplay` family (the project's established brand-heading substitute, per `theme/fonts.ts`'s existing Inter→ClashDisplay substitution for the `typography.display*` scale); body text, labels, and buttons use the platform default font with explicit numeric `fontWeight` matching the Figma weight.
- **Icons/images.** Extracted from Figma via the Dev Mode MCP server and stored in `assets/images/icons/` and `assets/images/onboarding/`. Vector icons were rasterized to PNG (no `react-native-svg` dependency was added — `expo-image` doesn't render SVG). Photo assets were downscaled/JPEG-compressed from multi-MB originals (see `scripts/resize-onboarding-assets.py`, `scripts/rasterize-icons.py`).
- **Shared style fragments.** Patterns repeated across these scenes (screen container, scroll padding, form field gaps, the primary CTA button, the white-bordered hero photo card, auth headings, footer link text) are factored into `styles/` (`layoutStyle`, `buttonStyle`, `cardStyle`, `textStyle`, barrel-exported from `styles/index.ts`) rather than duplicated per scene. This is distinct from `theme/` (raw design tokens) — `styles/` holds ready-to-use `StyleSheet.create()` shapes built from those tokens.
