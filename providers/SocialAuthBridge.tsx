import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { authClient } from '@/services/betterAuthClient';
import { authApi, setTokens, clearTokens, ApiError } from '@/services';
import { sessionEstablished } from '@/slices/auth.slice';
import { Dispatch } from '@/utils/store';

/**
 * The ONLY place in the app allowed to read the better-auth client's own
 * session (build-plan 23c). Everything else - `authGate.ts`,
 * `restoreSession()`, every existing screen - keeps working exactly as it
 * does today, oblivious to whether a session came from email/password, OTP,
 * or a Google/Facebook redirect.
 *
 * Flow: `SignInLanding`/`SocialAuthButton` call
 * `authClient.signIn.social({ provider })`, which redirects out to the
 * provider and back via the `influsis://` scheme. When the resulting
 * better-auth session appears, the backend's OAuth bridge
 * (`social-login-bridge.hooks.ts`, build-plan 27c) has already minted a
 * real platform JWT pair and stashed it on the session as
 * `realAccessToken`/`realRefreshToken`/`realTokenExpires`. This effect:
 *
 *  1. reads those fields defensively (not trusting `inferAdditionalFields`'
 *     client-side typing at runtime - see `services/betterAuthClient.ts`),
 *  2. hands the real pair to the EXISTING `tokenStore.setTokens()`,
 *  3. fetches the account via the EXISTING `GET /auth/me`
 *     (`authApi.endpoints.getMe`, the same call `restoreSession()` uses)
 *     since a better-auth session carries tokens but not the
 *     `AuthAccount` shape `sessionEstablished` needs,
 *  4. dispatches the EXISTING `sessionEstablished` action, and
 *  5. signs the better-auth session out - once the hand-off is done, that
 *     session must never be consulted again or become a second source of
 *     truth alongside `slices/auth.slice.ts`.
 *
 * Mounted once near the root (`app/_layout.tsx`), rendered inside
 * `providers/Provider.tsx`'s `ReduxProvider` so `useDispatch` works. Renders
 * nothing.
 */
export default function SocialAuthBridge() {
  const dispatch = useDispatch<Dispatch>();
  const { data: session } = authClient.useSession();
  const handledSessionId = useRef<string | null>(null);

  useEffect(() => {
    const raw = session?.session as Record<string, unknown> | undefined;
    if (!raw) return;

    const realAccessToken = raw.realAccessToken;
    const realRefreshToken = raw.realRefreshToken;
    const realTokenExpires = raw.realTokenExpires;
    const sessionId = typeof raw.id === 'string' ? raw.id : null;

    if (typeof realAccessToken !== 'string' || typeof realRefreshToken !== 'string') return;
    if (sessionId && handledSessionId.current === sessionId) return;
    if (sessionId) handledSessionId.current = sessionId;

    const tokenExpires = typeof realTokenExpires === 'number' ? realTokenExpires : Date.now();

    (async () => {
      try {
        await setTokens({
          token: realAccessToken,
          refreshToken: realRefreshToken,
          tokenExpires,
        });

        const req = dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true }));
        try {
          const account = await req.unwrap();
          dispatch(sessionEstablished(account));
        } finally {
          req.unsubscribe();
        }
      } catch (err) {
        // Mirrors restoreSession()'s own failure handling: only a
        // definitive 401/403 means the freshly-minted tokens are actually
        // bad and should be dropped. Any other failure (e.g. a transient
        // network error) leaves them in place - restoreSession() on next
        // launch gets another chance.
        if (err instanceof ApiError && (err.statusCode === 401 || err.statusCode === 403)) {
          await clearTokens();
        }
      } finally {
        // The real token pair is already handed off above - better-auth's
        // own session must not linger as a second source of truth.
        authClient.signOut().catch(() => {});
      }
    })();
  }, [session, dispatch]);

  return null;
}
