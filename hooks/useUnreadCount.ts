import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useGetUnreadCountQuery } from '@/services/notificationsApi';

export const UNREAD_COUNT_POLL_MS = 60_000;

/**
 * The bell's unread count (backend NT2). Refetched on every return to the
 * foreground. While the realtime socket is up it overwrites this cache
 * (`notification:unread_count`, hooks/useRealtimeNotifications.ts); while it
 * is down and the app is active, the count is polled every 60 s instead
 * (backend CLIENT_INTEGRATION §6). Loading or a failed read counts as 0 - the
 * badge never shows an error.
 */
export function useUnreadCount(): number {
  const [active, setActive] = useState(AppState.currentState === 'active');
  const socketConnected = useSelector(
    ({ notificationsLive }: State) => notificationsLive.connected,
  );
  const { data, isError, refetch } = useGetUnreadCountQuery(undefined, {
    pollingInterval: active && !socketConnected ? UNREAD_COUNT_POLL_MS : 0,
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      const nowActive = state === 'active';
      setActive(nowActive);
      if (nowActive) refetch();
    });
    return () => subscription.remove();
  }, [refetch]);

  return isError || !data ? 0 : data.count;
}
