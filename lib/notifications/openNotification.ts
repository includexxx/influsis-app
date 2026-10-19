import { Href, router } from 'expo-router';
import { NotificationItem } from '@/types';
import type { AuthStatus } from '@/slices/auth.slice';
import { routeFor } from './route-map';
import { holdNotificationRoute } from './pendingRoute';

export interface OpenNotificationOptions {
  status: AuthStatus;
  /** Optimistic mark-read; the caller owns the NT3 call and its revert. */
  markRead: (item: NotificationItem) => void;
  /** The path of the screen the tap happened on, so a fallback tap stays put. */
  currentPath?: string;
}

// The click flow (CLIENT_INTEGRATION §1): mark read, resolve the route, open
// it. Before the session is restored (or while signed out) the path is held
// and opened after sign-in instead.
export function openNotification(item: NotificationItem, options: OpenNotificationOptions): void {
  const { status, markRead, currentPath } = options;
  if (item.readAt === null) markRead(item);

  const path = routeFor(item);
  if (status !== 'authenticated') {
    holdNotificationRoute(path);
    return;
  }
  if (path === currentPath) return;
  // Paths come from the backend-shared table as plain strings.
  router.push(path as Href);
}
