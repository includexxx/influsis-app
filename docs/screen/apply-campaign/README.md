# Screen Specs — Apply Campaign

| | |
|---|---|
| **Figma nodes** | [`6011:8293`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6011-8293&m=dev) (cover image + one link), [`6393:7254`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6393-7254&m=dev) (empty dropzone + two links), [`6393:7407`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6393-7407&m=dev) (uploaded file row), [`6007:8645`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6007-8645&m=dev) ("Successful!" popup) — all named "Apply campaign" |
| **Route** | `/campaign/[id]/apply` (`app/(details)/campaign/[id]/apply.tsx`) |
| **Scene** | `scenes/main/ApplyCampaign.tsx` |
| **Data** | `data/campaigns.ts` (`allCampaigns`) |
| **Components used** | `Image`, `TextField`, `Button`, `SuccessSheet` (existing, reused from Create Gig); `Checkbox` (existing, reused from Create Gig); `FilePicker`, `FileUploadItem` (new, `components/elements/`) |

## Purpose

A single-screen application form a creator submits to a campaign: a read-only recap of what they're applying to, a portfolio file upload (multiple files, each shown as a progress row), two portfolio/social-media link fields, and an "Apply Now" CTA that opens a "Successful!" confirmation popup.

## Related screen: Applications (Applied / Request)

A separate screen, [campaign-list.md](./campaign-list.md) (Figma nodes `6015:7090` / `6475:6394`, route `/applications`), shows what a creator can check *after* applying: an "Applied" tab listing their own submitted applications, and a "Request" tab listing invitations brands have sent them, with Accept/Decline actions. It's reached from Profile, not chained directly onto this screen's "Successful!" popup — see that doc's own user flow.

## User flow

```
/campaign/[id]  (Campaign Details)
  │ tap "Apply Now"
  ▼
/campaign/[id]/apply
  │  pick portfolio files (FilePicker → FileUploadItem rows)
  │  fill in 1-2 portfolio links
  │  tap "Apply Now" (enabled once ≥1 file and ≥1 link are present)
  ▼
SuccessSheet "Successful!" popup opens in place
  │  "Go to campaign" → router.back()
  ▼
/campaign/[id]  (back on Campaign Details)
```

`/campaign/[id]/apply` is a nested dynamic route alongside the existing `/campaign/[id]` (`app/(details)/campaign/[id].tsx` file + `app/(details)/campaign/[id]/apply.tsx` directory coexist under the same parent, a standard Expo Router pattern), inside the `(details)` route group — same "no tab bar" reasoning as every other `(details)` screen.

## Sections (top to bottom)

