# Product Requirements Document (PRD) — Influsis App

|                  |                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------ |
| **Product**      | Influsis (mobile + web app)                                                                |
| **Status**       | Foundation stage — built on React Native boilerplate, product features not yet implemented |
| **Platforms**    | iOS, Android, Web (single Expo codebase)                                                   |
| **Last updated** | 2026-08-16                                                                                 |

---

## 1. Overview

Influsis is a cross-platform application currently at the **scaffolding stage**. The codebase is derived from a production-grade React Native boilerplate (Expo SDK 54) that provides navigation, theming, state management, persistence, environment configuration, and CI/CD-ready build tooling. Product-specific screens, services, and branding are placeholders awaiting implementation.

This document records (a) what the app does today, (b) the technical foundation product features will be built on, and (c) the gaps that must be closed before the app can be considered Influsis rather than the boilerplate.

## Design System

- [Design Tokens and systems](./design-system.md)

## Screen Specs (per screen)

- [Onboarding + Auth flow](./screen/auth/README.md) — brand intro, onboarding carousel, sign-in/sign-up, OTP verification, forgot/reset password
- [Profile Verification flow](./screen/profile-verification/README.md) — post-signup wizard: date of birth, content categories, social media, languages, bio, username, completion
- [Main App Shell](./screen/main/README.md) — the post-login `(main)` Tabs group: Home, Order, Create Gig, Message, Profile
- [Home](./screen/home/README.md) — the Home tab's campaign/gig/creator feed
- [Notifications](./screen/notifications/README.md) — notifications list pushed from the Home tab's bell icon
- [Search](./screen/search/README.md) — campaign search, opened from the Home tab's search bar
- [Live Campaigns](./screen/live-campaign/README.md) — a creator's ongoing campaigns, opened from the Home tab's Active Campaigns section
- [Campaigns](./screen/campaigns/README.md) — all of a creator's campaigns, opened from the Home tab's Campaigns section
- [Brands](./screen/brands/README.md) — brand logo directory, opened from the Home tab's Brand section
- [Brand Details](./screen/brand-details/README.md) — a single brand's full profile view, opened by tapping any brand logo
- [Top Gigs](./screen/top-gigs/README.md) — all of a creator's gigs, opened from the Home tab's Top Gigs section
- [Top Influencers](./screen/top-influencers/README.md) — top-rated influencer directory, opened from the Home tab's Top Rated Influencer section
- [Gig Details](./screen/gig-details/README.md) — a single gig's full detail view, opened by tapping any gig card
- [Create Gig](./screen/create-gig/README.md) — the 3-step wizard for publishing a new gig, opened from the main tab bar's "Create Gig" button
- [Campaign Details](./screen/campaign-details/README.md) — a single campaign's full detail view, opened by tapping any campaign card
- [Apply Campaign](./screen/apply-campaign/README.md) — the application form a creator submits to a campaign, opened from Campaign Details' "Apply Now" button
- [Applications (Applied / Request)](./screen/apply-campaign/campaign-list.md) — a creator's own submitted applications and the campaign invitations they've received, opened from Profile's "My Applications" link
- [Influencer Profile](./screen/influencer-profile/README.md) — a single influencer's full profile, opened by tapping any influencer
- [Message](./screen/message/README.md) — the Message tab's conversation list (with search + empty state) and the single-chat detail screen opened by tapping any thread
- [Profile / Account Settings](./screen/profile/README.md) — the Profile tab's settings menu and its 5 sub-screens: Edit Profile, Security Settings, Change Password, Privacy Policy, Help Center (FAQ)

## 2. Current State of the App

### 2.1 What works today

- **App bootstrap**: Splash screen stays visible while fonts (Open Sans family) and images preload; a simulated user fetch runs, the user is stored in Redux and persisted to AsyncStorage, then the splash hides (`app/_layout.tsx`).
- **Navigation** (Expo Router v6, file-based) — see the Screen Specs above for the full flow; at a glance:
  ```
  /onboarding → /auth/* (sign-in/sign-up/OTP/forgot-reset password)
    → /profile-verification/* (post-signup wizard, sign-up only)
    → /(main) Tabs: Home | Order | Create Gig (modal) | Message | Profile
  ```
  The original boilerplate's Drawer + demo Home/Profile/Details tabs were removed; `(main)` is a fresh Tabs-only shell (no drawer) matching the real Figma tab bar design. See `docs/design-system.md` "App shell reset".
- **Theming**: Automatic light/dark mode via `useColorScheme`, centralized color palette (`theme/colors.ts`), font and image loaders.
- **State management**: Redux Toolkit with a single `app` slice (`checked`, `loggedIn`, `user`) exposed through a `useAppSlice` convenience hook.
- **Persistence**: `useDataPersist` hook wrapping AsyncStorage with typed keys.
- **Offline fallback**: If the startup fetch fails, the user is restored from persistent storage.

### 2.2 What is placeholder / not real yet

