import { describe, expect, test } from '@jest/globals';

import { EngagementOffer, MyEngagementDetail } from '../types/myEngagement';
import { buildCreatorAgreement, licensingMarkupMinor } from './agreement';

function offer(
  id: string,
  senderType: EngagementOffer['senderType'],
  status: EngagementOffer['status'],
  amountMinor: number,
): EngagementOffer {
  return {
    id,
    roundNo: 1,
    senderType,
    amountMinor,
    currency: 'BDT',
    note: null,
    status,
    scopeChanged: false,
    createdAt: '2026-09-28T10:00:00.000Z',
  };
}

function detail(overrides: Partial<MyEngagementDetail>): MyEngagementDetail {
  return {
    id: 'eng-1',
    campaignId: 'campaign-1',
    creatorId: 'creator-1',
    origin: 'invited',
    status: 'pending',
    pitch: null,
    proposedAmountMinor: null,
    agreedAmountMinor: null,
    latestOfferAmountMinor: null,
    latestOfferNote: null,
    currency: 'BDT',
    crossedIntentAt: null,
    createdAt: '2026-09-28T10:00:00.000Z',
    offers: [],
    scope: [{ id: 'scope-1', platform: 'instagram', type: 'reels', count: 2 }],
    negotiationRoundLimit: 3,
    negotiationRoundCount: 1,
    licensingMarkupMinor: null,
    acceptedAt: null,
    closedAt: null,
    closeReason: null,
    nextAction: null,
    escrowFundingDeadline: null,
    ...overrides,
  };
}

function campaign(licensingTier: 1 | 2 | 3) {
  return {
    title: 'Pathao Summer Push',
    licensingTier,
    contentDeadline: '2026-10-10',
    business: {
      businessId: 'biz-1',
      businessName: 'Pathao Ltd.',
      avatarUrl: 'avatars/pathao.webp',
      verificationStatus: 'verified',
    },
  };
}

describe('licensingMarkupMinor', () => {
  test('tier 1 adds nothing, tier 2 adds 25%, tier 3 adds 50%', () => {
    expect(licensingMarkupMinor(1_000_000, 1)).toBe(0);
    expect(licensingMarkupMinor(1_000_000, 2)).toBe(250_000);
    expect(licensingMarkupMinor(1_000_000, 3)).toBe(500_000);
  });

  test('truncates like the backend integer division', () => {
    expect(licensingMarkupMinor(1, 2)).toBe(0);
    expect(licensingMarkupMinor(3, 3)).toBe(1);
    expect(licensingMarkupMinor(10, 2)).toBe(2);
  });
});

describe('buildCreatorAgreement - confirm', () => {
  test("adds the tier markup to the business's pending offer", () => {
    const agreement = buildCreatorAgreement(
      detail({
        offers: [
          offer('o1', 'creator', 'superseded', 1_500_000),
          offer('o2', 'business', 'pending', 1_000_000),
        ],
      }),
      campaign(2),
      'confirm',
    );

    expect(agreement).toEqual({
      mode: 'confirm',
      offerId: 'o2',
      businessName: 'Pathao Ltd.',
      businessAvatarUrl: 'avatars/pathao.webp',
      campaignTitle: 'Pathao Summer Push',
      scope: [{ platform: 'instagram', type: 'reels', count: 2 }],
      contentDeadline: '10 Oct, 2026',
      youReceiveMinor: 1_250_000,
      licensingMinor: 250_000,
      licensingPercent: 25,
      currency: 'BDT',
      acceptedAt: null,
      isCompleted: false,
    });
  });

  test('tier 1 receives the offer as is', () => {
    const agreement = buildCreatorAgreement(
      detail({ offers: [offer('o1', 'business', 'pending', 1_000_000)] }),
      campaign(1),
      'confirm',
    );
    expect(agreement?.youReceiveMinor).toBe(1_000_000);
    expect(agreement?.licensingMinor).toBe(0);
    expect(agreement?.licensingPercent).toBe(0);
  });

  test("is null without a pending business offer or the campaign's terms", () => {
    expect(
      buildCreatorAgreement(
        detail({ offers: [offer('o1', 'creator', 'pending', 1_000_000)] }),
        campaign(2),
        'confirm',
      ),
    ).toBeNull();
    expect(
      buildCreatorAgreement(
        detail({ offers: [offer('o1', 'business', 'pending', 1_000_000)] }),
        null,
        'confirm',
      ),
    ).toBeNull();
  });
});

describe('buildCreatorAgreement - confirmed', () => {
  test("uses the server's agreed amount and markup, not the tier", () => {
    const agreement = buildCreatorAgreement(
      detail({
        status: 'accepted',
        agreedAmountMinor: 2_300_000,
        licensingMarkupMinor: 575_000,
        acceptedAt: '2026-09-30T10:00:00',
      }),
      // A tier-3 campaign would recompute 1,150,000; the server's number wins.
      campaign(3),
      'confirmed',
    );
    expect(agreement?.youReceiveMinor).toBe(2_875_000);
    expect(agreement?.licensingMinor).toBe(575_000);
    expect(agreement?.offerId).toBeNull();
    expect(agreement?.acceptedAt).toBe('30 Sep, 2026');
    expect(agreement?.isCompleted).toBe(false);
  });

  test('a null markup counts as none', () => {
    const agreement = buildCreatorAgreement(
      detail({ status: 'completed', agreedAmountMinor: 2_000_000 }),
      campaign(1),
      'confirmed',
    );
    expect(agreement?.youReceiveMinor).toBe(2_000_000);
    expect(agreement?.licensingMinor).toBe(0);
    expect(agreement?.licensingPercent).toBe(0);
    expect(agreement?.isCompleted).toBe(true);
  });

  test('is null unless accepted or completed with an agreed amount', () => {
    expect(
      buildCreatorAgreement(detail({ agreedAmountMinor: 2_000_000 }), campaign(1), 'confirmed'),
    ).toBeNull();
    expect(
      buildCreatorAgreement(
        detail({ status: 'accepted', agreedAmountMinor: null }),
        campaign(1),
        'confirmed',
      ),
    ).toBeNull();
  });

  test('falls back without the campaign', () => {
    const agreement = buildCreatorAgreement(
      detail({ status: 'accepted', agreedAmountMinor: 2_000_000, licensingMarkupMinor: 1_000_000 }),
      null,
      'confirmed',
      'Route title',
    );
    expect(agreement?.campaignTitle).toBe('Route title');
    expect(agreement?.businessName).toBeNull();
    expect(agreement?.businessAvatarUrl).toBeNull();
    expect(agreement?.contentDeadline).toBe('No deadline set');
    expect(agreement?.licensingPercent).toBe(50);
    expect(
      buildCreatorAgreement(
        detail({ status: 'accepted', agreedAmountMinor: 2_000_000, licensingMarkupMinor: 500_000 }),
        null,
        'confirmed',
      )?.licensingPercent,
    ).toBe(25);
  });

  test("titles the campaign 'Campaign' with no campaign or route title", () => {
    expect(
      buildCreatorAgreement(
        detail({ status: 'accepted', agreedAmountMinor: 2_000_000 }),
        null,
        'confirmed',
      )?.campaignTitle,
    ).toBe('Campaign');
  });
});
