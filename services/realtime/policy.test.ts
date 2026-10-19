import { describe, expect, test } from '@jest/globals';
import { BACKOFF_MAX_MS, backoffDelay, connectErrorAction, serverDisconnectAction } from './policy';

describe('connectErrorAction', () => {
  test.each(['AUTH_TOKEN_MISSING', 'AUTH_TOKEN_INVALID', 'AUTH_TOKEN_EXPIRED'])(
    '%s refreshes, then retries',
    code => expect(connectErrorAction(code)).toBe('refresh-then-retry'),
  );

  test.each([
    'AUTH_SESSION_REVOKED',
    'ACCOUNT_SUSPENDED',
    'ACCOUNT_DEACTIVATED',
    'ACCOUNT_PENDING_VERIFICATION',
  ])('%s signs out', code => expect(connectErrorAction(code)).toBe('sign-out'));

  test.each(['INTERNAL_ERROR', 'SOMETHING_NEW', undefined])('%s retries', code =>
    expect(connectErrorAction(code)).toBe('retry'),
  );
});

describe('backoffDelay', () => {
  const middle = () => 0.5; // jitter x1.0

  test('doubles from 1 s and caps at 30 s', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 10].map(n => backoffDelay(n, middle))).toEqual([
      1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000, 30_000,
    ]);
  });

  test('jitter stays within x0.5-1.5 and never passes the cap', () => {
    expect(backoffDelay(0, () => 0)).toBe(500);
    expect(backoffDelay(0, () => 0.999)).toBe(1_499);
    expect(backoffDelay(4, () => 0.999)).toBe(23_984);
    expect(backoffDelay(5, () => 0.999)).toBe(BACKOFF_MAX_MS);
    expect(backoffDelay(10, () => 0)).toBe(15_000);
  });
});

describe('serverDisconnectAction', () => {
  test('a working refresh reconnects', () => {
    expect(serverDisconnectAction({ ok: true })).toBe('reconnect');
  });

  test.each([
    [{ ok: false as const, statusCode: 401, code: 'AUTH_SESSION_REVOKED' }],
    [{ ok: false as const, statusCode: 403, code: 'ACCOUNT_SUSPENDED' }],
    [{ ok: false as const, code: 'ACCOUNT_DEACTIVATED' }],
  ])('a dead session or account signs out (%o)', outcome => {
    expect(serverDisconnectAction(outcome)).toBe('sign-out');
  });

  test.each([
    [{ ok: false as const, statusCode: 0, code: 'NETWORK_ERROR' }],
    [{ ok: false as const, statusCode: 500, code: 'INTERNAL_ERROR' }],
  ])('a network or server failure retries (%o)', outcome => {
    expect(serverDisconnectAction(outcome)).toBe('retry');
  });
});
