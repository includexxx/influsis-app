# Basics

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Figma nodes**     | [`6525:6020`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6525-6020&m=dev) (empty), [`6525:6077`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6525-6077&m=dev) (photo uploaded), [`6521:5770`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6521-5770&m=dev) (title filled) |
| **Route**           | `/create` (`app/(details)/create.tsx`)                                                                                                                                                                                                                                                                                                                                                                                              |
| **Scene**           | `scenes/main/CreateGigBasics.tsx`                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Components used** | `ScreenHeader`, `TextField`, `Button`, `OptionSheet` (existing); `ImageUploader`, `CustomSelectField` (new)                                                                                                                                                                                                                                                                                                                                              |

## Purpose

Step 1 of 3. Cover photo/video, service title, category, and a free-text description.

## UI elements

- `ScreenHeader` — back chevron + centered "Create new gig" title, with a thin divider rule beneath it (Figma "Line 10").
- `ImageUploader` — dashed pink drop-zone (empty) that opens the device photo library; once a photo is picked, swaps to a 148x148 preview with a green checkmark badge and a "Change Image" pill.
- `TextField` "Service Title" — single line, no placeholder (Figma's own box is blank).
- `CustomSelectField` "Category" — boxed trigger showing the selected category (or "Select category"); pressing it opens the scene-owned `OptionSheet` pill list of category options (`data/gigCategories.ts`), the same picker Edit Profile's Gender field uses.
- `TextField` "Description" — multiline, placeholder "Describe your service in detail..".
- "Next" primary button — disabled until a cover photo, title, category, and description are all present.

## States

| State         | Trigger                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| Cover empty   | initial - dashed drop-zone (Figma `6525:6020`)                          |
| Cover filled  | photo picked - preview + "Change Image" (Figma `6525:6077`/`6521:5770`) |
| Next disabled | any of cover photo / title / category / description is empty            |

## Scope notes

No image-picker library existed in the project - `expo-image-picker` was added (`app.config.ts`'s plugin list includes it with a photo-library permission string). `ImageUploader` requests photo-library permission and silently no-ops if denied, matching this project's existing pattern of not building custom permission-denied UI anywhere else. Category options aren't specified in Figma (placeholder-only field) - see the flow [README](./README.md) "Cross-cutting scope notes" for why `data/gigCategories.ts` reuses the profile-verification category list.

## Navigation

- **Entry:** the main tab bar's "Create Gig" button (`app/(main)/_layout.tsx`'s `create-gig` tab's `tabPress` listener, which redirects to `/create`).
- **Exit:** "Next" → `router.push('/create-gig-pricing')`.
