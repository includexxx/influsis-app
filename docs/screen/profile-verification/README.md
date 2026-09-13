# Screen Specs — Profile Verification Flow

> **Superseded by the creator onboarding wizard (build-plan item 20).** The
> screens and Redux slice described here were removed in 20a; the
> post-registration flow is now `app/(auth)/creator-onboarding.tsx` /
> `scenes/creator-onboarding/*`, specified in `creator-onboarding-requirements.md`.
> These specs are kept for design/history reference only.

Source: [Influsis Project — Brand & App Version (Figma)](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6449-5583&m=dev)

This is the second product flow implemented on top of [`docs/screen/auth`](../auth/README.md). It runs immediately after a new account finishes sign-up ([`verify-otp.md`](../auth/verify-otp.md)'s "Account Created Successfully" popup) and walks a newly-created creator through a 5-step profile wizard — date of birth, content categories, social media, languages, and a final "about you" pair of screens (bio + username) — before landing on a completion screen.

## Flow

```
/auth/verify-otp (flow=signup)
  │  Verify → "Account Created Successfully" SuccessSheet → Next
  ▼
/profile-verification/date-of-birth        (1 of 5)
  │  Next
  ▼
/profile-verification/categories            (2 of 5)
  │  Next
  ▼
/profile-verification/social-media          (3 of 5)
  │  Next
  ▼
/profile-verification/languages             (4 of 5)
  │  Next
  ▼
/profile-verification/bio                   (5 of 5)
  │  Next
  ▼
/profile-verification/username              (5 of 5)
  │  Next
  ▼
/profile-verification/completed
  │  Explore
  ▼
/(main)/home   (see docs/screen/main/README.md)
```

- The `5 of 5` step counter covers date-of-birth through languages, then stays at `5 of 5` for **both** the bio and username screens — Figma names both frames `Profile_5` and gives both a fully-filled progress bar, i.e. they're treated as two halves of the same final step rather than steps 6 and 7. See ["Scope notes"](#cross-cutting-scope-notes) below.
- Every step's answer is written to `slices/profileVerification.slice.ts` (Redux) as the user progresses, so answers survive back/forward navigation between the 7 screens, and are read back out by the main app's Profile tab (`scenes/main/Profile.tsx`). Like the auth flow, nothing is persisted to storage or sent to a backend (see `docs/PRD.md` §2.2/§4.1) — reloading the app resets the wizard.
- Back navigation is native-only (hardware back / swipe-back gesture) — Figma's frames for this flow have no in-screen back chevron, unlike the auth flow's `AuthHeader`.

## Screens

| # | Screen | Spec | Route |
|---|---|---|---|
| 1 | Date of birth | [date-of-birth.md](./date-of-birth.md) | `/profile-verification/date-of-birth` |
| 2 | Content categories | [categories.md](./categories.md) | `/profile-verification/categories` |
| 3 | Social media | [social-media.md](./social-media.md) | `/profile-verification/social-media` |
| 4 | Languages | [languages.md](./languages.md) | `/profile-verification/languages` |
| 5 | Bio | [bio.md](./bio.md) | `/profile-verification/bio` |
| 6 | Username | [username.md](./username.md) | `/profile-verification/username` |
| 7 | Completed | [completed.md](./completed.md) | `/profile-verification/completed` |

## Cross-cutting scope notes

- **No real backend.** As with the auth flow, there's no API to submit the finished profile to — advancing through all 7 screens just accumulates local Redux state, which the main app's Profile tab reads directly out of Redux rather than an API response. Replace this with a real submission/fetch call once `docs/PRD.md` Epic 3 lands.
- **Reused components.** `ProfileStepHeader` (progress bar + "X of 5" + title + description) and `SelectableListItem` (icon + label, toggleable pink border) are new reusable components shared across all 6 wizard screens — see `components/elements/ProfileStepHeader` and `components/elements/SelectableListItem`. `TextField`, `Button`, and the shared `styles/` fragments (`layoutStyle`, `buttonStyle`) are reused as-is from the auth flow; `TextField` gained a small `leftAdornment` prop (mirroring its existing `rightAdornment`) for the username field's "Influsis.com/" prefix.
- **Date picker.** Figma's date-of-birth screen (node `6001:38419`) shows a desktop-style Material "Docked Input Date Picker" calendar expanded inline. That's a Figma UI-kit desktop component, not a realistic mobile pattern, and no calendar/date-picker dependency existed in the project. Rather than pull in a native date-picker package (which lacks web support, breaking this app's third target platform), `DateField` + `CalendarPicker` were built from scratch: a collapsed field matching the Figma "closed" state exactly, opening a custom month-grid calendar in a `BottomSheet` (reusing the existing, previously-idle `BottomSheet` component — see `docs/screen/auth/README.md`'s note on `SuccessSheet` doing the same). The month/year dropdown carets shown in Figma are decorative here; only the prev/next chevrons are wired up. See [date-of-birth.md](./date-of-birth.md) for detail.
- **Icons/images.** Extracted from Figma via the Dev Mode MCP server into `assets/images/profile-verification/` (category icons, TikTok/YouTube/Likee logos, language flags, calendar chevrons, the completion confetti image). The Facebook and Instagram icons, and the green success-check badge icon, are reused from the existing `assets/images/icons/` set rather than re-extracted, since Figma reuses the same glyphs.
- **Duplicate "Health" category.** Figma's content-categories frame (node `6243:5491`) lists "Health" twice (nodes `6245:5627` and `6243:5573`, identical icon and label). Treated as a design duplicate and collapsed to one "Health" option.
- **Multi-select, not single-select.** Every Figma screenshot for categories/social-media/languages shows only one row in the "selected" (pink border) state, but that's just the Figma mock's example state, not a hard single-choice constraint — a creator plausibly creates content in several categories, is active on several platforms, and speaks several languages. All three screens are implemented as independent multi-select toggles (`SelectableListItem`'s `selected` prop per row), each requiring at least one selection before "Next" is enabled.
