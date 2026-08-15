# Preview / Pending

|                     |                                                                                                                                                                                                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma nodes**     | [`6058:6342`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6058-6342&m=dev) ("Gig preview", draft), [`6549:5925`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6549-5925&m=dev) ("Gig preview", Pending), [`6301:7987`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6301-7987&m=dev) ("Congratulation" popup) |
| **Route**           | `/create-gig-preview` (`app/(details)/create-gig-preview.tsx`)                                                                                                                                                                                                                                            |
| **Scene**           | `scenes/main/CreateGigPreview.tsx`                                                                                                                                                                                                                                                                        |
| **Components used** | `ScreenHeader`, `Image`, `InfoCard`, `BulletList`, `Button`, `SuccessSheet` (existing, reused from `scenes/main/GigDetails.tsx`); `StatusBadge` (existing, extended)                                                                                                                                     |

## Purpose

Step 3 of 3, plus the terminal "submitted" view of the same screen. Shows the assembled gig (cover photo, title, price, included features, description) exactly as `GigDetails` shows an already-live gig, with a "Next" button that publishes the draft.

## UI elements

- `ScreenHeader` "Gig preview" — `rightElement` is an edit-pencil icon while the draft is editable, or a `StatusBadge` "Pending" pill once submitted.
- Cover image, price row (service title + `$price`), "What I will create" `InfoCard` list (only features that are both checked and non-empty), "Description of this Gig" `BulletList` — same layout `GigDetails` uses for an already-live gig.
- "Next" primary button — publishes the draft (`dispatch(submit())`) and opens the `SuccessSheet`. Hidden once `status === 'pending'`.
- `SuccessSheet` "Congratulation" popup — green tick badge, "Your gig is under review. Gig wil be publish within 24 hours." (Figma's copy, including its typo, preserved verbatim per this project's practice of not editorializing Figma text), gray "View Gig" button.

## States

| State   | Trigger                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------- |
| Draft   | initial - edit icon, "Next" button visible (Figma `6058:6342`)                                 |
| Pending | "Next" tapped → `submit()` dispatched, `SuccessSheet` opens; "View Gig" closes it (no navigation - the screen underneath is already showing the Pending state, Figma `6549:5925`) |

## Scope notes

The edit icon navigates back to `/create` (the basics step) rather than any single prior step, since the wizard's Redux state is centralized - a creator can re-edit any field and re-advance through Next without losing what they'd already entered on other steps. See the flow [README](./README.md) "Cross-cutting scope notes" for why this is one route/scene instead of a 4th screen, and why the submitted gig isn't written into `data/gigs.ts`.

## Navigation

- **Entry:** "Next" on `/create-gig-pricing`.
- **Exit:** none specified in Figma past "View Gig" - the screen stays in its Pending state; a creator leaves via the tab bar.
