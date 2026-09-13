# Onboarding carousel

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma nodes**     | [`6001:38047`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38047&m=dev) (slide 1), [`6001:37981`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-37981&m=dev) (slide 2), [`6001:38013`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6001-38013&m=dev) (slide 3) |
| **Route**           | `/onboarding/carousel` (`app/(auth)/onboarding/carousel.tsx`)                                                                                                                                                                                                                                                                                                                                                                   |
| **Scene**           | `scenes/onboarding/Onboarding.tsx`                                                                                                                                                                                                                                                                                                                                                                                              |
| **Components used** | `OnboardingSlide`, `PaginationDots`, `Button`                                                                                                                                                                                                                                                                                                                                                                                   |

## Purpose

Three horizontally-paged slides introducing the product's value props, each with a full-bleed visual, headline, description, dot pagination, and a primary CTA.

## UI elements (per slide)

| Slide | Visual                                                           | Title                                        | Button label    |
| ----- | ---------------------------------------------------------------- | -------------------------------------------- | --------------- |
| 1     | Full-bleed hero photo, gradient fade to background at the bottom | "Discover and Collaborate with Brands"       | **Get Started** |
| 2     | Three circular photo cutouts                                     | "Monetize Your Journey as a Content Creator" | **Next**        |
| 3     | Four rotated "fanned" card photos behind a bordered hero card    | "Manage Brand Collaboration"                 | **Next**        |

All three share the same description copy in Figma ("Working with Salman Muktadir was an absolute pleasure! They brilliantly promoted our.") and the same pagination-dot row (active dot = `palette.primary[400]` pill, inactive = `palette.gray[100]` dot).

**Note on button labels:** Figma literally labels slide 1's button "Get Started" and slides 2–3 "Next" (confirmed via screenshot) — the reverse of the more common "Next, Next, Get Started" pattern. This is implemented exactly as designed rather than silently "corrected". Regardless of label text, the button on the last slide always advances to `/auth`.

## States

- Horizontal paging via `ScrollView` (`pagingEnabled`), tracked by `onMomentumScrollEnd` — no separate library dependency was added (`react-native-reanimated`/`gesture-handler` are present but unnecessary for simple paging).
- Swiping and tapping the button both change the active slide/dot.

## Navigation

- **Entry:** from `/onboarding` (Intro) auto-advance.
- **Exit:** the visible slide's button advances to the next slide (animated scroll), or — on the last slide — replaces the route with `/auth`.
