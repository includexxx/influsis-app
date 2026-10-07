import { describe, expect, test } from '@jest/globals';
import { palette } from '@/theme';
import { MyEngagementItem } from '../types/myEngagement';
import {
  formatRelativeTime,
  mapApplicationToCard,
  mapCampaignRequestToRow,
} from './mapApplication';

const engagement: MyEngagementItem = {
  id: 'eng-1',
  campaignId: 'campaign-1',
  creatorId: 'creator-1',
  origin: 'requested',
  status: 'pending',
  pitch: 'I would love to',
  proposedAmountMinor: 450000,
  agreedAmountMinor: null,
  latestOfferAmountMinor: null,
  latestOfferNote: null,
  currency: 'BDT',
  crossedIntentAt: null,
  createdAt: '2026-07-10T09:00:00.000Z',
  campaign: {
    campaignId: 'campaign-1',
    title: 'Bkash Branding Campaign',
    status: 'live',
    coverUrl: 'https://cdn.influsis.test/cover.jpg',
    avatarUrl: 'https://cdn.influsis.test/avatar.jpg',
    budgetAmountMinor: 600000,
    currency: 'BDT',
    applicationDeadline: '2026-10-01',
    contentDeadline: null,
  },
};

describe('mapApplicationToCard', () => {
  test('maps a pending application to an "Applied" card', () => {
    expect(mapApplicationToCard(engagement)).toEqual({
      image: { uri: 'https://cdn.influsis.test/cover.jpg' },
      title: 'Bkash Branding Campaign',
      price: 'BDT 4,500',
      dueDate: 'Applied 10 Jul',
      status: 'Applied',
      statusColor: palette.primary[400],
      statusTextColor: palette.white,
    });
  });

  test('prefers the agreed fee, then the latest offer, over the proposal', () => {
    expect(mapApplicationToCard({ ...engagement, latestOfferAmountMinor: 500000 }).price).toBe(
      'BDT 5,000',
    );
    expect(
      mapApplicationToCard({
        ...engagement,
        status: 'accepted',
        latestOfferAmountMinor: 500000,
        agreedAmountMinor: 520000,
      }),
    ).toMatchObject({ price: 'BDT 5,200', status: 'Accepted' });
  });

  test('labels closed applications by status', () => {
    expect(mapApplicationToCard({ ...engagement, status: 'declined' }).status).toBe('Declined');
    expect(mapApplicationToCard({ ...engagement, status: 'withdrawn' }).status).toBe('Withdrawn');
  });

  test('falls back when the campaign summary is missing', () => {
    expect(
      mapApplicationToCard({ ...engagement, proposedAmountMinor: null, campaign: null }),
    ).toMatchObject({ image: null, title: 'Untitled campaign', price: 'Negotiable' });
  });
});

describe('mapCampaignRequestToRow', () => {
  test('names the campaign since the row has no business name', () => {
    const now = new Date('2026-07-10T09:05:00.000Z').getTime();
    expect(mapCampaignRequestToRow({ ...engagement, origin: 'invited' }, now)).toEqual({
      avatar: { uri: 'https://cdn.influsis.test/avatar.jpg' },
      name: 'Bkash Branding Campaign',
      message: "You're invited to join Bkash Branding Campaign",
      time: '5 min ago',
    });
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-07-20T12:00:00.000Z').getTime();

  test.each([
    ['2026-07-20T11:59:30.000Z', 'Just now'],
    ['2026-07-20T09:00:00.000Z', '3 h ago'],
    ['2026-07-18T12:00:00.000Z', '2 d ago'],
  ])('%s -> %s', (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected);
  });

  test('shows a date after a week and nothing for an invalid value', () => {
    expect(formatRelativeTime('2026-07-01T12:00:00.000Z', now)).toMatch(/^01 Jul, 2026$/);
    expect(formatRelativeTime('not a date', now)).toBe('');
  });
});
