export interface CampaignFeedEngagementSummary {
  id: string;
  origin: 'invited' | 'requested';
  status: string;
}

// Mirrors the backend's CampaignFeedListItemDto - the row shape shared by
// both creator-facing campaign feeds (campaign API group CB1, GET
// /feed/campaigns, and CB4, GET /feed/campaigns/recommended). `myEngagement`
// is always `null` on the backend today (creator engagements haven't
// shipped yet) but is typed here so the UI doesn't need to change once it
// does.
export interface CampaignFeedItem {
  id: string;
  title: string;
  type: string;
  status: string;
  coverUrl: string | null;
  avatarUrl: string | null;
  budgetAmountMinor: number | null;
  currency: string;
  licensingTier: 1 | 2 | 3;
  applicationDeadline: string | null;
  contentDeadline: string | null;
  campaignEndDate: string | null;
  publishedAt: string | null;
  businessId: string;
  businessName: string;
  myEngagement: CampaignFeedEngagementSummary | null;
}

export interface CampaignFeedPageArgs {
  page: number;
  limit: number;
}
