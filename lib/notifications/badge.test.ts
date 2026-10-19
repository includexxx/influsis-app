import { describe, expect, test } from '@jest/globals';
import { formatBadgeCount } from './badge';

describe('formatBadgeCount', () => {
  test.each([
    [1, '1'],
    [9, '9'],
    [99, '99'],
    [100, '99+'],
    [12_345, '99+'],
  ])('%d -> %s', (count, text) => {
    expect(formatBadgeCount(count)).toBe(text);
  });
});
