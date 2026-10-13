import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { BusinessDirectoryItem } from '../types/businessDirectory';
import BusinessCard from './BusinessCard';

const business: BusinessDirectoryItem = {
  userId: 'b1',
  businessName: 'Pathao Ltd.',
  username: 'pathao',
  description: 'Ride sharing and delivery.',
  categories: [],
  subcategories: [],
  country: 'bangladesh',
  state: null,
  city: 'Dhaka',
  contactEmail: null,
  contactPhone: null,
  websiteUrl: null,
  avatarUrl: null,
  verificationStatus: 'verified',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('<BusinessCard /> rating brief (37c)', () => {
  test.each(['stack', 'grid'] as const)('shows "4.5 (12)" in the %s card', variant => {
    render(
      <BusinessCard
        business={{ ...business, reputation: { averageRating: 4.5, reviewCount: 12 } }}
        variant={variant}
      />,
    );
    expect(screen.getByText('4.5 (12)')).toBeTruthy();
    expect(screen.getByTestId('business-card-b1').props.accessibilityLabel).toContain(
      'Rated 4.5 from 12 reviews',
    );
  });

  test('"New" with no ratings', () => {
    render(
      <BusinessCard
        business={{ ...business, reputation: { averageRating: null, reviewCount: 0 } }}
      />,
    );
    expect(screen.getByText('New')).toBeTruthy();
  });

  test('nothing without reputation', () => {
    render(<BusinessCard business={business} />);
    expect(screen.queryByTestId('business-card-rating-b1')).toBeNull();
  });
});
