import { describe, expect, test } from '@jest/globals';
import { NotificationPreference } from '@/types';
import { diffEmail, emailMap, emailToggles } from './emailPreferences';

function pref(
  category: string,
  email: { enabled: boolean; locked?: string[] } | null,
): NotificationPreference {
  return {
    category,
    inApp: { enabled: true, locked: true },
    email: email
      ? { enabled: email.enabled, lockedEvents: email.locked ?? [], optionalEvents: ['x'] }
      : null,
    push: null,
  };
}

describe('emailToggles', () => {
  test('keeps NT5 order, skips a null email channel, flags locked events', () => {
    expect(
      emailToggles([
        pref('engagement', { enabled: true, locked: ['engagement.accepted'] }),
        pref('campaign', null),
        pref('offer', { enabled: false }),
      ]),
    ).toEqual([
      { category: 'engagement', enabled: true, hasLocked: true },
      { category: 'offer', enabled: false, hasLocked: false },
    ]);
  });

  test('emailMap maps category to enabled', () => {
    expect(
      emailMap([pref('offer', { enabled: false }), pref('review', { enabled: true })]),
    ).toEqual({
      offer: false,
      review: true,
    });
  });
});

describe('diffEmail', () => {
  test('sends only the categories that changed', () => {
    expect(
      diffEmail(
        { offer: false, review: true, account: true },
        { offer: true, review: true, account: true },
      ),
    ).toEqual({ offer: false });
  });

  test('is null when nothing changed, so no empty object is sent', () => {
    expect(diffEmail({ offer: true }, { offer: true })).toBeNull();
    expect(diffEmail({}, {})).toBeNull();
  });
});
