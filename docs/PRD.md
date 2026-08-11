# Product Requirements Document (PRD) — Influsis App

|                  |                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------ |
| **Product**      | Influsis (mobile + web app)                                                                |
| **Status**       | Foundation stage — built on React Native boilerplate, product features not yet implemented |
| **Platforms**    | iOS, Android, Web (single Expo codebase)                                                   |
| **Last updated** | 2026-08-10                                                                                 |

---

## 1. Overview

Influsis is a cross-platform application currently at the **scaffolding stage**. The codebase is derived from a production-grade React Native boilerplate (Expo SDK 54) that provides navigation, theming, state management, persistence, environment configuration, and CI/CD-ready build tooling. Product-specific screens, services, and branding are placeholders awaiting implementation.

This document records (a) what the app does today, (b) the technical foundation product features will be built on, and (c) the gaps that must be closed before the app can be considered Influsis rather than the boilerplate.

## Design System

- [Design Tokens and systems](./design-system.md)

## Screen Specs (per screen)

- [Onboarding + Auth flow](./screen/auth/README.md) — brand intro, onboarding carousel, sign-in/sign-up, OTP verification

## 2. Current State of the App

### 2.1 What works today

- **App bootstrap**: Splash screen stays visible while fonts (Open Sans family) and images preload; a simulated user fetch runs, the user is stored in Redux and persisted to AsyncStorage, then the splash hides and a welcome bottom sheet opens (`app/_layout.tsx`).
- **Navigation** (Expo Router v6, file-based):
  ```
  Root (Drawer)
  └── Tabs
      ├── Home tab  → Stack: Home → Details
      └── Profile tab → Stack: Profile → Details
  ```
  Includes a custom drawer, custom navigation header components, and a hidden index route that redirects into the Home tab.
- **Theming**: Automatic light/dark mode via `useColorScheme`, centralized color palette (`theme/colors.ts`), font and image loaders.
- **State management**: Redux Toolkit with a single `app` slice (`checked`, `loggedIn`, `user`) exposed through a `useAppSlice` convenience hook.
- **Persistence**: `useDataPersist` hook wrapping AsyncStorage with typed keys.
- **Offline fallback**: If the startup fetch fails, the user is restored from persistent storage.

### 2.2 What is placeholder / not real yet

- **Screens**: Home, Profile, and Details are demo screens containing only a title and a navigation button.
- **User service**: `services/user.service.ts` returns a hardcoded fake user after a 500 ms delay — no real API integration exists.
- **Auth**: `loggedIn` state exists but there is no login/signup flow; every launch "logs in" the fake user.
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
