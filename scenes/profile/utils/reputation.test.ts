import { describe, expect, test } from '@jest/globals';
import { profileStats, reputationBrief, reviewerHref } from './reputation';

const reputation = { averageRating: 4.5, reviewCount: 12, completedEngagements: 14 };

describe('profileStats', () => {
  test('shows the average and the completed count', () => {
    expect(profileStats({ discoverable: true, reputation })).toEqual({
      rating: '4.5',
      ratingLabel: 'Rating',
      projects: '14',
    });
  });

  test('"New" with no visible reviews', () => {
    expect(
      profileStats({ discoverable: true, reputation: { ...reputation, averageRating: null } }),
    ).toEqual({ rating: 'New', ratingLabel: 'No ratings yet', projects: '14' });
  });

  test('0 is a real average, not "New"', () => {
    expect(
      profileStats({ discoverable: true, reputation: { ...reputation, averageRating: 0 } }).rating,
    ).toBe('0');
  });

  test('"—" when not discoverable or not loaded', () => {
    const unknown = { rating: '—', ratingLabel: 'Rating', projects: '—' };
    expect(profileStats({ discoverable: false, reputation })).toEqual(unknown);
    expect(profileStats({ discoverable: true, reputation: undefined })).toEqual(unknown);
    expect(profileStats({ discoverable: true, reputation: null })).toEqual(unknown);
  });
});

describe('reputationBrief', () => {
  test('average and review count', () => {
    expect(reputationBrief({ averageRating: 4.5, reviewCount: 12 })).toEqual({
      text: '4.5 (12)',
      accessibilityLabel: 'Rated 4.5 from 12 reviews',
    });
  });

  test('one review is singular', () => {
    expect(reputationBrief({ averageRating: 5, reviewCount: 1 }).accessibilityLabel).toBe(
      'Rated 5 from 1 review',
    );
  });

  test('0 is a real average', () => {
    expect(reputationBrief({ averageRating: 0, reviewCount: 2 }).text).toBe('0 (2)');
  });

  test('"New" with no visible reviews', () => {
    expect(reputationBrief({ averageRating: null, reviewCount: 0 })).toEqual({
      text: 'New',
      accessibilityLabel: 'No ratings yet',
    });
  });
});

describe('reviewerHref', () => {
  const reviewer = { userId: 'u1', displayName: 'Bkash Ltd.', handle: 'bkash', avatarUrl: null };

  test('opens the reviewer by kind', () => {
    expect(reviewerHref(reviewer, 'business')).toBe('/business/u1');
    expect(reviewerHref(reviewer, 'creator')).toBe('/creator/u1');
  });

  test('no link without a handle', () => {
    expect(
      reviewerHref(
        { ...reviewer, displayName: 'Former Influsis member', handle: null },
        'business',
      ),
    ).toBeNull();
  });
});
