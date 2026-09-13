import * as SecureStore from 'expo-secure-store';
import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import config from '@/utils/config';

/**
 * better-auth client - scoped ONLY to the Google/Facebook buttons on
 * `SignInLanding` (build-plan 23). This is a separate, additive auth
 * surface: it never touches the existing email/password + OTP + 2FA engine
 * (`services/authApi.ts`, `services/http.ts`, `services/tokenStore.ts`,
 * `slices/auth.slice.ts`). See `docs/better-auth-integration.md`.
 *
 * `baseURL` points at the backend's better-auth mount
 * (`/api/auth/*` on the backend's own origin - NOT the versioned
 * `/api/v1/*` this app's `httpClient`/`authApi` talk to). Configured via
 * `BETTER_AUTH_URL` -> `expo.extra.betterAuthUrl` -> `utils/config.ts`,
 * mirroring the existing `API_URL` -> `extra.apiUrl` convention.
 *
 * `scheme` matches this app's own `app.json` `scheme: "influsis"` so
 * better-auth can deep-link back into the app after the OAuth redirect
 * completes.
 *
 * The `session.additionalFields` declared server-side in the backend's
 * `better-auth-instance.ts` (`realAccessToken`, `realRefreshToken`,
 * `realTokenExpires`, `realUserId`) are already present on the raw session
 * response at runtime without any client-side plugin - better-auth returns
 * whatever the server puts on the session object. `inferAdditionalFields`
 * below is added purely so those fields are typed on the client (per
 * better-auth's docs, a client in a separate project/repo from the server
 * must declare the shape manually - it cannot import `typeof auth`).
 * `services/socialAuthBridge.ts` still reads the fields defensively at
 * runtime rather than trusting these types, since it is the one place in
 * the app allowed to touch this session at all.
 */
export const authClient = createAuthClient({
  baseURL: config.betterAuthUrl,
  plugins: [
    expoClient({
      scheme: 'influsis',
      storagePrefix: 'influsis',
      storage: SecureStore,
    }),
    inferAdditionalFields({
      session: {
        realAccessToken: { type: 'string', required: false, input: false },
        realRefreshToken: { type: 'string', required: false, input: false },
        realTokenExpires: { type: 'number', required: false, input: false },
        realUserId: { type: 'string', required: false, input: false },
      },
    }),
  ],
});

export type SocialProvider = 'google' | 'facebook';
