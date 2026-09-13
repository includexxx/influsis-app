import { describe, expect, test } from '@jest/globals';
import type { AuthStatus } from '@/slices/auth.slice';
import { authGate, GateGroup } from './authGate';

describe('authGate', () => {
  test.each<[AuthStatus, GateGroup, string | undefined, ReturnType<typeof authGate>]>([
    ['restoring', '(main)', undefined, { type: 'wait' }],
    ['restoring', '(details)', undefined, { type: 'wait' }],
    ['restoring', '(auth)', 'auth', { type: 'wait' }],
    ['restoring', '(auth)', 'profile-verification', { type: 'wait' }],

    ['unauthenticated', '(main)', undefined, { type: 'redirect', href: '/onboarding' }],
    ['unauthenticated', '(details)', undefined, { type: 'redirect', href: '/onboarding' }],
    ['unauthenticated', '(auth)', 'auth', { type: 'allow' }],
    ['unauthenticated', '(auth)', 'onboarding', { type: 'allow' }],
    [
      'unauthenticated',
      '(auth)',
      'profile-verification',
      { type: 'redirect', href: '/onboarding' },
    ],

    ['authenticated', '(main)', undefined, { type: 'allow' }],
    ['authenticated', '(details)', undefined, { type: 'allow' }],
    ['authenticated', '(auth)', 'auth', { type: 'redirect', href: '/home' }],
    ['authenticated', '(auth)', 'onboarding', { type: 'redirect', href: '/home' }],
    ['authenticated', '(auth)', 'profile-verification', { type: 'allow' }],
  ])('%s + %s + %s', (status, group, area, expected) => {
    expect(authGate(status, group, area)).toEqual(expected);
  });

  test('an unknown (auth) area is treated as the auth/onboarding case', () => {
    expect(authGate('authenticated', '(auth)', undefined)).toEqual({
      type: 'redirect',
      href: '/home',
    });
    expect(authGate('authenticated', '(auth)', 'something-else')).toEqual({
      type: 'redirect',
      href: '/home',
    });
    expect(authGate('unauthenticated', '(auth)', undefined)).toEqual({ type: 'allow' });
  });
});