- **Main app screens**: Order is still a placeholder screen (title + note); Home and Message are built out against mock data (`data/*.ts`); Profile displays real data collected by the profile-verification wizard (via Redux) rather than fetching from a backend. See `docs/screen/main/README.md`.
- **User service**: `services/user.service.ts` returns a hardcoded fake user after a 500 ms delay — no real API integration exists.
- **Auth**: A full sign-in/sign-up/OTP/forgot-password UI flow exists (`docs/screen/auth/`) and drives the real `loggedIn` Redux state, but validates entirely client-side — there's no backend to authenticate against, and no route guarding (the `(main)` tabs are reachable without signing in).
- **Branding/identity**: App name, slug, and bundle identifiers still reference the original boilerplate (`react-native-boilerplate`, `com.watarumaeda.*`); `API_URL` defaults to `https://example.com`.
- **Backend**: No API client, no endpoints, no data models beyond a minimal `User { name, email }` type.

## 3. Technical Foundation (inherited, keep)

| Concern       | Implementation                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Framework     | React Native 0.81.5, React 19.1, Expo SDK 54, New Architecture                                        |
| Language      | TypeScript 5.9, strict mode                                                                           |
| Routing       | Expo Router v6 (drawer → tabs → stacks)                                                               |
| Global state  | Redux Toolkit + react-redux, `useAppSlice` pattern                                                    |
| Local storage | AsyncStorage via `useDataPersist`                                                                     |
| Theming       | Custom theme system (`@/theme`) with light/dark support                                               |
| UI elements   | Reusable `Button`, `GradientButton`, `Image`, `BottomSheet` components with tests                     |
| Environment   | dotenvx + `app.config.ts` → typed access via `utils/config.ts`                                        |
| Build/Deploy  | EAS Build (iOS/Android), EAS Hosting (web), OTA via expo-updates                                      |
| Quality       | ESLint 9 (flat config), Prettier, Jest + React Native Testing Library, Husky + lint-staged pre-commit |

## 4. Product Direction (to be defined)

The product scope of Influsis (target users, core features, monetization) is **not yet captured in the codebase** and must be defined by the product owner. Based on the name, the working assumption is an influencer-marketing platform; the requirements below are structured so feature epics can be slotted in.

### 4.1 Proposed epics (placeholders — confirm before building)

| #   | Epic                                                                               | Depends on  |
| --- | ---------------------------------------------------------------------------------- | ----------- |
| E1  | Rebrand app (name, slug, bundle IDs, icons, splash, colors)                        | —           |
| E2  | Real authentication (signup, login, logout, session refresh)                       | Backend API |
| E3  | API service layer (replace fake `getUserAsync`, add error handling, token storage) | E2          |
| E4  | Core Influsis feature set (feeds, campaigns, discovery — TBD)                      | E2, E3      |
| E5  | Profile management (edit profile, avatar upload, settings)                         | E2, E3      |
| E6  | Push notifications & deep linking                                                  | E2          |
| E7  | Analytics and crash reporting                                                      | —           |

### 4.2 Functional requirements that already have scaffolding

- **FR-1 App startup**: App must show splash until assets and session are ready, then land the user on the correct screen based on auth state. _(Scaffolded — currently always "logs in".)_
- **FR-2 Theme**: All screens must render correctly in light and dark mode. _(Working pattern established.)_
- **FR-3 Session persistence**: A previously signed-in user must be restored when offline. _(Working with fake data.)_
- **FR-4 Navigation**: Drawer + bottom-tab + stack navigation with typed routes. _(Working.)_

## 5. Non-Functional Requirements

- **NFR-1 Type safety**: Strict TypeScript; all component props typed; no `any`.
- **NFR-2 Testing**: Every component ships with a test file (existing elements already do).
- **NFR-3 Code quality**: ESLint/Prettier enforced via pre-commit hooks; no `console.log` in production code.
- **NFR-4 Performance**: New Architecture enabled; `StyleSheet.create` for styles; assets preloaded.
- **NFR-5 Multi-environment**: dev/staging/prod via dotenvx env files and EAS secrets; no hardcoded config.
- **NFR-6 OTA updates**: expo-updates configured for over-the-air releases.

## 6. Architecture Conventions (binding for all new work)

1. Route files in `app/` stay minimal and delegate to scene components in `scenes/`.
2. Screens live in `scenes/`, reusable UI in `components/elements/`, layout chrome in `components/layouts/`.
3. All API calls go through `services/` — never directly from components.
4. Global state via Redux Toolkit slices in `slices/`; local state only when not shared.
5. Colors/fonts/images come from `@/theme`; env/config from `utils/config.ts`; device info from `utils/deviceInfo.ts`.
6. Types live in `types/` (PascalCase files); hooks in `hooks/` (`useX` naming).

## 7. Open Questions

1. What is the confirmed product scope of Influsis (influencer marketplace? campaign management? analytics?) and who are the primary personas?
2. Which backend will the app talk to (existing API, new service, BaaS)?
3. Auth provider decision: custom, OAuth/social, or managed (e.g., Auth0/Firebase/Supabase)?
4. Is the drawer navigation needed for the final IA, or should it be removed in favor of tabs only?
5. Branding assets (logo, palette, fonts) — when will final designs be available?

## 8. Success Criteria for Exiting Foundation Stage

- [ ] App identity (name, slug, bundle IDs, icons, splash) rebranded to Influsis
- [ ] Fake user service replaced with a real API client and error handling
- [ ] Real auth flow with route guarding (logged-out users cannot reach main tabs)
- [ ] At least one real product screen replacing the demo Home/Details screens
- [ ] Environment files pointing to real dev/staging endpoints
