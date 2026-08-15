# Sign-in method chooser

|                     |                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma node**      | [`6010:1427`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6010-1427&m=dev) — "Sign in" |
| **Route**           | `/auth` (`app/(auth)/auth/index.tsx`)                                                                                                     |
| **Scene**           | `scenes/auth/SignInLanding.tsx`                                                                                                           |
| **Components used** | `SocialAuthButton`, `Divider`                                                                                                             |

## Purpose

Landing screen for the auth flow — lets the user choose how they want to continue (email, or a social provider), with a link to sign up instead.

## UI elements

- Decorative rotated photo collage (5 images) at the top, matching the pattern used in onboarding slide 3.
- Logomark (`assets/images/icons/logomark.png`) + "Welcome to Influsis" heading.
- Four `SocialAuthButton` rows, top to bottom (matches Figma layer order exactly — Email is first, above the divider; the other three are below it):
  1. Continue with Email
  2. — "Or" divider —
  3. Continue with Instagram
  4. Continue with Facebook
  5. Continue with Google
- Footer: "Don't have an account? **Sign Up**".

## States

Single state — no loading/error variants at this screen.

## Navigation

- **Entry:** from the last onboarding slide's button, or directly if the user backs out of `/auth/sign-in` or `/auth/sign-up`.
- **Exit:**
  - "Continue with Email" → `/auth/sign-in`.
  - Instagram/Facebook/Google → also routes to `/auth/sign-in` as a stub. No OAuth backend exists yet (`docs/PRD.md` Epic 2/3), so these are wired to keep the flow fully clickable rather than being dead buttons; wire up real provider SDKs when the backend lands.
  - "Sign Up" → `/auth/sign-up`.
