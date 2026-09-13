# Screen Specs — Onboarding + Auth Flow

Source: [Influsis Project — Brand & App Version (Figma)](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6360-9089&m=dev)

This is the first product flow implemented on top of the foundation described in [`docs/PRD.md`](../PRD.md). It covers app launch through to a signed-in session — brand intro, a 3-slide onboarding carousel, and the sign-in/sign-up/OTP-verification auth screens. Each screen below has its own spec file with the Figma node link, UI elements, states, and navigation.

This flow's routes, along with [`profile-verification`](../profile-verification/README.md), live under the `app/(auth)/` Expo Router group (`app/(auth)/onboarding/`, `app/(auth)/auth/`, `app/(auth)/profile-verification/`) — a purely organizational grouping of every pre-login screen, mirroring how `app/(main)/` groups the post-login tab shell (see [`docs/screen/main/README.md`](../main/README.md)). Group segments are invisible in the URL, so routes are still `/onboarding`, `/auth/sign-in`, `/profile-verification/bio`, etc.

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
                    │            │                     │
                    │ (Forgot    │ (Sign in)            ▼ (Sign Up)
                    │  password?)│            /auth/verify-otp  (flow=signup)
                    ▼            │                     │
        /auth/forgot-password    │                     ▼ (Verify)
                    │            │          SuccessSheet "Account Created
                    ▼ (Send)     │           Successfully" → Next
        /auth/verify-otp         │                     │
          (flow=reset)           │                     ▼
                    │            │        /profile-verification/* (7 screens -
                    ▼ (Verify)   │         see docs/screen/profile-verification)
        /auth/reset-password     │                     │
                    │            │                     ▼ (Explore)
                    ▼ (Reset)    │                     │
        SuccessSheet "Reset      │                     │
         Succesfully" → Log in ──┘                     │
                    │                                   │
                    └──────────────┬────────────────────┘
                                   ▼
                            /(main)/home
```

- `app/index.tsx` routes on `auth.slice.status` once `restoreSession` resolves: `restoring` renders nothing, `authenticated` goes to `/home`, `unauthenticated` goes to `/onboarding` (19c route guarding). A signed-out fresh launch or reload still starts at the brand intro; see [`sign-in.md`](./sign-in.md) "Scope notes" for the onboarding-completion fast path that is still not built.
- `/home` is the first tab of the `app/(main)` tab group (see [`docs/screen/main/README.md`](../main/README.md)) — the real main-app shell that replaced the old `/welcome` placeholder. Sign In reaches it directly (`router.replace('/home')`); Sign Up reaches it after the profile-verification wizard's completion screen. Reloading the page does not remember that you got there.
- `/auth/verify-otp` is **one screen shared by both the sign-up and forgot-password flows** — see [`verify-otp.md`](./verify-otp.md) for how the `flow` query param branches its copy and post-verify destination, instead of duplicating a second OTP screen.
- The "Reset Succesfully" and "Account Created Successfully" popups are the same reusable `SuccessSheet` component (green tick-square badge + title + description + CTA) with different copy — see "Shared style fragments" below.

## Screens

| # | Screen | Spec | Route |
|---|---|---|---|
| 1 | Brand intro | [intro.md](./intro.md) | `/onboarding` |
| 2 | Onboarding carousel | [onboarding-carousel.md](./onboarding-carousel.md) | `/onboarding/carousel` |
| 3 | Sign-in method chooser | [sign-in-landing.md](./sign-in-landing.md) | `/auth` |
| 4 | Sign In | [sign-in.md](./sign-in.md) | `/auth/sign-in` |
| 5 | Sign Up | [sign-up.md](./sign-up.md) | `/auth/sign-up` |
| 6 | OTP verification (sign-up + reset) | [verify-otp.md](./verify-otp.md) | `/auth/verify-otp` |
| 7 | Forgot Password | [forgot-password.md](./forgot-password.md) | `/auth/forgot-password` |
| 8 | Create New Password | [reset-password.md](./reset-password.md) | `/auth/reset-password` |

## Cross-cutting scope notes

- **No real backend.** `docs/PRD.md` §2.2/§4.1 confirm no auth API exists yet. Sign In / Sign Up / OTP verify simulate success locally (matching the existing fake `getUserAsync` pattern) rather than calling a network endpoint.
- **Brand color.** Figma specifies `#F42E9E` as "Brand Color" throughout these screens, which is `palette.primary[400]`, not the semantic `colors.primary` (`palette.primary[500]` in light mode — see `docs/design-system.md`, which already flags the light/dark semantic mapping as an unconfirmed interpretation). These screens use `palette.primary[400]` directly to match Figma pixel-for-pixel; `colors.*` semantic tokens are still used for backgrounds/text so dark mode still adapts sensibly.
- **Input borders.** Similarly, `#D2D2D5` (`palette.gray[100]`) and `#A5A5AB` (`palette.gray[200]`) are used directly for form/OTP borders to match Figma, rather than the semantic `colors.border` token (`neutralGray[100]` / `#E0E2E7`, a different value — also an unconfirmed mapping per `docs/design-system.md`).
- **Fonts.** Figma specifies Roboto (body/buttons) and Righteous (intro wordmark), neither of which is bundled in this project (only Open Sans and ClashDisplay are — see `theme/fonts.ts`). Headings use the bundled `ClashDisplay` family (the project's established brand-heading substitute, per `theme/fonts.ts`'s existing Inter→ClashDisplay substitution for the `typography.display*` scale); body text, labels, and buttons use the platform default font with explicit numeric `fontWeight` matching the Figma weight.
- **Icons/images.** Extracted from Figma via the Dev Mode MCP server and stored in `assets/images/icons/` and `assets/images/onboarding/`. Vector icons were rasterized to PNG (no `react-native-svg` dependency was added — `expo-image` doesn't render SVG). Photo assets were downscaled/JPEG-compressed from multi-MB originals (see `scripts/resize-onboarding-assets.py`, `scripts/rasterize-icons.py`). The forgot-password/reset-password/OTP screens reuse the existing `back-chevron.png` and `hide-eye.png` icons (same glyphs as the sign-in/sign-up screens); the only new asset is `icons/success-check.png` (the green popup's tick-square).
- **Shared style fragments.** Patterns repeated across these scenes (screen container, scroll padding, form field gaps, the primary CTA button, the white-bordered hero photo card, auth headings, footer link text) are factored into `styles/` (`layoutStyle`, `buttonStyle`, `cardStyle`, `textStyle`, barrel-exported from `styles/index.ts`) rather than duplicated per scene. This is distinct from `theme/` (raw design tokens) — `styles/` holds ready-to-use `StyleSheet.create()` shapes built from those tokens.
- **Reusable components (forgot-password/reset-password/OTP).** `components/elements/AuthTitleBlock` — the centered heading+description block at the top of `verify-otp`, `forgot-password`, and `reset-password` (Figma repeats this exact layout across all three). `components/elements/SuccessSheet` — the green tick-square popup, built on the existing (previously unused) `components/elements/BottomSheet`; reused for both the "Reset Succesfully" and "Account Created Successfully" states with different copy/CTA.
