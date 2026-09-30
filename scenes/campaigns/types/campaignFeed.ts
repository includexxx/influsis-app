export interface CampaignFeedEngagementSummary {
  id: string;
  origin: 'invited' | 'requested';
  status: string;
}

// Mirrors the backend's CampaignFeedListItemDto - the row shape shared by
// both creator-facing campaign feeds (campaign API group CB1, GET
// /feed/campaigns, and CB4, GET /feed/campaigns/recommended). `myEngagement`
// is this creator's live application/invite for the campaign (pending,
// countered, or accepted), or `null` when there is none.
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

// Mirrors the backend's CAMPAIGN_DELIVERABLE_PLATFORMS.
export type CampaignFeedPlatform = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'ugc';

// Mirrors the backend's CREATOR_FEED_SORT_COLUMNS - a `-` prefix sorts
// descending. The backend defaults to `-publishedAt` (newest first).
export type CampaignFeedSortColumn =
  | 'publishedAt'
  | 'applicationDeadline'
  | 'budgetAmountMinor'
  | 'createdAt';
export type CampaignFeedSort = CampaignFeedSortColumn | `-${CampaignFeedSortColumn}`;

// The optional narrowing params CB1 (GET /feed/campaigns) accepts on top of
// page/limit (backend QueryCampaignFeedDto). CB4 (recommended) takes none of
// these. `budgetMin` > `budgetMax` is rejected with 422 VALIDATION_FAILED
// rather than returning an empty page.
export interface CampaignFeedFilters {
  /** One business's campaigns - its user id (the `:userId` of
   * GET /business-profiles/:userId). */
  businessId?: string;
  /** Searches title, description, and promoting items (case-insensitive). */
  q?: string;
  /** Category keys; a campaign matching any of them is included. */
  category?: string[];
  platform?: CampaignFeedPlatform;
  /** Case-insensitive exact match. */
  city?: string;
  /** Integer minor units (poisha). Excludes campaigns with no budget set. */
  budgetMin?: number;
  /** Integer minor units (poisha). Excludes campaigns with no budget set. */
  budgetMax?: number;
  /** `YYYY-MM-DD` - only campaigns whose application deadline is on or before it. */
  deadlineBefore?: string;
  sort?: CampaignFeedSort;
}

export type CampaignFeedFilteredPageArgs = CampaignFeedPageArgs & CampaignFeedFilters;

export interface CampaignDeliverable {
  id: string;
  platform: CampaignFeedPlatform;
  /** e.g. `video`, `shorts`, `reels`, `story`, `post`, `photo`. */
  type: string;
  count: number;
}

// One brief section. The backend appends read-only sections projected from
// other fields (`deliverables`, `promo-code`, `timing`) after the ones the
// business wrote, and numbers `sortOrder` across all of them.
export interface CampaignRequirementSection {
  id: string;
  sectionKey: string;
  label: string;
  hint: string | null;
  icon: string | null;
  tone: 'business' | 'danger' | 'neutral' | null;
  layout: 'list' | 'tags' | 'links' | 'code';
  sortOrder: number;
  items: string[];
  readOnly: boolean;
}

// Mirrors the backend's CampaignFeedDetailDto - campaign API group CB2,
// GET /feed/campaigns/:id: the creator's full view of one live campaign
// (404 for anything not live). No funnel counters or other creators'
// engagements. Top-level `coverUrl`/`avatarUrl` arrive as absolute URLs;
// `business.avatarUrl` is NOT resolved by the backend and may be a bare
// storage key.
export interface CampaignFeedDetail {
  id: string;
  businessId: string;
  type: string;
  status: string;
  publishedAt: string | null;
  title: string;
  description: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  zipCode: string | null;
  coverUrl: string | null;
  avatarUrl: string | null;
  preferredGender: 'any' | 'male' | 'female' | 'other';
  audienceLocation: string | null;
  budgetAmountMinor: number | null;
  currency: string;
  licensingTier: 1 | 2 | 3;
  appliedPromoCode: string | null;
  applicationDeadline: string | null;
  contentDeadline: string | null;
  campaignEndDate: string | null;
  preferredPostingDates: string | null;
  promoting: string[];
  objectives: string[];
  categories: string[];
  subCategories: string[];
  ageRanges: string[];
  interests: string[];
  requirements: CampaignRequirementSection[];
  deliverables: CampaignDeliverable[];
  business: {
    businessId: string;
    businessName: string;
    avatarUrl: string | null;
    verificationStatus: string;
  };
  myEngagement: CampaignFeedEngagementSummary | null;
  createdAt: string;
  updatedAt: string;
}
