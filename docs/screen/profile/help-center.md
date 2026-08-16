# Screen Specs — Help Center (FAQ)

| | |
|---|---|
| **Figma node** | [`6027:8303`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6027-8303&m=dev) — "103_Light_settings, help center FAQ" |
| **Route** | `/help-center` (`app/(details)/help-center.tsx`) |
| **Scene** | `scenes/main/HelpCenter.tsx` |
| **Components used** | `ScreenHeader` (existing), `AccordionItem` (new) |
| **Data** | `data/faqs.ts` |

## Purpose

A single-open-at-a-time FAQ accordion. Opened from the Account screen's "Help Center" row.

## User flow

```
/profile
  │ tap "Help Center" row
  ▼
/help-center
  │  first question starts expanded
  │  tap any question → expands it, collapses whichever was open
  │
  └─ back chevron (ScreenHeader) → router.back() to /profile
```

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Back chevron + centered "Help Center" title | `ScreenHeader` |
| 2 | FAQ list | 6 expandable question/answer rows, first expanded by default | `AccordionItem` ×6 |

## Scope notes

- **Real answer copy, not Figma's literal placeholder text.** Every one of Figma's 6 FAQ answers is the same literal "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." (unfinished designer filler) - real, question-specific copy was written instead for all 6, the same practice already established for this project's other Lorem-Ipsum-only content (e.g. Apply Campaign's success popup, `docs/screen/apply-campaign/README.md` "Scope notes").
- **6th question's title was also a placeholder** ("Question", literally) - replaced with a genuine 6th FAQ, "How do I apply to a campaign?", chosen to round out the set with a question about this app's own actual apply flow (`docs/screen/apply-campaign/README.md`) rather than inventing an unrelated one.
- **First 5 question titles are Figma's own real copy**, kept verbatim: "How influsis Works?", "Is the influsis App free?", "How can I use influsis", "How can I log out from influsis?", "How to close influsis account?" (including Figma's own missing "?" on the 3rd). Note `get_metadata` reported the file's *underlying master component* text for these ("What is BrainyBox?", "Is the BrainyBox App free?", ...) - a stale leftover from whatever template this FAQ component was copied from; the rendered screenshot is unambiguous ("influsis", not "BrainyBox") and is what's implemented, the same metadata-vs-screenshot caveat noted in `docs/screen/profile/security-settings.md`.
- **At most one item open at a time** (`expandedIndex: number | null`), matching Figma's own single-expanded default state rather than allowing every item to expand independently.
- **No real backend.** FAQ content is static mock data (`data/faqs.ts`) - there's no help-content API (`docs/PRD.md` §2.2/§4.1).

## Navigation

- **Entry:** "Help Center" row on `/profile` (`scenes/main/Profile.tsx`).
- **Exit:** back chevron (`ScreenHeader`'s `onBack`) → `router.back()` to `/profile`.
