import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import * as Linking from 'expo-linking';
import type { State } from '@/utils/store';
import type { AuthStatus } from '@/slices/auth.slice';
import { notificationLinkPath } from '@/lib/notifications/linkPath';
import { holdNotificationRoute } from '@/lib/notifications/pendingRoute';

/**
 * Keeps a notification link that arrives while signed out (build-plan 38d1).
 * Expo Router opens the link's path by itself, but a signed-out creator is
 * redirected to onboarding and the path is lost. So the link's path is noted
 * here and, once the session turns out to be signed out, held with
 * holdNotificationRoute(); app/(main)/_layout.tsx opens it after sign-in.
 * Signed in, nothing is held: the router already opened it. While the
 * session is restoring, it waits for the answer.
 *
 * Only notification paths count (lib/notifications/linkPath.ts), so an
 * ordinary deep link is never replayed for the next user. Mounted once in
 * app/_layout.tsx.
 */
export function useIncomingNotificationLinks(): void {
  const status = useSelector(({ auth }: State) => auth.status);
  const statusRef = useRef<AuthStatus>(status);
  statusRef.current = status;
  const pending = useRef<string | null>(null);

  const settle = useCallback((current: AuthStatus) => {
    if (!pending.current) return;
    if (current === 'unauthenticated') {
      holdNotificationRoute(pending.current);
      pending.current = null;
    } else if (current === 'authenticated') {
      pending.current = null;
    }
  }, []);

  const receive = useCallback(
    (url: string | null) => {
      const path = url ? notificationLinkPath(url) : null;
      if (!path) return;
      pending.current = path;
      settle(statusRef.current);
    },
    [settle],
  );

  // The cold-start link once, then every link while the app is running.
  useEffect(() => {
    let mounted = true;
    Linking.getInitialURL()
      .then(url => {
        if (mounted) receive(url);
      })
      .catch(() => {});
    const subscription = Linking.addEventListener('url', ({ url }) => receive(url));
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [receive]);

  useEffect(() => {
    settle(status);
  }, [status, settle]);
}
