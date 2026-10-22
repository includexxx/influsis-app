import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { notificationsApi } from '@/services/notificationsApi';
import type { AuthState } from '@/slices/auth.slice';
import {
  NotificationsLiveState,
  pushBannerShown,
  resyncRequested,
  showBanner,
} from '@/slices/notificationsLive.slice';
import { NotificationItem } from '@/types';
import type { PushMessage } from './messaging';
import { parsePushData, pushTapPath } from './pushData';

// What a received push does (build-plan 38e2; backend PUSH_NOTIFICATIONS
// §12.1, CLIENT_INTEGRATION §6). React-free, with routing injected;
// hooks/usePushHandlers.ts wires it to React Native Firebase.

export interface PushHandlerDeps {
  dispatch: ThunkDispatch<unknown, unknown, UnknownAction>;
  getState: () => unknown;
  /** Navigate now (signed in). */
  push: (path: string) => void;
  /** Keep the path until sign-in (lib/notifications/pendingRoute.ts). */
  hold: (path: string) => void;
  now?: () => number;
}

type AppState = { auth: AuthState; notificationsLive: NotificationsLiveState };

/**
 * A tapped push, from the background or a cold start. Signed in, it opens
 * the screen; otherwise (still restoring, or signed out) the path waits for
 * sign-in. The path's `?n=` marks the notification read either way.
 */
export function handlePushTap(
  message: PushMessage | null | undefined,
  deps: PushHandlerDeps,
): void {
  const path = pushTapPath(parsePushData(message?.data));
  const { auth } = deps.getState() as AppState;
  if (auth.status === 'authenticated') deps.push(path);
  else deps.hold(path);
}

/**
 * A push that arrives while the app is open. No system notification: the
 * unread count is refetched, the feed reloads unless the socket already
 * delivered this notification, and a high-urgency one shows the in-app
 * banner - once, whichever of push or socket arrives first.
 */
export function handleForegroundPush(
  message: PushMessage | null | undefined,
  deps: PushHandlerDeps,
): void {
  const { auth, notificationsLive: live } = deps.getState() as AppState;
  if (auth.status !== 'authenticated') return;

  deps.dispatch(notificationsApi.util.invalidateTags(['UnreadCount']));

  const parsed = parsePushData(message?.data);
  if (!parsed) return;
  if (parsed.kind === 'batch') {
    deps.dispatch(resyncRequested());
    return;
  }

  const id = parsed.notificationId;
  const deliveredBySocket = live.incoming.some(item => item.id === id);
  if (deliveredBySocket) return;

  deps.dispatch(resyncRequested());
  if (parsed.urgency !== 'high' || live.bannerShownIds.includes(id)) return;

  // The push carries no createdAt or category, so this item only feeds the
  // banner; the feed itself reloads from the server.
  const item: NotificationItem = {
    id,
    eventType: parsed.eventType,
    category: '',
    urgency: parsed.urgency,
    title: message?.notification?.title ?? '',
    body: message?.notification?.body ?? '',
    target: parsed.target,
    readAt: null,
    resolvedAt: null,
    createdAt: new Date((deps.now ?? Date.now)()).toISOString(),
  };
  deps.dispatch(showBanner(item));
  deps.dispatch(pushBannerShown(id));
}
