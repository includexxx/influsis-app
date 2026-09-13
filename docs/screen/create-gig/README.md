# Screen Specs — Create Gig Flow

Source: [Influsis Project — Brand & App Version (Figma)](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6525-6020&m=dev)

A 3-step wizard a creator uses to publish a new gig, opened from the main tab bar's "Create Gig" button: cover photo + basic info, pricing + package details, then a preview that doubles as the post-submission "Pending" view. Ends with a "Congratulation" success popup.

## Flow

```
(main) tab bar "Create Gig" button (tabPress intercepted, app/(main)/_layout.tsx)
  ▼
/create                              Basics       (1 of 3)   [(details) group - no tab bar]
  │  cover photo, service title, category, description
  │  Next
  ▼
/create-gig-pricing                  Pricing      (2 of 3)
  │  price, delivery time, "What's Included" features, "Requirements for buyers"
  │  Next
  ▼
/create-gig-preview                  Preview      (3 of 3)
  │  Next (publishes the draft)
  ▼
dispatch(submit()) → status: 'pending'
  │  SuccessSheet "Congratulation" popup opens in place
  │  View Gig (closes the popup - no navigation)
  ▼
/create-gig-preview                  same screen, now read-only
  (StatusBadge "Pending" replaces the edit icon; Next button is gone)
```

- All 3 screens live in the `(details)` route group (`app/(details)/create.tsx`, `create-gig-pricing.tsx`, `create-gig-preview.tsx`) rather than `(main)` — the same reasoning as every other `(details)` screen (gig/brand/campaign/influencer details, chat, notifications, ...): they push onto the root `Stack` with no tab bar mounted underneath, unlike a real `(main)` Tabs destination. Route groups are invisible in the URL, so the paths stay `/create`, `/create-gig-pricing`, `/create-gig-preview` regardless of which group the files live in - the tab bar's `tabPress` listener's `router.push('/create')` and every step's own `router.push(...)` calls needed no changes.
- Every field is written to `slices/createGig.slice.ts` (Redux) as the creator progresses, so answers survive back/forward navigation between the 3 screens — the same pattern `slices/profileVerification.slice.ts` established for the profile-verification wizard. Nothing is persisted to storage or sent to a backend (see `docs/PRD.md` §2.2/§4.1); reloading the app resets the draft.
- Unlike profile-verification, none of these 3 screens have a Figma progress-bar/stepper — the header is just "< Create new gig" (`ScreenHeader`) on every step, so no `ProfileStepHeader`-style component was added here.
- The preview step (`/create-gig-preview`) is **one scene handling two Figma frames**: the in-progress preview (node `6058:6342` - edit icon, "Next" button) and the post-submission "Pending" view (node `6549:5925` - `StatusBadge`, no button) are the same route, switched by `createGig` slice's `status` field rather than a 4th route. See [preview.md](./preview.md).

## Screens

| # | Screen | Spec | Route |
|---|---|---|---|
| 1 | Basics (cover photo, title, category, description) | [basics.md](./basics.md) | `/create` |
| 2 | Pricing & details | [pricing.md](./pricing.md) | `/create-gig-pricing` |
| 3 | Preview / Pending | [preview.md](./preview.md) | `/create-gig-preview` |

## Cross-cutting scope notes

