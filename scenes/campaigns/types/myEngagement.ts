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
export interface EngagementOffer {
  id: string;
  roundNo: number;
  senderType: 'business' | 'creator';
  amountMinor: number;
  currency: string;
  note: string | null;
  status: string;
  createdAt: string;
}

// Campaign API group CF3, GET /me/engagements/:engagementId - only the
// fields this app reads. Accepting an invitation needs the id of the
// business's pending offer, which the CF2 list rows don't carry.
export interface MyEngagementDetail extends Omit<MyEngagementItem, 'campaign'> {
  offers: EngagementOffer[];
}

export interface MyEngagementsPageArgs {
  page: number;
  limit: number;
  /** Repeatable; an engagement matching any of them is included. */
  engagementStatus?: EngagementStatus[];
  origin?: EngagementOrigin;
  q?: string;
}
