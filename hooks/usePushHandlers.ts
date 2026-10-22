import { useEffect } from 'react';
import { useStore } from 'react-redux';
import { Href, router } from 'expo-router';
import { holdNotificationRoute } from '@/lib/notifications/pendingRoute';
import { getPushMessaging } from '@/services/push/messaging';
import { handleForegroundPush, handlePushTap, PushHandlerDeps } from '@/services/push/pushHandlers';

/**
 * Receives pushes (build-plan 38e2), mounted once in app/_layout.tsx:
 * foreground messages, taps from the background, and the tap that launched
 * the app from closed (read once). A no-op where push is unavailable
 * (services/push/messaging.ts).
 */
export function usePushHandlers(): void {
  const store = useStore();

  useEffect(() => {
    const messaging = getPushMessaging();
    if (!messaging) return;

    const deps: PushHandlerDeps = {
      dispatch: store.dispatch as PushHandlerDeps['dispatch'],
      getState: store.getState,
      push: path => router.push(path as Href),
      hold: holdNotificationRoute,
    };

    const offMessage = messaging.onMessage(message => handleForegroundPush(message, deps));
    const offOpened = messaging.onNotificationOpenedApp(message => handlePushTap(message, deps));

    // At cold start the session is still restoring, so the tap is held and
    // app/(main)/_layout.tsx opens it once signed in.
    let mounted = true;
    messaging
      .getInitialNotification()
      .then(message => {
        if (mounted && message) handlePushTap(message, deps);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
      offMessage();
      offOpened();
    };
  }, [store]);
}
