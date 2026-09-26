import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/services/baseQuery';
import {
  CampaignFeedDetail,
  CampaignFeedFilteredPageArgs,
  CampaignFeedFilters,
  CampaignFeedItem,
  CampaignFeedPageArgs,
} from '../types/campaignFeed';

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
// Both return the same row shape. CB1 also takes the optional
// CampaignFeedFilters (q, category, platform, city, budget, deadline, sort);
// CB4 takes only page/limit.

// Drops blank search text and an empty category list, so "no filter" sends
// the same request (and hits the same RTK Query cache entry) as omitting it.
function toFeedParams({ q, city, category, ...rest }: CampaignFeedFilteredPageArgs) {
  const trimmedQ = q?.trim();
  const trimmedCity = city?.trim();
  return {
    ...rest,
    ...(trimmedQ ? { q: trimmedQ } : {}),
    ...(trimmedCity ? { city: trimmedCity } : {}),
    ...(category?.length ? { category } : {}),
  };
}

export const campaignFeedApi = createApi({
  reducerPath: 'campaignFeedApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['CampaignFeed'],
  endpoints: builder => ({
    getTopCampaigns: builder.query<CampaignFeedItem[], { limit: number } & CampaignFeedFilters>({
      query: args => ({
        url: CAMPAIGNS_FEED_URL,
        method: 'GET',
        params: toFeedParams({ ...args, page: 1 }),
      }),
      providesTags: ['CampaignFeed'],
    }),
    // One page at a time - scenes/campaigns/hooks/useCampaignsFeed.ts
    // accumulates pages into one flat list itself, since services/http.ts
    // unwraps the response envelope and drops the backend's
    // `meta.hasNextPage` before RTK Query ever sees it.
    getCampaignsFeedPage: builder.query<CampaignFeedItem[], CampaignFeedFilteredPageArgs>({
      query: args => ({
        url: CAMPAIGNS_FEED_URL,
        method: 'GET',
        params: toFeedParams(args),
      }),
      providesTags: ['CampaignFeed'],
    }),
    // Campaign API group CB2 - one live campaign, the creator's view. 404
    // (ApiError code NOT_FOUND) for anything not live or not a uuid.
    getFeedCampaign: builder.query<CampaignFeedDetail, { id: string }>({
      query: ({ id }) => ({
        url: `${CAMPAIGNS_FEED_URL}/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'CampaignFeed', id }],
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
  useGetFeedCampaignQuery,
  useGetTopRecommendedCampaignsQuery,
  useGetRecommendedCampaignsFeedPageQuery,
} = campaignFeedApi;
