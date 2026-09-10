# Creator Onboarding — User Flow, Guidelines & Requirements

**Creator Marketing Platform — Bangladesh V1**
**Module:** Creator Mobile App — Onboarding Flow
**Version:** Draft v1 (compiled from working session)

---

## 1. Purpose

Define the complete creator onboarding flow (post-signup, pre-first-campaign-application) — the data captured, screen sequence, validation rules, and edge cases — so that creator profiles carry enough structured information for the platform's matching engine (category, location, deliverables) to function as designed, while keeping friction low for nano/first-time creators.

This flow feeds directly into:

- **Search & Discovery** (matching logic — category, location, deliverables)
- **Public Creator Profile** (photo, portfolio, bio, username/handle)
- **Verification Queue** (name, identity-adjacent basics)

---

## 2. Screen-by-Screen Flow

> Build-plan 20h split the old combined "Content Category" screen into two
> steps (Categories, then Subcategories), so the flow is nine screens and the
> later screens shifted down by one.

| #   | Screen            | Fields                                           | Mandatory?                |
| --- | ----------------- | ------------------------------------------------ | ------------------------- |
| 1   | Basic Information | Name, Gender, Date of Birth                      | Yes                       |
| 2   | Location          | Country, State/Division, City, Zip/Postal Code   | Yes (Zip optional)        |
| 3   | Content Category  | Category (multi-select)                          | Yes (min 1)               |
| 4   | Subcategories     | Subcategory per selected category                | Yes (min 1 per category)  |
| 5   | Languages         | English, Spanish, French, Russian, Hindi, Others | Yes (min 1)               |
| 6   | Deliverables      | Deliverable types offered (multi-select)         | Yes (min 1)               |
| 7   | Profile Picture   | Upload photo                                     | Recommended, skippable    |
| 8   | Portfolio         | Multiple content links + thumbnails              | Optional, strongly nudged |
| 9   | Username          | Unique handle (`@username`)                      | Yes — final step          |

Progress indicator: `X of 9` at top of each screen, matching existing design pattern (pink progress bar, `Next` CTA).

---

## 3. Screen Details

### Screen 1 — Basic Information

**Fields:**

- Name (text input)
- Gender (select — Male / Female / Other / Prefer not to say)
- Date of Birth (date picker, MM/DD/YYYY — existing pattern)

**Rules:**

- Age eligibility check against platform minimum age at DOB entry (reject/flag underage signups per platform policy).
- All three fields mandatory before `Next` enables.

---

### Screen 2 — Location

You can study this C:\Users\Auto PC 2\Documents\influsis\web\src\features\onboarding\components\steps\business-basics-step.tsx for Locations screen implements

**Fields:**

- Country (dropdown — **V1: Bangladesh pre-selected/locked**, no other options, to avoid mixed data formats pre-launch)
- State/Division (dropdown — labeled "State/Division"; populated with BD Divisions for V1: Dhaka, Chattogram, Khulna, Rajshahi, Barishal, Sylhet, Rangpur, Mymensingh. Field is reused as "State" when future country expansion — e.g., US — is added.)
- City (text input or dropdown, dependent on Division)
- Zip/Postal Code (text input, **optional** — not universally known/used in BD, keep off critical path)

**Rules:**

- City is a **hard filter** in the matching engine (per Search & Discovery spec) — must be captured accurately.
- Country/Division schema is built expansion-ready for the platform's mid-term US launch, without exposing multi-country selection in V1 UI.

---

### Screen 3 — Content Categories

> Build-plan 20h split this into two screens: pick categories here, pick
> subcategories on Screen 4.

**Fields:**

- Categories (multi-select — existing: Education, Beauty & Lifestyle, Travel, Music, Gym & Body Building, Sports, Health, Others)

**UX Behavior:**

- Multi-select of the eight categories; at least one required before `Next` enables.
- Selecting "Others" reveals a free-text "Please specify" input for a custom category name.
- Deselecting a category drops it (and any subcategories it had picked up on Screen 4).

---

### Screen 4 — Subcategories

**Fields:**

