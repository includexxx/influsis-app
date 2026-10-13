import { CampaignObjective } from './campaignFeed';

// One delivered piece of a Campaign work entry (backend 23c). `livePostUrl`
// is set only for a `live_post` piece; a UGC file link is never returned -
// the files were delivered privately.
export interface PortfolioPiece {
  platform: string;
  type: string;
  title: string | null;
  finalKind: 'file_link' | 'live_post';
  livePostUrl: string | null;
}

// One row of campaign API CK6, GET /me/campaign-portfolio - a completed
// engagement in the creator's own "Campaign work". `hidden` (own view only)
// keeps it off the public profile. `review` is the business's review of the
// creator while visible and not hidden. A gone business reads as "Former
// Influsis member" with `handle`/`avatarUrl` null.
export interface PortfolioEntry {
  engagementId: string;
  completedAt: string;
  hidden: boolean;
  campaign: {
    id: string;
    title: string;
    objective: CampaignObjective | null;
    coverUrl: string | null;
  };
  business: {
    userId: string;
    displayName: string;
    handle: string | null;
    avatarUrl: string | null;
  };
  pieces: PortfolioPiece[];
  review: { rating: number; message: string; submittedAt: string } | null;
}

// Campaign API CK7, PATCH /me/campaign-portfolio/:engagementId.
export interface SetPortfolioHiddenArgs {
  engagementId: string;
  hidden: boolean;
}
