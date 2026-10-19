import { NotificationPreference } from '@/types';

export interface EmailToggle {
  category: string;
  enabled: boolean;
  /** Some of this category's events are always emailed (final decisions, deadlines). */
  hasLocked: boolean;
}

/** One toggle per category that has an email channel, in NT5's (fixed) order. */
export function emailToggles(prefs: NotificationPreference[]): EmailToggle[] {
  return prefs.flatMap(pref =>
    pref.email
      ? [
          {
            category: pref.category,
            enabled: pref.email.enabled,
            hasLocked: pref.email.lockedEvents.length > 0,
          },
        ]
      : [],
  );
}

/** category -> email enabled, for the categories that have an email channel. */
export function emailMap(prefs: NotificationPreference[]): Record<string, boolean> {
  return Object.fromEntries(emailToggles(prefs).map(t => [t.category, t.enabled]));
}

/**
 * The NT6 `email` body that takes the server from `confirmed` to `desired`:
 * only the categories that differ. `null` when nothing does, so an empty
 * `email: {}` (a 422) is never sent.
 */
export function diffEmail(
  desired: Record<string, boolean>,
  confirmed: Record<string, boolean>,
): Record<string, boolean> | null {
  const changed = Object.entries(desired).filter(([category, on]) => confirmed[category] !== on);
  return changed.length ? Object.fromEntries(changed) : null;
}
