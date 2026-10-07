import { CampaignFeedDetail } from '../types/campaignFeed';
import { MyEngagementDetail, ScopeItem } from '../types/myEngagement';
import { formatCampaignDueDate } from './mapCampaignFeedItem';
import { formatOfferDate } from './negotiation';
import { scopeFromList } from './scope';

// The creator's side of an engagement's agreement - what the Agreement sheet
// shows before Accept (confirm) and afterwards (confirmed). The creator's pay
// is the whole deal: the agreed price plus the licensing markup (F-2/F-6 in
// PAYMENT_ESCROW_BUSINESS_RULES.md, the backend's `creatorReceivesMinor`).
// Platform fee, VAT, processing and the business's total are never part of
// it. Money stays in integer minor units.

const LICENSING_PERCENT: Record<1 | 2 | 3, 0 | 25 | 50> = { 1: 0, 2: 25, 3: 50 };

/** The licensing uplift for a tier: 0, 25 or 50 (percent). */
export function licensingPercent(tier: 1 | 2 | 3): number {
  return LICENSING_PERCENT[tier] ?? 0;
}

/** Same as the backend accept trigger: integer division; tier 2 = 25%, 3 = 50%, else 0. */
export function licensingMarkupMinor(amountMinor: number, tier: 1 | 2 | 3): number {
  return Math.floor((amountMinor * licensingPercent(tier)) / 100);
}

export type AgreementMode = 'confirm' | 'confirmed';

export interface CreatorAgreement {
  mode: AgreementMode;
  /** confirm: the business's pending offer; confirmed: null. */
  offerId: string | null;
  /** null when the campaign (CB2) is unavailable. */
  businessName: string | null;
  businessAvatarUrl: string | null;
  campaignTitle: string;
  scope: ScopeItem[];
  /** Formatted, or 'No deadline set'. */
  contentDeadline: string;
  /** Agreed (or offered) price plus the licensing markup. */
  youReceiveMinor: number;
  /** The markup part, 0 on tier 1. */
  licensingMinor: number;
  licensingPercent: 0 | 25 | 50;
  currency: string;
  acceptedAt: string | null;
  isCompleted: boolean;
}

type AgreementCampaign = Pick<
  CampaignFeedDetail,
  'title' | 'licensingTier' | 'contentDeadline' | 'business'
>;

// After acceptance the markup comes from the server. Without the campaign's
// tier, the ratio tells it apart - the markup was computed from this same
// agreed amount, so it is (up to integer truncation) exactly 25% or 50%.
function percentFromRatio(agreedMinor: number, markupMinor: number): 0 | 25 | 50 {
  if (markupMinor <= 0 || agreedMinor <= 0) return 0;
  return markupMinor / agreedMinor > 0.375 ? 50 : 25;
}

export function buildCreatorAgreement(
  detail: MyEngagementDetail,
  campaign: AgreementCampaign | null,
  mode: AgreementMode,
  fallbackTitle?: string,
): CreatorAgreement | null {
  const shared = {
    mode,
    businessName: campaign?.business?.businessName ?? null,
    businessAvatarUrl: campaign?.business?.avatarUrl ?? null,
    campaignTitle: campaign?.title || fallbackTitle || 'Campaign',
    scope: scopeFromList(detail.scope ?? []),
    contentDeadline: campaign?.contentDeadline
      ? formatCampaignDueDate(campaign.contentDeadline)
      : 'No deadline set',
    currency: detail.currency,
  };

  if (mode === 'confirm') {
    const offer = detail.offers.find(o => o.status === 'pending' && o.senderType === 'business');
    if (!offer || !campaign) return null;
    const licensingMinor = licensingMarkupMinor(offer.amountMinor, campaign.licensingTier);
    return {
      ...shared,
      offerId: offer.id,
      youReceiveMinor: offer.amountMinor + licensingMinor,
      licensingMinor,
      licensingPercent: licensingMinor > 0 ? LICENSING_PERCENT[campaign.licensingTier] : 0,
      currency: offer.currency,
      acceptedAt: null,
      isCompleted: false,
    };
  }

  const isClosedDeal = detail.status === 'accepted' || detail.status === 'completed';
  if (!isClosedDeal || detail.agreedAmountMinor === null) return null;
  const licensingMinor = detail.licensingMarkupMinor ?? 0;
  return {
    ...shared,
    offerId: null,
    youReceiveMinor: detail.agreedAmountMinor + licensingMinor,
    licensingMinor,
    licensingPercent:
      licensingMinor === 0
        ? 0
        : campaign
          ? LICENSING_PERCENT[campaign.licensingTier]
          : percentFromRatio(detail.agreedAmountMinor, licensingMinor),
    acceptedAt: detail.acceptedAt ? formatOfferDate(detail.acceptedAt) : null,
    isCompleted: detail.status === 'completed',
  };
}
