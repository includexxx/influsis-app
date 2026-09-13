# better-auth integration (build-plan item 23)

Adds real Google/Facebook sign-in to `SignInLanding` via `@better-auth/expo`,
talking to the backend's `better-auth` OAuth server (backend build-plan item
27, see `backend/docs/auth-better-auth.md`). This is a small, deliberately
narrow integration layered next to the existing auth engine, not a
replacement for it.

## Scope: Google/Facebook buttons only

`@better-auth/expo` is used for exactly one thing: the "Continue with
Google" / "Continue with Facebook" buttons on `scenes/auth/SignInLanding.tsx`.

Everything else about authentication in this app is unchanged:

- Email/password sign-in and sign-up (`SignIn.tsx`, `SignUp.tsx`)
- OTP verification (`VerifyOtp.tsx`)
- 2FA verification (`VerifyTwoFactor.tsx`)
- Forgot/reset password (`ForgotPassword.tsx`, `ResetPassword.tsx`)
- Token storage and refresh (`services/tokenStore.ts`, `services/http.ts`)
- Session state (`slices/auth.slice.ts`)
- Route gating (`utils/authGate.ts`) and session restore
  (`app/_layout.tsx`'s `restoreSession()` dispatch)
- The "Continue with Instagram" button, which stays a stub routing to the
  email sign-in form - the backend's better-auth instance only configures
  `google`/`facebook` as social providers (see
  `backend/src/lib/better-auth/better-auth-instance.ts`), so there is
  nothing to wire Instagram to yet.

**Why scope it this tightly:** the OTP/2FA email flow is fully shipped,
tested (70+ component tests), and talks to a real NestJS backend today.
Rewriting it onto `better-auth` would be a large, risky, unrequested
migration. Instead, `better-auth` is used only where the app previously had
a stub with no backend behind it at all - the social buttons - and its
session is funneled into the *same* token store and Redux slice the rest of
the app already trusts, so nothing downstream needs to know a second login
method exists.

## Why a *second* client-side auth surface makes sense here

The backend runs two independent auth surfaces side by side (see
`backend/docs/auth-better-auth.md`):

1. The existing custom engine (`/api/v1/auth/*`) - register/login/refresh/
   logout/password-reset/2FA/OTP, guarded by the app's normal JWT/RBAC guard
   chain. This app's `services/authApi.ts` talks to it exclusively.
2. A `better-auth` instance mounted at `/api/auth/*` (unversioned, outside
   the guard chain) - a redirect-based OAuth server for Google/Facebook.

better-auth's own session/cookie is never used for authorization against
this app's API. It only exists long enough to carry one thing back to the
client: a real access/refresh token pair, minted by the *same*
`AuthService.validateSocialLogin()` the backend's native-SDK verification
endpoints already use. Once that pair is captured, the better-auth session
has done its job.

## Packages installed

- `@better-auth/expo` - Expo/React Native client + deep-link plugin
- `better-auth` - the client core (`better-auth/react`, `better-auth/client/plugins`)
- `expo-secure-store` - native module `@better-auth/expo`'s Expo plugin
  uses to cache session/cookie data on-device; added to the `plugins` array
  in `app.config.ts`

## Files

- `services/betterAuthClient.ts` - the `authClient`, built with
  `createAuthClient` + the `expoClient` plugin (`scheme: 'influsis'`,
  matching `app.json`'s `scheme`) + `inferAdditionalFields`. `baseURL` comes
  from `utils/config.ts`'s new `betterAuthUrl` (see Env vars below).
- `providers/SocialAuthBridge.tsx` - the bridge (see below). Mounted once in
  `app/_layout.tsx`, rendered inside `providers/Provider.tsx`'s
  `ReduxProvider`. Renders nothing.
- `scenes/auth/SignInLanding.tsx` - Google/Facebook buttons call
  `authClient.signIn.social({ provider })` instead of routing to the email
  form.
- `app.config.ts` / `utils/config.ts` / `.env.dev` / `.env.dev.example` /
  `.env.prod.example` - the new `BETTER_AUTH_URL` env var, mirroring the
  existing `API_URL` -> `extra.apiUrl` wiring.

## The bridge: `providers/SocialAuthBridge.tsx`

This is the only place in the app that reads `authClient.useSession()`.
Nothing else in the app is aware `@better-auth/expo` exists.

1. `SignInLanding` calls `authClient.signIn.social({ provider: 'google' | 'facebook' })`,
   which opens the provider's consent screen and redirects back into the app
   via the `influsis://` scheme.
2. The backend's `SocialLoginBridgeHooks` (backend build-plan 27c) captures
   the provider's token during the OAuth callback, calls the existing
   `AuthService.validateSocialLogin(provider, socialData)`, and stashes the
   resulting `{ token, refreshToken, tokenExpires }` on the better-auth
   session as `realAccessToken` / `realRefreshToken` / `realTokenExpires`
   (plus `realUserId`, unused here).
3. `authClient.useSession()` re-renders with the new session.
   `SocialAuthBridge`'s effect reads those three fields directly off the raw
   session object (defensively - typed with `Record<string, unknown>` and
   narrowed by hand, not trusted from `inferAdditionalFields`' client-side
   types, since that typing exists for developer convenience, not as a
   runtime guarantee).
4. It calls the **existing** `tokenStore.setTokens()` with that pair.
5. It dispatches the **existing** `authApi.endpoints.getMe` query
   (`GET /auth/me`) - the same call `restoreSession()` makes - because a
   better-auth session carries tokens but not the `AuthAccount` shape
   `sessionEstablished` needs.
6. It dispatches the **existing** `sessionEstablished` action from
   `slices/auth.slice.ts` with the resulting account.
7. It calls `authClient.signOut()` to end the better-auth session. From this
   point on `slices/auth.slice.ts`'s `status`/`account` is the only source
   of truth, exactly as it is for every other login path - `authGate.ts` and
   `restoreSession()` need no changes and have none.

If `GET /auth/me` fails with a definitive 401/403, the freshly-set tokens
are cleared (mirroring `restoreSession()`'s own failure handling). Any other
failure (e.g. a transient network error) leaves the tokens in place, so a
later app launch's `restoreSession()` gets another chance.

A session id ref (`handledSessionId`) prevents re-running the hand-off
every time the effect fires for the same still-open session.

## Env vars

`BETTER_AUTH_URL` - origin of the backend's better-auth mount (`/api/auth/*`),
added alongside the existing `API_URL`:

| File | `API_URL` (existing) | `BETTER_AUTH_URL` (new) |
| --- | --- | --- |
| `.env.dev` | `http://192.168.68.102:3001/api/v1` | `http://192.168.68.102:3001` |
| `.env.dev.example` | `https://example.com` | `https://example.com` |
| `.env.prod.example` | `https://example.com` | `https://example.com` |

Same host/port as `API_URL` in dev, without the `/api/v1` prefix - better-auth
is mounted at the backend's own unversioned root, not under the app's
versioned API. Wired through `app.config.ts`'s `extra.betterAuthUrl` exactly
like `extra.apiUrl`, and read in `utils/config.ts` as `config.betterAuthUrl`.

## What the project owner still needs to do

Nothing on the mobile app's own config is missing beyond pointing
`BETTER_AUTH_URL` at the right backend origin per environment (already done
for local dev above; set the real staging/prod origin when those exist).
Everything else is backend-side, already called out in
`backend/docs/auth-better-auth.md`, and repeated here for convenience:

1. **Real Google/Facebook OAuth app credentials** must exist on the backend
   (`GOOGLE_CLIENT_ID`/`_SECRET` already do, for the existing native-SDK
   verification flow; `FACEBOOK_APP_ID`/`_SECRET` are currently blank in the
   backend's dev env, so `socialProviders.facebook` is omitted server-side
   until they're filled in - the Facebook button will error until then).
2. **Register the OAuth redirect URIs** in the Google Cloud Console and
   Facebook Developer Dashboard: `{BETTER_AUTH_URL}/api/auth/callback/google`
   and `{BETTER_AUTH_URL}/api/auth/callback/facebook`.
3. **Add the mobile app's scheme to `BETTER_AUTH_TRUSTED_ORIGINS`** on the
   backend - it currently lists web/dev-server origins only; add
   `influsis://` so the backend accepts the redirect back into this app.
4. **A live, on-device end-to-end test**: tap "Continue with Google" (or
   Facebook) on a real device/simulator with a real consenting account,
   follow the redirect through the provider's consent screen and back into
   the app, and confirm `SocialAuthBridge` lands the user on `/home`
   authenticated exactly as a password/OTP login would. This cannot be done
   headlessly in this environment - no device/simulator with a real
   Google/Facebook account is available here, and the backend's own
   equivalent live consent round-trip is called out as outstanding in
   `backend/docs/auth-better-auth.md` for the same reason.
