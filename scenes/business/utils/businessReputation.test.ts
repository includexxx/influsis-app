import { describe, expect, test } from '@jest/globals';
import { businessRatingSummary } from './businessReputation';

describe('businessRatingSummary', () => {
  test('rating, reviews and completed campaigns', () => {
    expect(
      businessRatingSummary({ averageRating: 4.5, reviewCount: 12, completedEngagements: 14 }),
    ).toBe('4.5 · 12 reviews · 14 campaigns completed');
  });

  test('singular counts', () => {
    expect(
      businessRatingSummary({ averageRating: 5, reviewCount: 1, completedEngagements: 1 }),
    ).toBe('5 · 1 review · 1 campaign completed');
  });

  test('"New" keeps the completed count', () => {
    expect(
      businessRatingSummary({ averageRating: null, reviewCount: 0, completedEngagements: 3 }),
    ).toBe('New - no ratings yet · 3 campaigns completed');
  });

  test('0 is a real average', () => {
    expect(
      businessRatingSummary({ averageRating: 0, reviewCount: 2, completedEngagements: 2 }),
    ).toBe('0 · 2 reviews · 2 campaigns completed');
  });
});