- **No real backend.** As with every other flow, there's no gigs-submission API (`docs/PRD.md` §2.2/§4.1) — "publishing" a gig just sets `createGig` slice's `status` to `'pending'` and assigns a local id (`nanoid()`). The submitted gig is **not** written into `data/gigs.ts` (that file is static mock data for already-live gigs elsewhere in the app, e.g. Home's "Top Gigs" row) — it exists only in the `createGig` slice for the duration of the session. The Order tab, where a creator's own gigs would eventually list, is still a placeholder (`docs/screen/main/README.md`), so nothing else needs to read this draft yet.
- **Draft isn't reset after publishing.** Nothing in Figma specifies an exit point from the flow after "Congratulation," so re-opening "Create Gig" from the tab bar after a successful publish reopens the same now-`pending` draft rather than a blank form. A `reset()` reducer already exists on the slice (mirroring `profileVerification.slice.ts`'s) for whenever a "create another gig" entry point is designed.
- **Reused components.** `ScreenHeader` gained an optional `rightElement` prop (edit icon on the draft preview, `StatusBadge` on the pending view — previously it only ever rendered an empty spacer or nothing on that side). `SuccessSheet` gained optional `buttonStyle`/`buttonTitleStyle` overrides for the "Congratulation" popup's gray "View Gig" button, since every other `SuccessSheet` caller uses the default pink primary button. `StatusBadge` gained an optional `textColor` prop for the "Pending" pill's orange label (every prior status this component rendered used the default near-black text). `InfoCard`'s `description` prop was made optional, since this flow's "What I will create" cards are single-line (title only), unlike the pre-existing Gig Details screen's two-line service cards. `TextField` gained an optional `labelStyle` prop for this flow's larger 19px field-section labels (distinct from `TextField`'s existing 14px default, used elsewhere for form labels like "Email"). The preview step otherwise reuses `scenes/main/GigDetails.tsx`'s own components as-is: `InfoCard`, `BulletList`, and `styles/gigDetails.ts`'s `gigDetailsStyle`, since both screens share the same hero-image + price-row + service-cards + bullets layout.
- **New components.** `ImageUploader` (fills the previously-empty `components/elements/ImageUploader` stub) — the cover photo/video picker, wired to the newly-added `expo-image-picker` dependency (no image-picker library existed in the project before this flow). `SelectField` — a generic single-select dropdown (field + `BottomSheet` option list), since no dropdown/picker component or library existed; the project's only prior "pick one" UI, `SelectableListItem`, is multi-select and icon-based. `Checkbox` — a small toggle box for the "What's Included" feature rows. `AddItemButton` — the "+ Add feature" ghost link, reused for both the "What's Included" and "Requirements for buyers" lists.
- **Category options.** Figma's "Category" field (node `6525:6068`) shows only the empty "Select category" placeholder — no option list is specified. `data/gigCategories.ts` reuses the same category labels as the profile-verification flow's content-categories step (`scenes/profile-verification/ContentCategories.tsx`), so a creator's gig categories line up with the content categories they picked during onboarding, rather than inventing an unrelated taxonomy. The picker itself is now Edit Profile's `OptionSheet` (pill rows in a `BottomSheet`, owned by the scene) rather than `SelectField`'s own sheet, so both flows pick from one list UI; the boxed "Category" trigger is unchanged and lives in `CustomSelectField`.
- **"What's Included" checkbox semantics.** Figma's empty state (node `6301:8033`) shows 3 unchecked rows; its filled example (node `6525:6237`) shows all 3 checked with platform-post text and small platform-logo icons instead of a checkbox. Since per-feature platform icons aren't a specified, extractable icon set (just one filled example, not a picker), the checkbox is implemented as a plain "include this feature in the published gig" toggle (`Checkbox` component) rather than a platform selector — the preview step only shows features that are both checked and non-empty.
- **"Requirements for buyers" modeled as a list, not free text.** Figma shows one textarea + an "Add feature" link beneath it (node `6301:8093`) - matching the "What's Included" list's shape one level up (add another row), so it's modeled the same way in the slice (`requirements: GigListItem[]`), just without the checkbox.
- **Icons.** Extracted from Figma via the Dev Mode MCP server into `assets/images/create-gig/` (upload-cloud, upload-success-check, checkbox-checked, add-feature, edit-icon) — all originally exported as SVG and rasterized to PNG at 4x (matching this project's established icon convention: PNG-only, no `react-native-svg` dependency; see `assets/images/icons/back-chevron.png`'s own resolution). The header back chevron reuses the existing `assets/images/icons/back-chevron.png` (`ScreenHeader`) rather than re-extracting an identical glyph; the "Congratulation" popup's green tick-square badge reuses the existing `assets/images/icons/success-check.png` (`SuccessSheet`) for the same reason.
