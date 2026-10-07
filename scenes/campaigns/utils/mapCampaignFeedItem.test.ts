import { describe, expect, jest, test } from '@jest/globals';
import { CampaignFeedItem } from '../types/campaignFeed';
import {
  formatCampaignDueDate,
  formatCampaignEngagementStatus,
  formatCampaignPrice,
  mapCampaignFeedItemToCard,
} from './mapCampaignFeedItem';

jest.mock('@/utils/config', () => ({
  __esModule: true,
  default: { apiUrl: 'http://192.168.0.10:3001/api/v1' },
}));

const baseCampaign: CampaignFeedItem = {
  id: 'campaign-1',
  title: 'Bkash Branding Campaign',
  type: 'sponsored_post',
  status: 'live',
  coverUrl: 'https://cdn.influsis.test/campaign-1/cover.jpg',
  avatarUrl: 'https://cdn.influsis.test/campaign-1/avatar.jpg',
  budgetAmountMinor: 50000,
  currency: 'BDT',
  licensingTier: 1,
  applicationDeadline: '2026-10-01',
  contentDeadline: null,
  campaignEndDate: null,
  publishedAt: '2026-09-01T00:00:00.000Z',
  businessId: 'business-1',
  businessName: 'Bkash Ltd. Company',
  myEngagement: null,
};

describe('formatCampaignDueDate', () => {
  test('renders a YYYY-MM-DD field as "D Mon YYYY"', () => {
    expect(formatCampaignDueDate('2026-10-01')).toBe('01 Oct, 2026');
    expect(formatCampaignDueDate('2022-01-21')).toBe('21 Jan, 2022');
  });

  test('is stable across timezones (no UTC-midnight shift)', () => {
    expect(formatCampaignDueDate('2026-01-01')).toBe('01 Jan, 2026');
  });

  test('falls back to "No deadline" for null or malformed input', () => {
    expect(formatCampaignDueDate(null)).toBe('No deadline');
    expect(formatCampaignDueDate('not-a-date')).toBe('No deadline');
  });
});

describe('formatCampaignPrice', () => {
  test('converts minor units to a whole-number amount with the currency prefixed', () => {
    expect(formatCampaignPrice(50000, 'BDT')).toBe('BDT 500');
  });

  test('keeps two decimal places for a fractional amount', () => {
    expect(formatCampaignPrice(50050, 'BDT')).toBe('BDT 500.50');
  });

  test('falls back to "Negotiable" when no budget is set', () => {
    expect(formatCampaignPrice(null, 'BDT')).toBe('Negotiable');
  });
});

describe('mapCampaignFeedItemToCard', () => {
  test('maps cover/avatar URLs to remote image sources', () => {
    const result = mapCampaignFeedItemToCard(baseCampaign);
    expect(result.image).toEqual({ uri: baseCampaign.coverUrl });
    expect(result.businessAvatar).toEqual({ uri: baseCampaign.avatarUrl });
    expect(result.businessName).toBe('Bkash Ltd. Company');
    expect(result.title).toBe('Bkash Branding Campaign');
    expect(result.price).toBe('BDT 500');
    expect(result.dueDate).toBe('01 Oct, 2026');
  });

  test('leaves cover/avatar null when unset so the card falls back', () => {
    const result = mapCampaignFeedItemToCard({
      ...baseCampaign,
      coverUrl: null,
      avatarUrl: null,
    });
    expect(result.image).toBeNull();
    expect(result.businessAvatar).toBeNull();
  });

  test('rewrites a local-dev localhost media URL onto the API host', () => {
    const result = mapCampaignFeedItemToCard({
      ...baseCampaign,
      coverUrl: 'http://localhost:3001/uploads/campaign-images/cover.webp',
      avatarUrl: 'http://127.0.0.1:3001/uploads/campaign-images/avatar.webp',
    });
    expect(result.image).toEqual({
      uri: 'http://192.168.0.10:3001/uploads/campaign-images/cover.webp',
    });
    expect(result.businessAvatar).toEqual({
      uri: 'http://192.168.0.10:3001/uploads/campaign-images/avatar.webp',
    });
  });

  test('shows no status when the creator has no engagement', () => {
    expect(mapCampaignFeedItemToCard(baseCampaign).status).toBeUndefined();
  });
});

describe('formatCampaignEngagementStatus', () => {
  test('labels a pending engagement by who started it', () => {
    expect(
      formatCampaignEngagementStatus({ id: 'e1', origin: 'requested', status: 'pending' }),
    ).toBe('Applied');
    expect(formatCampaignEngagementStatus({ id: 'e1', origin: 'invited', status: 'pending' })).toBe(
      'Invited',
    );
  });

  test('labels countered and accepted engagements', () => {
    expect(
      formatCampaignEngagementStatus({ id: 'e1', origin: 'requested', status: 'countered' }),
    ).toBe('Countered');
    expect(
      formatCampaignEngagementStatus({ id: 'e1', origin: 'invited', status: 'accepted' }),
    ).toBe('Accepted');
  });

  test('returns undefined for no engagement or an unknown status', () => {
    expect(formatCampaignEngagementStatus(null)).toBeUndefined();
    expect(
      formatCampaignEngagementStatus({ id: 'e1', origin: 'requested', status: 'withdrawn' }),
    ).toBeUndefined();
  });
});
