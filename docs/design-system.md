# Design System

| | |
|---|---|
| **Source** | [Influsis Project — Brand & App Version (Figma)](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=1259-595&m=dev) — "Foundations" page |
| **Extracted** | 2026-08-11 |
| **Code location** | `theme/` (tokens), `hooks/useTheme.ts` (resolver hook) |

This document is the reference for every design token used in the app: colors, typography, spacing, radius, and shadows. It mirrors what's implemented in `theme/` — if the two ever disagree, `theme/` is the source of truth for code, and this file should be updated to match.

## How to use it

Prefer the `useTheme()` hook in components — it resolves the correct light/dark colors for you and bundles the rest of the tokens:

```tsx
import { useTheme } from '@/hooks';

function Card() {
  const { colors, spacing, radius, shadows, typography } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.lg,
        },
        shadows.sm,
      ]}>
      <Text style={[typography.textLSemibold, { color: colors.text.primary }]}>Title</Text>
    </View>
  );
}
```

For values that don't depend on light/dark mode (e.g. a fixed brand color, or building a `StyleSheet.create` outside a component), import the raw tokens directly from `@/theme`:

```tsx
import { palette, spacing, radius } from '@/theme';

const styles = StyleSheet.create({
  badge: {
    backgroundColor: palette.primary[500],
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
  },
});
```

> **Legacy note:** `theme/colors.ts` still exports the original boilerplate `colors` object (`purple`, `pink`, `blackGray`, etc.) for backward compatibility, but nothing in the app uses it anymore. All current screens use `palette` / `lightTheme` / `darkTheme` / `useTheme()`.

## App shell reset

The boilerplate's demo pages (Home/Profile/Details, drawer + tabs navigation, and their header/drawer chrome components) were removed to start real screen design from a blank slate — see `docs/screen/auth/README.md`, `docs/screen/profile-verification/README.md`, and `docs/screen/main/README.md` for what's been built since:

- `app/index.tsx` redirects into `/onboarding` → the auth flow → the profile-verification wizard → `app/(main)/**`, a real (if still placeholder-content) Tabs group replacing the original drawer/tabs shell — Home / Order / Create Gig / Message / Profile, matching Figma's tab bar (node `6355:6595`).
- `app/+not-found.tsx` — Expo Router's fallback for unmatched routes (kept as a safety net, themed).
- `app/_layout.tsx` — asset preload, splash screen, and the fake user fetch (unchanged infra).
- `components/elements/*` — the reusable UI kit (`Button`, `GradientButton`, `Image`, `BottomSheet`, and everything built on top of them since) is the foundation all of the above is built with.

`components/layouts/{DrawerContents,NavigationHeaderLeft,NavigationHeaderTitle}` from the original boilerplate are still removed (the new `(main)` shell is tabs-only, no drawer) but recoverable from git history (`feat/design-system` branch) if a drawer turns out to be needed later.

---

## Colors

### Primary (magenta) — `palette.primary`

| Token | Hex | |
|---|---|---|
| `primary.25` | `#FEF1F9` | |
| `primary.50` | `#FDE6F5` | |
| `primary.100` | `#FDCDEB` | |
| `primary.200` | `#FDA4DA` | |
| `primary.300` | `#FB6BC0` | |
| `primary.400` | `#F42E9E` | |
| `primary.500` | `#E51D84` | **base** |
| `primary.600` | `#C70F68` | |
| `primary.700` | `#A41057` | |
| `primary.800` | `#89124B` | |
| `primary.900` | `#540329` | |

`palette.primaryNavy` — a second accent scale found in the file (`Primary/Primary-*`), only two steps defined: `50` `#EFEFFD`, `800` `#17163A`. Used as `onPrimary` in dark mode.

### Secondary (green) — `palette.secondary`

| Token | Hex | |
|---|---|---|
| `secondary.25` | `#EEFFF4` | |
| `secondary.50` | `#D7FFE8` | |
| `secondary.100` | `#B2FFD2` | |
| `secondary.200` | `#76FFB2` | |
| `secondary.300` | `#2EF484` | |
| `secondary.400` | `#09DE67` | **base** |
| `secondary.500` | `#01B851` | |
| `secondary.600` | `#059043` | |
| `secondary.700` | `#0A7138` | |
| `secondary.800` | `#0B5C31` | |
| `secondary.900` | `#003419` | |

