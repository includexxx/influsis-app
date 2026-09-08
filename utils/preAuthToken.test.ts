import { beforeEach, describe, expect, test } from '@jest/globals';
import {
  clearPendingPreAuthToken,
  getPendingPreAuthToken,
  setPendingPreAuthToken,
} from './preAuthToken';

describe('preAuthToken holder', () => {
  beforeEach(() => clearPendingPreAuthToken());

  test('get before any set is null', () => {
    expect(getPendingPreAuthToken()).toBeNull();
  });

  test('set then get returns the token, and get again still returns it', () => {
    setPendingPreAuthToken('pat-1');
    expect(getPendingPreAuthToken()).toBe('pat-1');
    expect(getPendingPreAuthToken()).toBe('pat-1');
  });

  test('clear nulls it', () => {
    setPendingPreAuthToken('pat-1');
    clearPendingPreAuthToken();
    expect(getPendingPreAuthToken()).toBeNull();
  });
});
