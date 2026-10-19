import { describe, expect, test } from '@jest/globals';
import { holdNotificationRoute, takeNotificationRoute } from './pendingRoute';

describe('pendingRoute', () => {
  test('take returns nothing when nothing is held', () => {
    expect(takeNotificationRoute()).toBeNull();
  });

  test('take returns the held path once, then clears it', () => {
    holdNotificationRoute('/engagement/e-1');
    expect(takeNotificationRoute()).toBe('/engagement/e-1');
    expect(takeNotificationRoute()).toBeNull();
  });

  test('the last hold wins', () => {
    holdNotificationRoute('/engagement/e-1');
    holdNotificationRoute('/my-profile');
    expect(takeNotificationRoute()).toBe('/my-profile');
  });
});
