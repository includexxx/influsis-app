import { NotificationPreference } from '@/types';

/** The two per-category channels NT5/NT6 carry for a creator (in-app is always on). */
export type PreferenceChannel = 'email' | 'push';

export interface ChannelToggle {
  category: string;
  enabled: boolean;
  /** Some of this category's events always go out on this channel (final decisions, deadlines). */
  hasLocked: boolean;
}

/** One toggle per category that has this channel, in NT5's (fixed) order. */
export function channelToggles(
  prefs: NotificationPreference[],
  channel: PreferenceChannel,
): ChannelToggle[] {
  return prefs.flatMap(pref => {
    const block = pref[channel];
    return block
      ? [
          {
            category: pref.category,
            enabled: block.enabled,
            hasLocked: block.lockedEvents.length > 0,
          },
        ]
      : [];
  });
}

/** category -> enabled, for the categories that have this channel. */
export function channelMap(
  prefs: NotificationPreference[],
  channel: PreferenceChannel,
): Record<string, boolean> {
  return Object.fromEntries(channelToggles(prefs, channel).map(t => [t.category, t.enabled]));
}

/**
 * The NT6 body for one channel that takes the server from `confirmed` to
 * `desired`: only the categories that differ. `null` when nothing does, so an
 * empty channel object (a 422) is never sent.
 */
export function diffChannel(
  desired: Record<string, boolean>,
  confirmed: Record<string, boolean>,
): Record<string, boolean> | null {
  const changed = Object.entries(desired).filter(([category, on]) => confirmed[category] !== on);
  return changed.length ? Object.fromEntries(changed) : null;
}