- Subcategories (multi-select) — one checklist per category picked on Screen 3

**Suggested Subcategory Set:**

| Categories          | Subcategories                                                                         |
| ------------------- | ------------------------------------------------------------------------------------- |
| Education           | Academic/Study Tips, Language Learning, Career/Skills, Kids Education                 |
| Beauty & Lifestyle  | Skincare, Makeup, Haircare, Fashion/Styling, Home & Decor                             |
| Travel              | Local Travel (BD), International Travel, Budget Travel, Adventure/Trekking            |
| Music               | Singing, Instrumental, Covers, Music Production                                       |
| Gym & Body Building | Weight Training, Home Workout, Nutrition/Diet, Bodybuilding Prep                      |
| Sports              | Cricket, Football, Fitness Challenges, Other Sports                                   |
| Health              | Mental Health, Nutrition, Yoga/Wellness, Medical/Health Tips                          |
| Others              | Free-text input ("Please specify") which will add to the subcategories and categories |

**UX Behavior:**

- One subcategory checklist per category picked on Screen 3.
- At least 1 subcategory required per selected category before `Next` enables.
- The "Others" category shows a free-text "Please specify" subcategory field instead of a checklist.

**Matching Note:** Category = hard filter (existing). Subcategory should be implemented as a **soft ranking boost**, not an additional hard filter — over-narrowing risks empty result sets while creator density is still low post-launch.

---

### Screen 5 — Languages

**Fields:**

- Multi-select: English, Spanish, French, Russian, Hindi, Others (existing pattern)

**Rules:**

- Minimum 1 language required.
- "Others" allows free-text add.

---

### Screen 6 — Deliverables

**Fields:**

- Multi-select: Photo Post, Reel, Video, Story, Blog, Live

**Rules:**

- Minimum 1 required.
- Feeds campaign-to-creator matching (deliverable type fit) and is shown on the public profile/discovery card.

_(Note: Rate range per deliverable was considered and explicitly removed from this flow — not collected at onboarding.)_

---

### Screen 7 — Profile Picture

**Fields:**

- Photo upload (single image)

**Rules:**

- Recommended, skippable — but flagged in UI as needed for discovery card display and verification credibility.

---

### Screen 7 — Cover Picture (same step)

**Fields:**

- Cover Photo upload (single image)

**Rules:**

- Recommended, skippable — but flagged in UI as needed for discovery card display and verification credibility.

---

### Screen 8 — Portfolio (step 8 in the wizard)

**Fields (repeatable entry):**

- Content link (URL — Instagram post, YouTube video, TikTok, etc.)
- Thumbnail preview (auto-fetched from link; manual image upload fallback)
- Platform tag (auto-detected from link, or manual dropdown: Instagram / YouTube / TikTok / Others)

**UX Behavior:**

- "Add Portfolio" button creates a new entry card.
- "+ Add Another" for additional entries — no hard limit; UI shows ~5–6 before scroll.
- Delete (×) icon per entry.
- Multiple entries supported (this is a multi-entry screen, not single-link).

**Rules:**

- **Optional but strongly nudged** — if user attempts to proceed with 0 entries, show a soft prompt (non-blocking): _"Adding at least one sample helps you get 3x more responses."_
- No hard minimum enforced (protects nano/first-time creators with no existing portfolio from being blocked at signup).

**Edge Cases:**

| Scenario                             | Handling                                                       |
| ------------------------------------ | -------------------------------------------------------------- |
| Invalid/broken link pasted           | Inline validation — "This link doesn't look valid"             |
| Thumbnail fetch fails                | Fallback to generic platform icon; manual image upload offered |
| Duplicate link added                 | Soft warning — "You've already added this link" (not blocked)  |
| Zero portfolio items, user taps Next | Soft nudge shown, not blocked                                  |

---

### Screen 9 — Username (Final Screen)

**Fields:**

- Username input, `@` prefix fixed in UI

**Rules:**

