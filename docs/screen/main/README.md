# Screen Specs — Main App Shell

| | |
|---|---|
| **Figma node** | [`6355:6595`](https://www.figma.com/design/E7VpnelWNYgzs9WoLLNeh8/Influsis-Project-Brand_App-Version?node-id=6355-6595&m=dev) — "TabBar" (4 `property1` variants: Campaign/Home Active, Order Active, Message Active, Profile Active) |
| **Route group** | `app/(main)/` (Expo Router group — segment is invisible in the URL) |
| **Layout** | `app/(main)/_layout.tsx` — `expo-router`'s `<Tabs>` |
| **Scenes** | `scenes/main/{Home,Order,Message,Profile,CreateGigBasics,CreateGigPricing,CreateGigPreview}.tsx` |
| **Components used** | `TabBarIcon`, `TabBarLabel` (new, `components/layouts/`) |

## Purpose

The tab-based shell a user lands in once they're signed in — this is the third product flow, replacing the placeholder `/welcome` screen that stood in for it (see `docs/screen/auth/README.md` and `docs/screen/profile-verification/README.md` for how a user arrives here). This doc covers the shell itself (the tab bar and navigation frame); see [`docs/screen/home/README.md`](../home/README.md) for the Home tab's own content spec.

## Tabs

| Tab | Route | Icon (inactive → active) |
|---|---|---|
| Home | `/home` | outline house → filled house, bold label |
| Order | `/order` | outline clapperboard → filled clapperboard + two accent marks, bold label |
| **Create Gig** | *(none — see below)* | circle-plus, same in both states |
| Message | `/message` | outline speech bubble → filled speech bubble, bold label |
| Profile | `/profile` | outline person → filled person (two layered glyphs), bold label |

Figma's tab bar component only defines four `property1` states — "Campaign  Active" (Home), "Order Active", "Message Active", "Profile Active" — there is no "Create Gig Active" variant. That's a real signal, not an omission: Create Gig isn't a persisted tab a user "is on", it's an action button that happens to live in the tab bar. So unlike the other four, it has:

- No active/inactive icon or label distinction — `TabBarIcon`'s `create-gig` case always renders the same glyph.
- A `tabPress` listener in `_layout.tsx` that calls `e.preventDefault()` and pushes `/create` instead of switching tabs. `/create` (`app/(main)/create.tsx`) is registered as a `<Tabs.Screen name="create" options={{ href: null }} />` — a real route inside the same `(main)` group, but `href: null` keeps Expo Router from also rendering it as a 6th tab bar button. `app/(main)/create-gig.tsx` still exists as its own file (Expo Router's file-based Tabs needs one to render the bar button in the right position) but only renders as a `<Redirect href="/home" />` fallback for the edge case of a stale deep link pointing straight at it. `/create` is now the first step of a real 3-step wizard — see [`docs/screen/create-gig/README.md`](../create-gig/README.md) — whose other two steps (`create-gig-pricing`, `create-gig-preview`) are registered inside the same `(main)` group the same `href: null` way.

## Scope notes

- **Placeholder content for Order.** It has no Figma design yet (`docs/PRD.md` §4.1 Epic 4 — "Core Influsis feature set… TBD") — it renders a simple themed "not built yet" placeholder, matching the pattern the original boilerplate used for its own demo screens (see `docs/design-system.md` "App shell reset").
- **Create Gig is real.** `/create` → `/create-gig-pricing` → `/create-gig-preview` is a full 3-step wizard with its own Figma design and spec — see [`docs/screen/create-gig/README.md`](../create-gig/README.md) — replacing the bare "isn't built yet" placeholder that previously stood in for it.
- **Home, Message and Profile are real.** `scenes/main/Home.tsx` has its own Figma design and full spec — see [`docs/screen/home/README.md`](../home/README.md). `scenes/main/Message.tsx` likewise — see [`docs/screen/message/README.md`](../message/README.md). `scenes/main/Profile.tsx` reads `slices/profileVerification.slice.ts` (populated by the wizard in `docs/screen/profile-verification/`) and displays what was collected — date of birth, categories, social platforms, languages, bio, username — read-only. Neither has a real backend yet (Home's campaigns/gigs are mock data, Profile is literally just echoing back the signup flow's in-memory Redux state), but both show real structured content rather than a placeholder.
- **No auth guarding.** `docs/PRD.md` §8 lists "route guarding (logged-out users cannot reach main tabs)" as an open Success Criterion, not yet implemented — `(main)` is reachable by anyone who navigates to `/home` directly, same as every other route in this app today.
- **Icons.** Extracted from Figma via the Dev Mode MCP server into `assets/images/tab-bar/`. Order and Profile's *active* states are genuinely composited from multiple Figma layers (a base glyph plus one-or-two small accent/overlay images) rather than a single flattened asset — `TabBarIcon` reproduces that layering with absolutely-positioned `Image`s instead of pre-flattening it, matching Figma's own layer structure. Home and Message's active states are simple single-image swaps.
- **Tab bar shadow.** Figma specifies a literal `0px -7px 12px rgba(0,0,0,0.25)` upward shadow that doesn't match any existing token in `theme/shadows.ts` (all of which are downward-offset) — applied directly in `_layout.tsx`, platform-branched the same way `theme/shadows.ts`'s own `getShadowStyle` is (`boxShadow` on web, `shadow*`/`elevation` on native), since raw `shadow*` props are deprecated on React Native Web.
- **Label sizing.** Figma sets the Home label at 10px and the other three at 11px — normalized to 11px everywhere here as a minor, clearly-unintentional Figma inconsistency.

## Navigation

- **Entry:** `router.replace('/home')` from Sign In (`docs/screen/auth/sign-in.md`) or from the profile-verification completion screen's "Explore" button (`docs/screen/profile-verification/completed.md`).
- **Within the shell:** tapping Home/Order/Message/Profile switches tabs normally. Tapping Create Gig pushes the hidden `/create` screen (dismissed via its `ScreenHeader` back chevron, `router.back()`) and from there into the rest of the wizard; since these are `Tabs.Screen`s rather than `Stack` routes, none get native modal slide-up presentation - the tab bar stays mounted underneath as with any other tab.
