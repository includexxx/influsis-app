import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import type { Dispatch, State } from '@/utils/store';
import config from '@/utils/config';
import { APP_LANGUAGE, refreshSession } from '@/services/http';
import { peekAccessToken } from '@/services/tokenStore';
import { notificationsApi } from '@/services/notificationsApi';
import {
  createNotificationsSocket,
  NotificationsSocket,
  RealtimeSocket,
} from '@/services/realtime/notificationsSocket';
import { REALTIME_NAMESPACE, socketOrigin } from '@/services/realtime/socketOrigin';
import { signOut } from '@/slices/auth.slice';
import {
  connectionChanged,
  notificationReceived,
  notificationsReadReceived,
  resyncRequested,
} from '@/slices/notificationsLive.slice';

/** How long a foreground/background change must hold before the socket follows it. */
export const REALTIME_APPSTATE_DEBOUNCE_MS = 1_000;

// Background (not `inactive`, which iOS passes through for the control
// centre or a permission prompt) is what closes the socket.
const isForeground = (state: AppStateStatus) => state !== 'background';

// `null` when API_URL is missing or not http(s): realtime is skipped (the
// badge keeps polling) rather than crashing the root layout.
function realtimeUrl(): string | null {
  try {
    return `${socketOrigin(config.apiUrl ?? '')}${REALTIME_NAMESPACE}`;
  } catch {
    return null;
  }
}

/**
 * The one realtime socket for the signed-in creator (build-plan 38b), mounted
 * once in app/_layout.tsx. Connected only while signed in and in the
 * foreground; foreground/background changes are debounced so a flapping
 * AppState opens no new connection. Sign-out stops it at once.
 */
export function useRealtimeNotifications(): void {
  const dispatch = useDispatch<Dispatch>();
  const signedIn = useSelector(({ auth }: State) => auth.status === 'authenticated');
  const [foreground, setForeground] = useState(isForeground(AppState.currentState));
  const managerRef = useRef<NotificationsSocket | null>(null);
  const urlRef = useRef<string | null | undefined>(undefined);
  if (urlRef.current === undefined) urlRef.current = realtimeUrl();
  const url = urlRef.current;

  if (!managerRef.current && url) {
    managerRef.current = createNotificationsSocket({
      io: (socketUrl, options) => io(socketUrl, options) as unknown as RealtimeSocket,
      url,
      getToken: peekAccessToken,
      lang: APP_LANGUAGE,
      refreshSession,
      onNew: item => dispatch(notificationReceived(item)),
      onUnreadCount: count =>
        dispatch(notificationsApi.util.upsertQueryData('getUnreadCount', undefined, { count })),
      onRead: event => dispatch(notificationsReadReceived(event)),
      onResync: () => {
        dispatch(notificationsApi.util.invalidateTags(['UnreadCount']));
        dispatch(resyncRequested());
      },
      onConnectionChange: connected => dispatch(connectionChanged(connected)),
      onSignOut: () => dispatch(signOut()),
    });
  }

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state =>
      setForeground(isForeground(state)),
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;
    if (!signedIn) {
      manager.stop();
      return;
    }
    const timer = setTimeout(
      () => (foreground ? manager.start() : manager.stop()),
      REALTIME_APPSTATE_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [signedIn, foreground]);

  useEffect(() => () => managerRef.current?.stop(), []);
}
