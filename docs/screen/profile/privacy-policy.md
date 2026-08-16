# Screen Specs — Privacy Policy

| | |
|---|---|
| **Figma node** | [`6027:8267`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6027-8267&m=dev) — "106_Light_settings, privacy policy" |
| **Route** | `/privacy-policy` (`app/(details)/privacy-policy.tsx`) |
| **Scene** | `scenes/main/PrivacyPolicy.tsx` |
| **Components used** | `ScreenHeader` — existing, reused |

## Purpose

A single static content screen: the app's privacy policy text. Opened from the Account screen's "Privacy Policy" row.

## User flow

```
/profile
  │ tap "Privacy Policy" row
  ▼
/privacy-policy
  │  scrollable static content, no interactive elements
  │
  └─ back chevron (ScreenHeader) → router.back() to /profile
```

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Privacy Policy" title | `ScreenHeader` |
| 2 | Heading | "Rules for platform" | — |
| 3 | Intro | "When you use our app, we may collect the following types of personal information:" | — |
| 4 | Bullet list | 3 bulleted items, each a bold label + description (Device / Usage / Personal Information) | — (inline, see Scope notes) |

## Scope notes

- **Rendered once, not twice.** Figma's own frame repeats the entire heading/intro/bullet-list block twice back-to-back (node `6027:8300`, a duplicated content group sitting directly below the first copy) - the same kind of copy-paste content error already normalized away elsewhere in this project (`data/campaigns.ts`'s "About the brand" note). Implemented as a single copy.
- **Not built on the existing `BulletList` component.** Each bullet here is a **bold label + regular-weight description in the same line** ("**Device Information**: We may collect..."), which `BulletList` (`items: string[]`, built for Gig Details' plain bullet copy) has no way to express - forcing it in would mean either losing the bold label or overloading that component's simple shape for one screen. Rendered inline instead with a small local `{ label, text }[]` array and a nested bold `Text`, keeping `BulletList` itself unchanged and still simple for its existing callers.

## Navigation

- **Entry:** "Privacy Policy" row on `/profile` (`scenes/main/Profile.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to `/profile`.
