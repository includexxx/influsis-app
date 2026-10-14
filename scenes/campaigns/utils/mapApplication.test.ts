import { describe, expect, test } from '@jest/globals';
import { MyEngagementItem } from '../types/myEngagement';
import { formatRelativeTime, mapApplicationToCard, mapInvitationToCard } from './mapApplication';

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
    budgetMinAmountMinor: 600000,
    budgetMaxAmountMinor: 600000,
    currency: 'BDT',
    applicationDeadline: '2026-10-01',
    contentDeadline: null,
  },
};

describe('mapApplicationToCard', () => {
  test('maps a pending application, labelling the proposal as the creator’s rate', () => {
    expect(mapApplicationToCard(engagement)).toEqual({
      image: { uri: 'https://cdn.influsis.test/cover.jpg' },
      title: 'Bkash Branding Campaign',
      date: 'Applied 10 Jul',
      amountLabel: 'Your rate',
      amount: 'BDT 4,500',
    });
  });

  test('prefers the agreed fee, then the latest offer, over the proposal', () => {
    expect(mapApplicationToCard({ ...engagement, latestOfferAmountMinor: 500000 })).toMatchObject({
      amountLabel: 'Latest offer',
      amount: 'BDT 5,000',
    });
    expect(
      mapApplicationToCard({
        ...engagement,
        status: 'accepted',
        latestOfferAmountMinor: 500000,
        agreedAmountMinor: 520000,
      }),
    ).toMatchObject({ amountLabel: 'Agreed fee', amount: 'BDT 5,200' });
  });

  test('dates an invitation as "Invited"', () => {
    expect(mapApplicationToCard({ ...engagement, origin: 'invited' }).date).toBe('Invited 10 Jul');
  });

  test('falls back when the campaign summary is missing', () => {
    expect(
      mapApplicationToCard({ ...engagement, proposedAmountMinor: null, campaign: null }),
    ).toMatchObject({
      image: null,
      title: 'Untitled campaign',
      amountLabel: 'Budget',
      amount: 'Negotiable',
    });
  });
});

describe('mapInvitationToCard', () => {
  const now = new Date('2026-07-10T09:05:00.000Z').getTime();

  test('leads with the campaign, its budget and application deadline', () => {
    expect(mapInvitationToCard({ ...engagement, origin: 'invited' }, now)).toEqual({
      avatar: { uri: 'https://cdn.influsis.test/avatar.jpg' },
      title: 'Bkash Branding Campaign',
      amountLabel: 'Budget',
      amount: 'BDT 6,000',
      deadline: '01 Oct, 2026',
      time: '5 min ago',
    });
  });

  test("shows the business's offer when there is one", () => {
    expect(
      mapInvitationToCard(
        { ...engagement, origin: 'invited', latestOfferAmountMinor: 550000 },
        now,
      ),
    ).toMatchObject({ amountLabel: 'Offer', amount: 'BDT 5,500' });
  });

  test('has no deadline when the campaign has none', () => {
    expect(
      mapInvitationToCard(
        { ...engagement, campaign: { ...engagement.campaign!, applicationDeadline: null } },
        now,
      ).deadline,
    ).toBeNull();
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
