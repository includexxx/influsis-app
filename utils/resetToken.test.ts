import { beforeEach, describe, expect, test } from '@jest/globals';
import { clearPendingResetToken, getPendingResetToken, setPendingResetToken } from './resetToken';

describe('resetToken holder', () => {
  beforeEach(() => clearPendingResetToken());

  test('get before any set is null', () => {
    expect(getPendingResetToken()).toBeNull();
  });

  test('set then get returns the token, and get again still returns it', () => {
    setPendingResetToken('rt-1');
    expect(getPendingResetToken()).toBe('rt-1');
    expect(getPendingResetToken()).toBe('rt-1');
  });

  test('clear nulls it', () => {
    setPendingResetToken('rt-1');
    clearPendingResetToken();
    expect(getPendingResetToken()).toBeNull();
  });
});
