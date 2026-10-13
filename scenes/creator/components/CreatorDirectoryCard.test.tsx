import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { CreatorDirectoryItem } from '../types/creatorDirectory';
import CreatorDirectoryCard from './CreatorDirectoryCard';

const creator: CreatorDirectoryItem = {
  userId: 'c1',
  displayName: 'Ayesha Rahman',
  categories: ['beauty'],
  country: 'bangladesh',
  state: null,
  city: 'Dhaka',
  contactEmail: null,
  contactPhone: null,
  avatarUrl: null,
  isDiscoverable: true,
  verificationStatus: 'verified',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('<CreatorDirectoryCard /> rating brief (37c)', () => {
  test.each(['stack', 'grid'] as const)('shows "4.5 (12)" in the %s card', variant => {
    render(
      <CreatorDirectoryCard
        creator={{ ...creator, reputation: { averageRating: 4.5, reviewCount: 12 } }}
        variant={variant}
      />,
    );
    expect(screen.getByText('4.5 (12)')).toBeTruthy();
    expect(screen.getByTestId('creator-card-c1').props.accessibilityLabel).toContain(
      'Rated 4.5 from 12 reviews',
    );
  });

  test('"New" with no ratings', () => {
    render(
      <CreatorDirectoryCard
        creator={{ ...creator, reputation: { averageRating: null, reviewCount: 0 } }}
      />,
    );
    expect(screen.getByText('New')).toBeTruthy();
  });

  test('nothing without reputation', () => {
    render(<CreatorDirectoryCard creator={creator} />);
    expect(screen.queryByTestId('creator-card-rating-c1')).toBeNull();
  });
});
