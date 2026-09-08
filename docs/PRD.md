# Product Requirements Document (PRD) — Influsis App

|                  |                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------ |
| **Product**      | Influsis (mobile + web app)                                                                |
| **Status**       | Foundation stage — built on React Native boilerplate, product features not yet implemented |
| **Platforms**    | iOS, Android, Web (single Expo codebase)                                                   |
| **Last updated** | 2026-08-17                                                                                 |

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
- [Order](./screen/orders/README.md) — the Order tab's campaign/gig order list, filtered by 4 status tabs
- [Order Details](./screen/order-details/README.md) — a single order's full detail view, opened by tapping any order card
- [Order Deliver](./screen/order-deliver/README.md) — the delivery timeline + link-submission flow, opened from Order Details' "Delivery" button, ending in a confirmation screen
- [Home](./screen/home/README.md) — the Home tab's campaign/gig/creator feed
- [Notifications](./screen/notifications/README.md) — notifications list pushed from the Home tab's bell icon
- [Search](./screen/search/README.md) — campaign search, opened from the Home tab's search bar
- [Live Campaigns](./screen/live-campaign/README.md) — a creator's ongoing campaigns, opened from the Home tab's Active Campaigns section
- [Campaigns](./screen/campaigns/README.md) — all of a creator's campaigns, opened from the Home tab's Campaigns section
- [Businesses](./screen/businesses/README.md) — business logo directory, opened from the Home tab's Business section
- [Business Details](./screen/business-details/README.md) — a single business's full profile view, opened by tapping any business logo
- [Top Gigs](./screen/top-gigs/README.md) — all of a creator's gigs, opened from the Home tab's Top Gigs section
- [Top Creators](./screen/top-creators/README.md) — top-rated creator directory, opened from the Home tab's Top Rated Creator section
- [Gig Details](./screen/gig-details/README.md) — a single gig's full detail view, opened by tapping any gig card
- [Create Gig](./screen/create-gig/README.md) — the 3-step wizard for publishing a new gig, opened from the main tab bar's "Create Gig" button
- [Campaign Details](./screen/campaign-details/README.md) — a single campaign's full detail view, opened by tapping any campaign card
- [Apply Campaign](./screen/apply-campaign/README.md) — the application form a creator submits to a campaign, opened from Campaign Details' "Apply Now" button
- [Applications (Applied / Request)](./screen/apply-campaign/campaign-list.md) — a creator's own submitted applications and the campaign invitations they've received, opened from Profile's "My Applications" link
- [Creator Profile](./screen/creator-profile/README.md) — a single creator's full profile, opened by tapping any creator
- [Message](./screen/message/README.md) — the Message tab's conversation list (with search + empty state) and the single-chat detail screen opened by tapping any thread
- [Profile / Account Settings](./screen/profile/README.md) — the Profile tab's settings menu and its 5 sub-screens: Edit Profile, Security Settings, Change Password, Privacy Policy, Help Center (FAQ)
- [Balance](./screen/balance/README.md) — the creator's balance, monthly/total earnings and payment-method list, opened from Profile's "Ballance" link
- [Transaction](./screen/transactions/README.md) — the full transfer history, opened from Balance's "Recent transaction" row
- [Withdraw to Bank](./screen/withdraw-bank/README.md) — the bank payout branch (bank directory → account number → OTP), opened from Balance's "Bank transfer" row
- [Mobile Banking](./screen/mobile-banking/README.md) — the wallet payout branch (provider picker → bKash hand-off) plus the amount → review → success steps both branches share, opened from Balance's "Mobile banking" row

## 2. Current State of the App

### 2.1 What works today

- **App bootstrap**: Splash screen stays visible while fonts (Open Sans family) and images preload; `restoreSession` rehydrates the auth session from the token store (confirmed with `GET /auth/me`), then the splash hides (`app/_layout.tsx`).
- **Navigation** (Expo Router v6, file-based) — see the Screen Specs above for the full flow; at a glance:
  ```
  /onboarding → /auth/* (sign-in/sign-up/OTP/forgot-reset password)
    → /profile-verification/* (post-signup wizard, sign-up only)
    → /(main) Tabs: Home | Order | Create Gig (modal) | Message | Profile
  ```
  The original boilerplate's Drawer + demo Home/Profile/Details tabs were removed; `(main)` is a fresh Tabs-only shell (no drawer) matching the real Figma tab bar design. See `docs/design-system.md` "App shell reset".
- **Theming**: Automatic light/dark mode via `useColorScheme`, centralized color palette (`theme/colors.ts`), font and image loaders.
- **State management**: Redux Toolkit slices behind convenience hooks (`useAppSlice`, `useAuthSlice`, and others). The auth session (`status`, `account`) lives in `auth.slice`; the `app` slice now holds only the mock `user`.
- **Persistence**: `useDataPersist` hook wrapping AsyncStorage with typed keys; the token pair persists under its own `TOKENS` key via `services/tokenStore.ts`.
- **Startup failure**: if `GET /auth/me` fails, `restoreSession` resolves to `unauthenticated`. The stored token pair is dropped only on a definitive 401/403, so a transient failure still lets a later launch retry.

### 2.2 What is placeholder / not real yet

- **Main app screens**: Order, Home and Message are built out against mock data (`data/*.ts`); Profile displays real data collected by the profile-verification wizard (via Redux) rather than fetching from a backend. See `docs/screen/main/README.md`.
- **Auth HTTP layer**: `services/http.ts` and `services/authApi.ts` wire the seven `/auth/*` endpoints (axios client, envelope unwrap, `ApiError`, bearer-token interceptor, one-shot 401 refresh), but `API_URL` points at a placeholder so no real round trip completes yet.
- **Auth**: The sign-in/sign-up/OTP/2FA/forgot-reset screens (`docs/screen/auth/`) use react-hook-form + zod validation and drive `auth.slice.status` through `authApi`; `authGate` guards `(auth)`, `(main)`, and `(details)`, so the tabs are no longer reachable while signed out. What is still missing is a live backend to authenticate against.
- **Branding/identity**: App name, slug, and bundle identifiers still reference the original boilerplate (`react-native-boilerplate`, `com.watarumaeda.*`); `API_URL` defaults to `https://example.com`.
- **Backend**: No running server. The `/auth/*` contracts are typed and consumed (`types/auth.ts`, `types/api.ts`); every other domain (campaigns, gigs, orders, wallet, messaging) is still `data/*.ts` fixtures.

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

The product scope of Influsis (target users, core features, monetization) is **not yet captured in the codebase** and must be defined by the product owner. Based on the name, the working assumption is an creator-marketing platform; the requirements below are structured so feature epics can be slotted in.

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

1. What is the confirmed product scope of Influsis (creator marketplace? campaign management? analytics?) and who are the primary personas?
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