### Gray — `palette.gray`

| Token | Hex |
|---|---|
| `gray.25` | `#F4F4F4` |
| `gray.50` | `#E9E9EA` |
| `gray.100` | `#D2D2D5` |
| `gray.200` | `#A5A5AB` |
| `gray.300` | `#777980` |
| `gray.400` | `#4A4C56` |
| `gray.500` | `#1D1F2C` |
| `gray.600` | `#161721` |
| `gray.700` | `#0F1016` |
| `gray.800` | `#07080B` |
| `gray.900` | `#030304` |

### Error / Warning / Success

| Step | Error | Warning | Success |
|---|---|---|---|
| 25 | `#FFFBFA` | `#FFFCF5` | `#F6FEF9` |
| 50 | `#FEF3F2` | `#FFFAEB` | `#ECFDF3` |
| 100 | `#FEE4E2` | `#FEF0C7` | `#D1FADF` |
| 200 | `#FECDCA` | `#FEDF89` | `#A6F4C5` |
| 300 | `#FDA29B` | `#FEC84B` | `#6CE9A6` |
| 400 | `#F97066` | `#FDB022` | `#32D583` |
| 500 (base) | `#F04438` | `#F79009` | `#12B76A` |
| 600 | `#D92D20` | `#DC6803` | `#039855` |
| 700 | `#B42318` | `#B54708` | `#027A48` |
| 800 | `#912018` | `#93370D` | `#05603A` |
| 900 | `#7A271A` | `#7A2E0E` | `#054F31` |

### Neutrals

| Token | Hex | Notes |
|---|---|---|
| `palette.white` | `#FFFFFF` | |
| `palette.black` | `#000000` | Not used directly in semantic tokens — `gray.900` (`#030304`) is the designed "near-black". |
| `palette.neutralGray.50/100/200` | `#F0F1F3` / `#E0E2E7` / `#C2C6CE` | Secondary border/divider scale. Only these 3 steps were present in the file — treat as partial. |
| `palette.neutralBlack.light` / `.600` | `#504D55` / `#4D5464` | Neutral text/icon variants. Partial — only these 2 were present in the file. |

### Semantic tokens — `lightTheme` / `darkTheme`

These map design intent to the raw palette above and are what `useTheme().colors` returns.

| Token | Light | Dark |
|---|---|---|
| `background` | `white` | `gray.900` |
| `surface` | `gray.25` | `gray.800` |
| `card` | `white` | `gray.800` |
| `border` | `neutralGray.100` | `gray.700` |
| `divider` | `gray.50` | `gray.700` |
| `text.primary` | `gray.900` | `white` |
| `text.secondary` | `gray.400` | `gray.200` |
| `text.disabled` | `gray.200` | `gray.500` |
| `text.inverse` | `white` | `gray.900` |
| `primary` | `primary.500` | `primary.400` |
| `onPrimary` | `white` | `primaryNavy.800` |
| `secondary` | `secondary.500` | `secondary.400` |
| `error` / `warning` / `success` | `*.500` | `*.400` |
| `overlay` | `rgba(3,3,4,0.5)` | `rgba(3,3,4,0.7)` |

These semantic mappings (light/dark assignment) were **not** explicitly specified on the Figma "Colors" page (which only documents the raw scales) — they're a reasonable interpretation following common design-system convention (lighter step for light-mode surfaces, darker step for dark-mode). Revisit if the Figma file gains an explicit light/dark spec.

---

## Typography

Source: Figma text style variables bound on the "Colors" page (the only page available at extraction time — see "Known gaps" below).

