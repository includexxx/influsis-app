import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/services/baseQuery';
import { CampaignFeedItem, CampaignFeedPageArgs } from '../types/campaignFeed';

// Shared by every "3 on Home, all on its own screen" campaign list: Home's
// "Campaigns" and "Active Campaigns" previews (CampaignsListSection,
// ActiveCampaignsSection).
export const CAMPAIGNS_PREVIEW_LIMIT = 3;
// Page size for the full virtualized lists (Campaigns, LiveCampaign).
export const CAMPAIGNS_FEED_PAGE_SIZE = 10;

const CAMPAIGNS_FEED_URL = '/feed/campaigns';
const RECOMMENDED_FEED_URL = '/feed/campaigns/recommended';

// Backs every screen that reads a creator campaign feed:
// - campaign API group CB1 (GET /feed/campaigns) - every live campaign with
//   an open application deadline. Home's "Campaigns" preview
//   (CampaignsListSection) and the full Campaigns screen.
// - campaign API group CB4 (GET /feed/campaigns/recommended) - live
//   campaigns ranked by category overlap with the creator's profile. Home's
//   "Active Campaigns" preview (ActiveCampaignsSection) and the full Live
//   Campaigns screen.
// Both return the same row shape and take only page/limit here - neither
// preview/full-list pair needs CB1's extra filters (q, category, platform,
// city, budget, deadline, sort) yet.
export const campaignFeedApi = createApi({
  reducerPath: 'campaignFeedApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['CampaignFeed'],
  endpoints: builder => ({
    getTopCampaigns: builder.query<CampaignFeedItem[], { limit: number }>({
      query: ({ limit }) => ({
        url: CAMPAIGNS_FEED_URL,
        method: 'GET',
        params: { page: 1, limit },
      }),
      providesTags: ['CampaignFeed'],
    }),
    // One page at a time - scenes/campaigns/hooks/useCampaignsFeed.ts
    // accumulates pages into one flat list itself, since services/http.ts
    // unwraps the response envelope and drops the backend's
    // `meta.hasNextPage` before RTK Query ever sees it.
    getCampaignsFeedPage: builder.query<CampaignFeedItem[], CampaignFeedPageArgs>({
      query: ({ page, limit }) => ({
        url: CAMPAIGNS_FEED_URL,
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['CampaignFeed'],
    }),
    getTopRecommendedCampaigns: builder.query<CampaignFeedItem[], { limit: number }>({
      query: ({ limit }) => ({
        url: RECOMMENDED_FEED_URL,
        method: 'GET',
        params: { page: 1, limit },
      }),
      providesTags: ['CampaignFeed'],
    }),
    getRecommendedCampaignsFeedPage: builder.query<CampaignFeedItem[], CampaignFeedPageArgs>({
      query: ({ page, limit }) => ({
        url: RECOMMENDED_FEED_URL,
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['CampaignFeed'],
    }),
  }),
});

export const {
  useGetTopCampaignsQuery,
  useGetCampaignsFeedPageQuery,
  useGetTopRecommendedCampaignsQuery,
  useGetRecommendedCampaignsFeedPageQuery,
} = campaignFeedApi;
