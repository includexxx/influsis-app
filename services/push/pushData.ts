import { NotificationTarget, NotificationUrgency } from '@/types';
import { NOTIFICATIONS_PATH, routeFor } from '@/lib/notifications/route-map';

// The backend's FCM `data` map (PUSH_NOTIFICATIONS §8.1; build-plan 38e2).
// Every value is a string; creators get no `url`, so the app rebuilds the
// target and runs its own route map, exactly like a feed item. Bad or
// unexpected data opens the notifications page rather than guessing.

export type PushData =
  | { kind: 'batch' }
  | {
      kind: 'single';
      notificationId: string;
      eventType: string;
      urgency: NotificationUrgency;
      target: NotificationTarget;
    };

const URGENCIES: readonly string[] = ['high', 'normal', 'low'];

function str(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** `targetParams` as a string -> string map, or null when it isn't one. */
function parseParams(raw: string | undefined): Record<string, string> | null {
  if (raw === undefined) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (!entries.every(([, v]) => typeof v === 'string')) return null;
    return Object.fromEntries(entries) as Record<string, string>;
  } catch {
    return null;
  }
}

export function parsePushData(data: Record<string, unknown> | undefined): PushData | null {
  if (!data) return null;
  const kind = str(data, 'kind');
  if (kind === 'batch') return { kind: 'batch' };
  if (kind !== 'single') return null;

  const notificationId = str(data, 'notificationId');
  const eventType = str(data, 'eventType');
  const targetType = str(data, 'targetType');
  const targetId = str(data, 'targetId');
  if (!notificationId || !eventType || !targetType || !targetId) return null;

  const params = parseParams(str(data, 'targetParams'));
  if (!params) return null;

  const urgency = str(data, 'urgency');
  return {
    kind: 'single',
    notificationId,
    eventType,
    urgency: urgency && URGENCIES.includes(urgency) ? (urgency as NotificationUrgency) : 'normal',
    target: { type: targetType, id: targetId, params },
  };
}

/**
 * Where tapping a push goes. A single push opens its mapped screen with
 * `?n={notificationId}`, which marks it read (hooks/useNotificationReadParam.ts)
 * - also after sign-in when the tap had to wait. A batch, or data the app
 * can't read, opens the notifications page and marks nothing read.
 */
export function pushTapPath(parsed: PushData | null): string {
  if (!parsed || parsed.kind === 'batch') return NOTIFICATIONS_PATH;
  const path = routeFor({ eventType: parsed.eventType, target: parsed.target });
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}n=${encodeURIComponent(parsed.notificationId)}`;
}
