import { describe, expect, test } from '@jest/globals';
import { NotificationChannelPreference, NotificationPreference } from '@/types';
import { channelMap, channelToggles, diffChannel } from './channelPreferences';

type Block = { enabled: boolean; locked?: string[] } | null;

const block = (b: Block): NotificationChannelPreference | null =>
  b ? { enabled: b.enabled, lockedEvents: b.locked ?? [], optionalEvents: ['x'] } : null;

function pref(category: string, email: Block, push: Block = null): NotificationPreference {
  return {
    category,
    inApp: { enabled: true, locked: true },
    email: block(email),
    push: block(push),
  };
}

const PREFS = [
  pref('engagement', { enabled: true, locked: ['engagement.accepted'] }, { enabled: false }),
  pref('campaign', null, null),
  pref('offer', { enabled: false }, { enabled: true, locked: ['offer.x'] }),
  // email only: e.g. account.suspended is email-only
  pref('account', { enabled: true }, null),
];

describe('channelToggles', () => {
  test('email: keeps NT5 order, skips a null email block, flags locked events', () => {
    expect(channelToggles(PREFS, 'email')).toEqual([
      { category: 'engagement', enabled: true, hasLocked: true },
      { category: 'offer', enabled: false, hasLocked: false },
      { category: 'account', enabled: true, hasLocked: false },
    ]);
  });

  test('push: its own values and locked events; a null push block is skipped', () => {
    expect(channelToggles(PREFS, 'push')).toEqual([
      { category: 'engagement', enabled: false, hasLocked: false },
      { category: 'offer', enabled: true, hasLocked: true },
    ]);
  });

  test('channelMap maps category to enabled for that channel', () => {
    expect(channelMap(PREFS, 'email')).toEqual({ engagement: true, offer: false, account: true });
    expect(channelMap(PREFS, 'push')).toEqual({ engagement: false, offer: true });
  });
});

describe('diffChannel', () => {
  test('sends only the categories that changed', () => {
    expect(
      diffChannel(
        { offer: false, review: true, account: true },
        { offer: true, review: true, account: true },
      ),
    ).toEqual({ offer: false });
  });

  test('is null when nothing changed, so no empty object is sent', () => {
    expect(diffChannel({ offer: true }, { offer: true })).toBeNull();
    expect(diffChannel({}, {})).toBeNull();
  });
});
