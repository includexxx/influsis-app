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
  currency: string;
  crossedIntentAt: string | null;
  createdAt: string;
  campaign: EngagementCampaignSummary | null;
}

export interface MyEngagementsPageArgs {
  page: number;
  limit: number;
  /** Repeatable; an engagement matching any of them is included. */
  engagementStatus?: EngagementStatus[];
  origin?: EngagementOrigin;
  q?: string;
}
