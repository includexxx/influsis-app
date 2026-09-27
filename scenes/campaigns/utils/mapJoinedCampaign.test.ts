import { describe, expect, jest, test } from '@jest/globals';
import { MyEngagementItem } from '../types/myEngagement';
import { mapJoinedCampaignToCard } from './mapJoinedCampaign';

jest.mock('@/utils/config', () => ({
  __esModule: true,
  default: { apiUrl: 'http://192.168.0.10:3001/api/v1' },
}));

const engagement: MyEngagementItem = {
  id: 'e1',
  campaignId: 'c1',
  creatorId: 'u1',
  origin: 'requested',
  status: 'accepted',
  pitch: null,
  proposedAmountMinor: 500000,
  agreedAmountMinor: 550000,
  latestOfferAmountMinor: null,
  latestOfferNote: null,
  currency: 'BDT',
  crossedIntentAt: null,
  createdAt: '2026-09-26T10:00:00.000Z',
  campaign: {
    campaignId: 'c1',
    title: 'New Shop Openning',
    status: 'live',
    coverUrl: 'campaign-images/cover.webp',
    avatarUrl: null,
    budgetAmountMinor: 600000,
    currency: 'BDT',
    applicationDeadline: '2026-10-01',
    contentDeadline: '2026-10-10',
  },
};

describe('mapJoinedCampaignToCard', () => {
  test('shows the agreed fee, content deadline, and a resolved cover', () => {
    expect(mapJoinedCampaignToCard(engagement)).toEqual({
      image: { uri: 'http://192.168.0.10:3001/uploads/campaign-images/cover.webp' },
      businessAvatar: null,
      title: 'New Shop Openning',
      price: 'BDT 5,500',
      dueDate: '10 Oct 2026',
    });
  });

  test('falls back to the budget and application deadline', () => {
    const result = mapJoinedCampaignToCard({
      ...engagement,
      agreedAmountMinor: null,
      campaign: { ...engagement.campaign!, contentDeadline: null },
    });
    expect(result.price).toBe('BDT 6,000');
    expect(result.dueDate).toBe('1 Oct 2026');
  });

  test('handles a missing campaign summary', () => {
    const result = mapJoinedCampaignToCard({
      ...engagement,
      agreedAmountMinor: null,
      campaign: null,
    });
    expect(result.title).toBe('Untitled campaign');
    expect(result.image).toBeNull();
    expect(result.price).toBe('Negotiable');
    expect(result.dueDate).toBe('No deadline');
  });
});
