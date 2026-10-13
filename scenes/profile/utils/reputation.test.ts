import { describe, expect, test } from '@jest/globals';
import { profileStats } from './reputation';

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
