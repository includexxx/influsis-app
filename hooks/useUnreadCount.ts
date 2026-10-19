import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useGetUnreadCountQuery } from '@/services/notificationsApi';

export const UNREAD_COUNT_POLL_MS = 60_000;

/**
 * The bell's unread count (backend NT2). Refetched on every return to the
 * foreground and every 60 s while the app is active; until the socket lands
 * (38b) that poll is the only live signal. Loading or a failed read counts as
 * 0 - the badge never shows an error.
 */
export function useUnreadCount(): number {
  const [active, setActive] = useState(AppState.currentState === 'active');
  const { data, isError, refetch } = useGetUnreadCountQuery(undefined, {
    pollingInterval: active ? UNREAD_COUNT_POLL_MS : 0,
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
