import { NotificationItem, NotificationTarget } from '@/types';

// Notification target -> screen path for the creator app.
//
// This MUST equal the backend's creator table in
// ../backend/src/notifications/links/notification-links.ts (which builds the
// email links), so a feed tap, an email button and a push all open the same
// screen. Copy that table when it changes; never reinterpret it here.
// Contract: ../backend/docs/features/notifications/CLIENT_INTEGRATION.md §1, §4.
//
// Lookup order: an eventType override, then the target type, then the
// notifications page. Ids go through encodeURIComponent, as in the backend.

export const NOTIFICATIONS_PATH = '/notifications';

type PathRule = (target: NotificationTarget) => string;

const seg = (value: string | undefined): string => encodeURIComponent(value ?? '');

const BY_EVENT: Record<string, PathRule> = {
  // Its `delivery` target would otherwise open submit-delivery.
  'delivery.escalated': t => `/engagement/${seg(t.id)}`,
  // Its target is the engagement; the hidden review lives on the review screen.
  'review.hidden': t => `/engagement/${seg(t.id)}/review`,
};

const BY_TARGET: Record<string, PathRule> = {
  engagement: t => `/engagement/${seg(t.id)}`,
  delivery: t => `/engagement/${seg(t.id)}/submit-delivery`,
  review: t => `/engagement/${seg(t.id)}/review`,
  profile: () => '/my-profile',
  account: () => '/my-profile',
  campaign: t => `/campaign/${seg(t.id)}`,
};

export function routeFor(item: Pick<NotificationItem, 'eventType' | 'target'>): string {
  const rule = BY_EVENT[item.eventType] ?? BY_TARGET[item.target.type];
  return rule ? rule(item.target) : NOTIFICATIONS_PATH;
}
