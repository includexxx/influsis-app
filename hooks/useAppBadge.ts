import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useGetUnreadCountQuery } from '@/services/notificationsApi';
import { setAppBadge } from '@/services/push/badge';

/**
 * Keeps the iOS app icon badge equal to the unread count (build-plan 38e2;
 * backend PUSH_NOTIFICATIONS §12.1): refetched on every return to the app and
 * updated whenever the count changes; cleared on sign-out. Mounted once in
 * app/_layout.tsx. Nothing on Android or the web.
 */
export function useAppBadge(): void {
  const ios = Platform.OS === 'ios';
  const signedIn = useSelector(({ auth }: State) => auth.status === 'authenticated');
  const { data, refetch } = useGetUnreadCountQuery(undefined, { skip: !ios || !signedIn });

  useEffect(() => {
    if (!ios) return;
    if (!signedIn) {
      void setAppBadge(0);
      return;
    }
    if (data) void setAppBadge(data.count);
  }, [ios, signedIn, data]);

  useEffect(() => {
    if (!ios || !signedIn) return;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refetch();
    });
    return () => subscription.remove();
  }, [ios, signedIn, refetch]);
}