| Token (`typography.*`) | Family | Weight | Size / Line height | Letter spacing |
|---|---|---|---|---|
| `displayXl` | Inter | SemiBold (600) | 60 / 72 | -2 |
| `displayM` | Public Sans | Bold (700) | 24 / 32 | 0.5 |
| `displayS` | Public Sans | Medium (500) | 20 / 30 | 0.5 |
| `displayXsRegular` | Inter | Regular (400) | 24 / 32 | 0 |
| `displayXsMedium` | Inter | Medium (500) | 24 / 32 | 0 |
| `textXl` | Inter | Regular (400) | 20 / 30 | 0 |
| `textXlUnderlined` | Inter | Regular (400) | 20 / 30 | 0 (+ underline) |
| `textLMedium` | Public Sans | Medium (500) | 16 / 24 | 0.5 |
| `textLSemibold` | Public Sans | SemiBold (600) | 16 / 24 | 0.5 |

Font family tokens: `fontFamilies.inter` (`'Inter'`), `fontFamilies.publicSans` (`'Public Sans'`), `fontFamilies.openSans` (`'Open Sans'`, the currently-loaded legacy font).

### Known gaps

- The Figma file (as linked) only exposes the **Colors** foundations page at the given node. A dedicated **Typography** page (with the full type scale, e.g. `Display 2xl`, `Text sm`/`md`, headings) likely exists in the file's "Foundations" section but wasn't reachable from the provided node/URL — the scale above is only what incidentally appears as text styles on the Colors page. Re-extract with the Typography page's node URL to complete this.
- **Inter** and **Public Sans** are *not* bundled as font assets yet — only Open Sans is (`assets/fonts/OpenSans-*.ttf`, loaded via `theme/fonts.ts#loadFonts`). Until `.ttf` files for Inter and Public Sans are added there and registered in `loadFonts()`, `typography.*` styles will silently fall back to the platform's system font (safe, but won't visually match Figma). This mirrors the PRD's existing "Epic 1: Rebrand" gap list.

---

## Spacing — `spacing`

4px-based scale. Steps marked **confirmed** were measured directly from layout gaps/padding in the Figma file; the rest extend the same progression to cover typical UI needs.

| Token | Value (px) | |
|---|---|---|
| `none` | 0 | |
| `xs` | 4 | |
| `sm` | 8 | confirmed |
| `md` | 12 | |
| `lg` | 16 | confirmed |
| `xl` | 20 | confirmed |
| `2xl` | 24 | confirmed |
| `3xl` | 32 | |
| `4xl` | 40 | |
| `5xl` | 48 | |
| `6xl` | 64 | confirmed |
| `7xl` | 80 | confirmed |
| `8xl` | 96 | confirmed |
| `9xl` | 128 | confirmed |

## Radius — `radius`

| Token | Value (px) | |
|---|---|---|
| `none` | 0 | |
| `sm` | 4 | confirmed |
| `md` | 8 | confirmed |
| `lg` | 12 | extended |
| `xl` | 16 | extended |
| `full` | 9999 | extended (pills/circles) |

## Shadows — `shadows`

Figma defines one elevation token, `Shadow/sm`, as two stacked drop shadows:

```
0px 1px 2px rgba(16, 24, 40, 0.06)
0px 1px 3px rgba(16, 24, 40, 0.10)
```

React Native has no native multi-layer shadow, so `shadows.sm` uses the more visible second layer (`shadowColor: '#101828'`, offset `{0, 1}`, radius `3`, opacity `0.10`) for iOS/web, plus an equivalent `elevation` for Android. `xs`/`md`/`lg` extrapolate the same style for elements needing less/more depth — **not** sourced from Figma, extend with care.

Use `getShadowStyle(token)` from `@/theme` to get a style object appropriate for the current platform (native shadow props, or a CSS `boxShadow` string on web).

---

## File map

| File | Contents |
|---|---|
| `theme/colors.ts` | `palette` (raw scales), `lightTheme` / `darkTheme` (semantic), legacy `colors` |
| `theme/fonts.ts` | `fontFamilies`, `typography` (text styles), font loading (`loadFonts`) |
| `theme/spacing.ts` | `spacing` scale |
| `theme/radius.ts` | `radius` scale |
| `theme/shadows.ts` | `shadows` scale, `getShadowStyle()` |
| `theme/index.ts` | Barrel export of all of the above |
| `hooks/useTheme.ts` | Resolves `lightTheme`/`darkTheme` by color scheme and bundles all tokens |