- Real-time availability check (debounced on typing pause) — green ✓ / red ✗ indicator.
- Auto-suggested alternatives shown when taken (e.g., name + number, name + city).
- Validation: lowercase letters, numbers, underscore, period only; 3–20 characters; cannot start/end with period or underscore; no spaces/special characters.
- Shared namespace check across **both** business and creator accounts (no handle collisions across account types).
- Username becomes the public profile handle (`platform.com/@username`) — independent of Name; does not auto-update if Name is edited later.
- Final CTA: `Finish` → onboarding complete → profile created → routes to main app.

## Check Handle Availability Backend API

Case-insensitive lookup against the global handle namespace. Used for live validation on the
handle-claim form.

**Endpoint:** `GET /api/v1/handles/{handle}/availability`

**Access:** Public

**Role Can Access Only:** None (public).

### Headers

| Name           | Required | Description        |
| -------------- | -------- | ------------------ |
| `Content-Type` | No       | `application/json` |

### Path Parameters

| Name     | Type   | Description                              |
| -------- | ------ | ---------------------------------------- |
| `handle` | string | Candidate handle, without a leading `@`. |

### Query Parameters

None.

### Request Body

None.

### Responses

**200 OK — available**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Handle availability checked.",
  "data": { "available": true },
  "meta": null,
  "requestId": "d4ea9bbc-3435-4ec9-8e25-0e8fb3eab5f0",
  "timestamp": "2026-08-31T11:01:27.460Z",
  "path": "/api/v1/handles/totally-free-handle/availability"
}
```

**200 OK — not available**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Handle availability checked.",
  "data": { "available": false, "reason": "reserved" },
  "meta": null,
  "requestId": "ec7e6ead-e8e4-4e02-a29d-4c8ebe0f2bc7",
  "timestamp": "2026-08-31T11:01:27.702Z",
  "path": "/api/v1/handles/admin/availability"
}
```

`reason` is `taken` (claimed by another account) or `reserved` (a platform name — the seed reserves
`admin`, `support`, `influsis`, `help`, `api`, `root`, `moderator`). Unavailability is **200 with
`available: false`**, not an error status.

**422 Unprocessable Entity** — handle fails a format check (`errors: {"handle": "invalidFormat"}`).

---

## 4. Deferred / Explicitly Removed From This Flow

- **Social media account connection (OAuth)** — removed from onboarding per latest decision. ⚠️ **Open dependency risk:** follower count, engagement rate, and social-ownership verification were originally meant to be sourced here. These now have no other capture point defined. Needs a decision: move to a post-onboarding "Connect Accounts" prompt in the main app, or accept manual/self-reported follower count elsewhere. This also affects **Performance Reporting** (Epic E9) and **Creator Verification** (Admin Manual §9.1.4), both of which assume a connected social account.
- **Rate range per deliverable** — removed from Screen 5; not collected at onboarding. Can be added later via profile settings or left for Rate Intelligence to infer from transaction data.

---

## 5. Design Guidelines

- Follow existing visual pattern: pink progress bar (top), step counter (`X of 9`, top-right), pink primary CTA button (bottom, full-width), light gray placeholder text, white background, rounded input fields.
- Every screen retains a short one-line supporting subtext under the headline (consistent with existing screens' explanatory copy, e.g., "Businesses seek creators within age ranges for campaign").
- `Next` button stays disabled (greyed) until that screen's mandatory fields are valid — consistent with current Screen 5 (Languages) greyed-Next behavior shown in existing designs.
- Back navigation available on all screens except Screen 1.
- Progress bar must reflect 8 total steps once implemented (existing designs show 5 — needs updating across all screens).

---

## 6. Open Questions for Product/Design Sign-off

1. **Social account connect** — confirm whether this is deferred to a post-onboarding step, or genuinely removed from V1 scope (impacts Performance Reporting & Verification).
2. **Age eligibility** — confirm minimum age policy for creator signup, and whether DOB should hard-block or soft-flag underage entries.
3. **Portfolio minimum** — confirm 0-minimum (nudge-only) is acceptable for launch, vs. a soft minimum for certain creator tiers.
4. **Username collisions with future business namespace** — confirm shared namespace decision is final before backend schema is locked.
