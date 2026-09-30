// Engagement statuses (backend CAMPAIGN_APPLICATION_STATUSES).
export type EngagementStatus =
  | 'pending'
  | 'countered'
  | 'accepted'
  | 'declined'
  | 'withdrawn'
  | 'expired'
  | 'completed'
  | 'cancelled';

export type EngagementOrigin = 'invited' | 'requested';

// The campaign summary each row carries so a list renders without a second
// call. `coverUrl`/`avatarUrl` are NOT resolved by the backend on this
// endpoint - they can be bare storage keys (see utils/media.ts's
// resolveMediaKeyOrUrl). No business name is included.
export interface EngagementCampaignSummary {
  campaignId: string;
  title: string;
  status: string;
  coverUrl: string | null;
  avatarUrl: string | null;
  budgetAmountMinor: number | null;
  currency: string;
  applicationDeadline: string | null;
  contentDeadline: string | null;
}

// One row of campaign API group CF2, GET /me/engagements ("My
// Applications") - the logged-in creator's application or invitation for one
// campaign. `id` is the engagement id; the campaign's id is `campaignId`.
export interface MyEngagementItem {
  id: string;
  campaignId: string;
  creatorId: string;
  origin: EngagementOrigin;
  status: EngagementStatus;
  pitch: string | null;
  proposedAmountMinor: number | null;
  agreedAmountMinor: number | null;
  /** The newest offer in the thread. For an invitation this is the
   * business's opening offer, which never lands on `proposedAmountMinor`. */
  latestOfferAmountMinor: number | null;
  latestOfferNote: string | null;
  currency: string;
  crossedIntentAt: string | null;
  createdAt: string;
  campaign: EngagementCampaignSummary | null;
}

// One round of an engagement's negotiation thread.
// Offer statuses (backend CAMPAIGN_APPLICATION_OFFER_STATUSES). At most one
// offer per engagement is `pending` at a time.
export type EngagementOfferStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'superseded'
  | 'withdrawn'
  | 'expired';

export interface EngagementOffer {
  id: string;
  roundNo: number;
  senderType: 'business' | 'creator';
  amountMinor: number;
  currency: string;
  note: string | null;
  status: EngagementOfferStatus;
  /** Backend 18l - this round replaced the engagement's deliverables list. */
  scopeChanged: boolean;
  createdAt: string;
}

// Backend 18l - one row of an engagement's own deliverables list ("scope"),
// negotiated with the price. Same rules as a campaign deliverable: platform +
// type once per list, count 1-50.
export interface ScopeItem {
  platform: string;
  type: string;
  count: number;
}

export interface EngagementScopeItem extends ScopeItem {
  id: string;
}

// Campaign API group CF3, GET /me/engagements/:engagementId - only the
// fields this app reads. `offers` is the whole negotiation thread; a round is
// one offer, so `negotiationRoundLimit - negotiationRoundCount` is how many
// more offers either side may still send. `nextAction`/`escrowFundingDeadline`
// are computed by the backend once `accepted`.
export interface MyEngagementDetail extends Omit<MyEngagementItem, 'campaign'> {
  offers: EngagementOffer[];
  /** Backend 18l - the engagement's current negotiated deliverables list. */
  scope: EngagementScopeItem[];
  negotiationRoundLimit: number;
  negotiationRoundCount: number;
  /** The business's licensing-tier cost on top of the agreed price. */
  licensingMarkupMinor: number | null;
  acceptedAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  nextAction: 'fund_escrow' | null;
  escrowFundingDeadline: string | null;
}

// Campaign API group CG2, POST /engagements/:id/offers. `senderType` is
// derived by the backend from who is calling, never sent.
export interface CounterOfferArgs {
  engagementId: string;
  /** Positive integer, minor units. */
  amountMinor: number;
  /** Up to 2000 characters. */
  note?: string;
  /** Backend 18l - replaces the whole deliverables list; omit to keep it. */
  scope?: ScopeItem[];
}

// CF5 decline / CF6 withdraw. `reason` is required by the backend but may be
// empty.
export interface CloseEngagementArgs {
  engagementId: string;
  reason?: string;
}

export interface MyEngagementsPageArgs {
  page: number;
  limit: number;
  /** Repeatable; an engagement matching any of them is included. */
  engagementStatus?: EngagementStatus[];
  origin?: EngagementOrigin;
  q?: string;
}

// Where an application came from (backend CAMPAIGN_APPLICATION_SOURCES).
export type EngagementSource =
  | 'suggestion'
  | 'search'
  | 'saved_list'
  | 'profile'
  | 'feed'
  | 'direct_link'
  | 'gig';

// Campaign API group CF1, POST /feed/campaigns/:id/apply.
export interface ApplyToCampaignArgs {
  campaignId: string;
  /** 1-2000 characters. */
  pitch: string;
  /** The creator's asking rate, a positive integer in minor units. */
  proposedAmountMinor: number;
  /** Up to 10 URLs. Validated by the backend, then discarded - not stored. */
  portfolioUrls?: string[];
  /** Backend default: `direct_link`. */
  source?: EngagementSource;
  /** Backend 18l - the deliverables the creator proposes; omit to accept the campaign's. */
  scope?: ScopeItem[];
}
