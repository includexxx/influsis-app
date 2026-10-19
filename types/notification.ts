// The creator's notification feed (backend 24, group NT -
// ../backend/docs/features/notifications/API_ENDPOINTS_LIST.md).

/** NotificationCard's icon set; `generic` is the fallback bell. */
export type NotificationIconName = 'money-tick' | 'wallet' | 'generic';

export type NotificationCategory =
  | 'campaign'
  | 'engagement'
  | 'offer'
  | 'delivery'
  | 'review'
  | 'account';

export type NotificationUrgency = 'high' | 'normal' | 'low';

/** The target types the backend knows today; `NotificationTarget.type` stays open. */
export type NotificationTargetType =
  | 'campaign'
  | 'engagement'
  | 'delivery'
  | 'review'
  | 'profile'
  | 'verification'
  | 'account';

/** What a notification opens. Never a path: lib/notifications/route-map.ts turns it into one. */
export interface NotificationTarget {
  type: NotificationTargetType | (string & {});
  id: string;
  /** Values are always strings. */
  params: Record<string, string>;
}

/** One NT1 feed row. `title`/`body` are server-rendered plain text. */
export interface NotificationItem {
  id: string;
  /** Open set (EVENT_CATALOG.md); unknown values still render and open via the target. */
  eventType: string;
  category: NotificationCategory | (string & {});
  urgency: NotificationUrgency;
  title: string;
  body: string;
  target: NotificationTarget;
  readAt: string | null;
  /** Admin work items only; never set for a creator. */
  resolvedAt: string | null;
  createdAt: string;
}

/** NT1 query. `before` is the page-1 anchor, sent with pages 2+. */
export interface NotificationsPageArgs {
  page: number;
  limit: number;
  unread?: boolean;
  before?: string;
}

/** NT2 */
export interface UnreadCount {
  count: number;
}

/** NT3 */
export interface MarkReadResult {
  id: string;
  readAt: string;
}

/** NT4 */
export interface MarkAllReadResult {
  updated: number;
}
