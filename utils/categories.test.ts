import { describe, expect, test } from '@jest/globals';
import { formatCategory, visibleCategories } from './categories';

describe('formatCategory', () => {
  test('turns a slug into sentence case', () => {
    expect(formatCategory('fintech')).toBe('Fintech');
    expect(formatCategory('food-and_beverage')).toBe('Food and beverage');
    expect(formatCategory('  ')).toBe('');
  });
});

describe('visibleCategories', () => {
  test('caps the list and counts the rest', () => {
    expect(visibleCategories(['fintech', 'retail', 'food'], 2)).toEqual({
      shown: ['Fintech', 'Retail'],
      extra: 1,
    });
    expect(visibleCategories([], 2)).toEqual({ shown: [], extra: 0 });
  });
});