| # | Section | Layout | Component |
|---|---|---|---|
| 1 | Header | Bare back chevron, no title (unlike every other screen's `ScreenHeader`) | `Image` + `Pressable` |
| 2 | "Make your application" heading | Page heading | — |
| 3 | Campaign recap | 3 read-only tinted fields: campaign title, about, budget | — |
| 4 | Showcase your top work | Section title + drop-zone + a row per picked file | `FilePicker`, `FileUploadItem` |
| 5 | Portfolio Links | Section title + 2 link fields | `TextField` ×2 |
| 6 | Apply Now | Primary button, inline at the end of the scrollable content (not a fixed footer, matching Figma's own grouping) | `Button` |
| 7 | Success popup | Green tick badge, "Successful!", confirmation copy, gray "Go to campaign" button | `SuccessSheet` |

## New components

- **`FilePicker`** (Figma "_File upload base" empty state, e.g. node `6393:7436`) — a dashed drop-zone trigger, visually identical to `ImageUploader`'s empty state but generic (no built-in preview/replace behavior) since this screen needs a list of multiple files rather than one replaceable cover image.
- **`FileUploadItem`** (Figma "_File upload item base", node `6393:7501`) — a picked file's row: icon badge, filename + size, a progress bar, and an include/exclude `Checkbox` (reused from Create Gig's "What's Included" rows — same pink checkmark-square asset).

## Scope notes

- **No real backend or upload.** As with every other flow, there's no applications API (`docs/PRD.md` §2.2/§4.1) — "applying" just opens the success popup; nothing is sent anywhere, and picked files aren't actually uploaded (their progress bar always renders at 100%, since there's no real async upload to track — matching this project's practice of not building fake async behavior beyond what's needed).
- **Figma design-context tool unavailable for two small icons.** The Dev Mode MCP server's `get_design_context` tool (which returns exact exported asset URLs) timed out consistently for this screen's file-type glyph (Figma node `6393:7526`, inside `FileUploadItem`'s icon badge) despite repeated retries at decreasing node sizes — metadata and screenshots (which stayed available throughout) confirm its position/color but not its exact vector path. Per this project's icon-sourcing rule (never hand-draw an approximation of a vector glyph), `FileUploadItem` uses `@expo/vector-icons`' Feather `"file"` icon instead — the first use of that already-installed-but-previously-unused dependency (see `CLAUDE.md`'s "Reuse First" — no *new* dependency was added). Every other icon on this screen (upload-cloud, the checkbox, the back chevron, the success tick) reuses an asset already extracted for Create Gig or the app shell, so this is the only asset gap.
- **The 3 campaign-recap fields are read-only, not editable inputs.** All three (`campaign.title`, `campaign.about`, `campaign.budget`) render in the same muted gray-filled box style across all 3 Figma mockups, never switching to an active bordered/white "input" look the way Create Gig's genuinely-editable fields do — so they're implemented as plain recap text, not `TextField`s. Figma's own example copy for the middle field ("I will create fitness video to showcase our new summer collection") reuses first-person gig-pitch phrasing from elsewhere in this Figma file rather than campaign-brief-style copy, reinforcing that these are placeholder/mock text, not a real distinguishable field — `campaign.about` was the closest existing `Campaign` field to reuse there.
- **Portfolio Links is fixed at 2 fields, no "Add link".** Unlike Create Gig's "What's Included"/"Requirements for buyers" lists (which have an explicit "+ Add feature" affordance), Figma shows a static 1-or-2-field count across its 3 mockups with no add-another control — implemented as exactly 2 static `TextField`s.
- **Portfolio file upload supports multiple files.** Figma's 3 mockups show two different upload UI treatments for "Showcase your top work": a single 148x148 image-preview (node `6011:8905`, reusing the exact same `_File upload base` component instance as Create Gig's cover photo) and a multi-file drop-zone-plus-progress-row list (node `6393:7501`, a distinctly-named, more fully-built component). The single-image variant is treated as an earlier draft that reused Create Gig's component as a placeholder before the richer, purpose-built multi-file pattern was designed — "top work" (portfolio evidence) fits multiple files better than Create Gig's single required cover photo, so this screen implements the multi-file pattern only.
- **Success popup copy isn't Figma's literal placeholder text.** Figma's popup body is literal "Lorem Ipsum is simply dummy text of the printing and typesetting industry." — unfinished designer filler, not real copy (unlike Create Gig's "Congratulation" popup, whose text is real, deliberate copy preserved verbatim). Real copy was written instead: "Your application has been submitted. The brand will be in touch if you're a good fit."
- **"Go to campaign" closes the popup and goes back, it doesn't push a new screen.** Since this screen was pushed *from* Campaign Details, `router.back()` already lands back on the same campaign — no new navigation target needed, the same reasoning Create Gig's "View Gig" button used to just close its own success popup in place.
- **Campaign Details' "Apply Now" is now wired.** `docs/screen/campaign-details/README.md` previously documented "Apply Now" as visual-only (no application flow existed) — it now calls `router.push(\`/campaign/${campaign.id}/apply\`)`; see that doc's updated scope note. "Visit website" remains inert (still out of scope — no `Linking` pattern exists in this app yet).

## Navigation

- **Entry:** "Apply Now" on `/campaign/[id]` (`scenes/main/CampaignDetails.tsx`).
- **Exit:** back chevron → `router.back()`; or "Apply Now" → success popup → "Go to campaign" → `router.back()`.
