import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CampaignFeedItem } from '../types/campaignFeed';
import FeedCampaignCard from './FeedCampaignCard';

// The row shape the backend returns for GET /feed/campaigns.
const campaign: CampaignFeedItem = {
  id: 'c37bd636-54fb-4469-9752-a3ce2cc2128c',
  title: 'New Shop Openning',
  type: 'campaign',
  status: 'live',
  coverUrl: 'http://localhost:3001/uploads/campaign-images/cover.webp',
  avatarUrl: 'http://localhost:3001/uploads/campaign-images/avatar.webp',
  budgetAmountMinor: 600000,
  currency: 'BDT',
  licensingTier: 1,
  applicationDeadline: '2026-10-10',
  contentDeadline: '2026-10-10',
  campaignEndDate: '2026-10-10',
  publishedAt: '2026-09-26T10:19:12.511Z',
  businessId: '8ba43b43-fb06-4ee2-a25d-caa71f4189b5',
  businessName: 'Dhaka Delights Ltd.',
  myEngagement: null,
};

describe('<FeedCampaignCard />', () => {
  test('renders a backend feed row as a list card', () => {
    render(<FeedCampaignCard campaign={campaign} />);
    expect(screen.getByText('New Shop Openning')).not.toBeNull();
    expect(screen.getByText('Dhaka Delights Ltd.')).not.toBeNull();
    expect(screen.getByText('BDT 6,000')).not.toBeNull();
    expect(screen.getByText('10 Oct, 2026')).not.toBeNull();
  });

  test('shows an Applied badge when the creator already applied', () => {
    render(
      <FeedCampaignCard
        campaign={{
          ...campaign,
          myEngagement: { id: 'e1', origin: 'requested', status: 'pending' },
        }}
      />,
    );
    expect(screen.getByText('Applied')).not.toBeNull();
  });

  test('passes the campaign id to onPress', () => {
    const onPress = jest.fn();
    render(<FeedCampaignCard campaign={campaign} onPress={onPress} />);
    fireEvent.press(screen.getByTestId(`feed-campaign-${campaign.id}`));
    expect(onPress).toHaveBeenCalledWith(campaign.id);
  });
});
