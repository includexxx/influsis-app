import { describe, expect, test } from '@jest/globals';
import { getBusinessInitial } from './businessAvatar';

describe('getBusinessInitial', () => {
  test('uppercases the first letter of the business name', () => {
    expect(getBusinessInitial('bkash Ltd. Company')).toBe('B');
    expect(getBusinessInitial('Acme Marketing Ltd.')).toBe('A');
  });

  test('ignores leading whitespace', () => {
    expect(getBusinessInitial('  Uber')).toBe('U');
  });

  test('falls back to "?" for an empty or blank name', () => {
    expect(getBusinessInitial('')).toBe('?');
    expect(getBusinessInitial('   ')).toBe('?');
  });
});
