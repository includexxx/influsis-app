import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/services/baseQuery';
import { ApiError } from '@/services/http';
import {
  CampaignFeedDetail,
  CampaignFeedFilteredPageArgs,
  CampaignFeedFilters,
  CampaignFeedItem,
  CampaignFeedPageArgs,
} from '../types/campaignFeed';
import {
  ApplyToCampaignArgs,
  EngagementStatus,
  MyEngagementDetail,
  MyEngagementItem,
  MyEngagementsPageArgs,
} from '../types/myEngagement';

// Shared by every "3 on Home, all on its own screen" campaign list: Home's
// "Campaigns" and "Active Campaigns" previews (CampaignsListSection,
// ActiveCampaignsSection).
export const CAMPAIGNS_PREVIEW_LIMIT = 3;
// Page size for the full virtualized lists (Campaigns, LiveCampaign).
export const CAMPAIGNS_FEED_PAGE_SIZE = 10;

const CAMPAIGNS_FEED_URL = '/feed/campaigns';
const RECOMMENDED_FEED_URL = '/feed/campaigns/recommended';
const MY_ENGAGEMENTS_URL = '/me/engagements';

// "Joined" = the business and creator agreed terms and the work is on
// (engagement status `accepted`). Pending applications, invitations, and
// finished (`completed`) work are deliberately excluded.
export const JOINED_ENGAGEMENT_STATUSES: EngagementStatus[] = ['accepted'];
// The Applications screen's "Request" tab - invitations from a business the
// creator hasn't answered yet.
export const PENDING_INVITATION_STATUSES: EngagementStatus[] = ['pending'];

// The backend's PaginationQueryDto caps `limit` at 50.
const MAX_PAGE_SIZE = 50;
// Stops a runaway loop if the backend ever ignores `page`.
const MAX_EARNINGS_PAGES = 20;

export interface CreatorEarnings {
  /** Sum of `agreedAmountMinor` across completed engagements (minor units). */
  totalMinor: number;
  currency: string;
  completedCount: number;
}

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
  tagTypes: ['CampaignFeed', 'MyEngagements'],
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
    // Campaign API group CF2 (GET /me/engagements) filtered to joined
    // campaigns - Home's "Active Campaigns" preview and the full Live
    // Campaigns screen.
    getTopJoinedCampaigns: builder.query<MyEngagementItem[], { limit: number }>({
      query: ({ limit }) => ({
        url: MY_ENGAGEMENTS_URL,
        method: 'GET',
        params: { page: 1, limit, engagementStatus: JOINED_ENGAGEMENT_STATUSES },
      }),
      providesTags: ['MyEngagements'],
    }),
    // What the Home earnings card shows as "Total earned". There's no
    // earnings/wallet endpoint yet, so this adds up the agreed fee of every
    // completed engagement (GET /me/engagements?engagementStatus=completed),
    // paging through all of them. It reflects work finished, not money paid
    // out. Assumes one currency (the first row's; BDT when there are none).
    getCreatorEarnings: builder.query<CreatorEarnings, void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        let totalMinor = 0;
        let completedCount = 0;
        let currency: string | null = null;

        for (let page = 1; page <= MAX_EARNINGS_PAGES; page++) {
          const result = await baseQuery({
            url: MY_ENGAGEMENTS_URL,
            method: 'GET',
            params: { page, limit: MAX_PAGE_SIZE, engagementStatus: ['completed'] },
          });
          if (result.error) return { error: result.error as ApiError };

          const rows = result.data as MyEngagementItem[];
          for (const row of rows) {
            totalMinor += row.agreedAmountMinor ?? 0;
            currency ??= row.currency;
          }
          completedCount += rows.length;
          if (rows.length < MAX_PAGE_SIZE) break;
        }

        return { data: { totalMinor, currency: currency ?? 'BDT', completedCount } };
      },
      providesTags: ['MyEngagements'],
    }),
    getMyEngagementsPage: builder.query<MyEngagementItem[], MyEngagementsPageArgs>({
      query: args => ({
        url: MY_ENGAGEMENTS_URL,
        method: 'GET',
        params: args,
      }),
      providesTags: ['MyEngagements'],
    }),
    // Campaign API group CF1 - the creator asks to join a live campaign.
    // 201 for a new application; 200 when it merged with a business
    // invitation that landed at the same time, or repeated an earlier
    // submit (services/http.ts drops the `meta.createdNew` that tells them
    // apart). Invalidates the feed so the campaign's "Applied" badge shows.
    applyToCampaign: builder.mutation<MyEngagementDetail, ApplyToCampaignArgs>({
      query: ({ campaignId, ...body }) => ({
        url: `${CAMPAIGNS_FEED_URL}/${encodeURIComponent(campaignId)}/apply`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['MyEngagements', 'CampaignFeed'],
    }),
    // Campaign API group CF4 - accepts a business invitation. CF4 needs the
    // id of the business's pending offer, which list rows don't carry, so
    // this reads the engagement (CF3) first to find it.
    acceptMyEngagement: builder.mutation<MyEngagementDetail, { engagementId: string }>({
      async queryFn({ engagementId }, _api, _extraOptions, baseQuery) {
        const url = `${MY_ENGAGEMENTS_URL}/${encodeURIComponent(engagementId)}`;
        const detail = await baseQuery({ url, method: 'GET' });
        if (detail.error) return { error: detail.error as ApiError };

        const offer = (detail.data as MyEngagementDetail).offers.find(
          item => item.senderType === 'business' && item.status === 'pending',
        );
        if (!offer) {
          return {
            error: new ApiError({
              code: 'OFFER_NOT_PENDING',
              statusCode: 409,
              message: 'This invitation no longer has an offer to accept.',
            }),
          };
        }

        const result = await baseQuery({
          url: `${url}/accept`,
          method: 'POST',
          data: { offerId: offer.id },
        });
        if (result.error) return { error: result.error as ApiError };
        return { data: result.data as MyEngagementDetail };
      },
      invalidatesTags: ['MyEngagements', 'CampaignFeed'],
    }),
    // Campaign API group CF5 - declines a business invitation. `reason` is
    // required by the backend but may be empty.
    declineMyEngagement: builder.mutation<
      MyEngagementDetail,
      { engagementId: string; reason?: string }
    >({
      query: ({ engagementId, reason = '' }) => ({
        url: `${MY_ENGAGEMENTS_URL}/${encodeURIComponent(engagementId)}/decline`,
        method: 'POST',
        data: { reason },
      }),
      invalidatesTags: ['MyEngagements', 'CampaignFeed'],
    }),
  }),
});

export const {
  useGetTopCampaignsQuery,
  useGetCampaignsFeedPageQuery,
  useGetFeedCampaignQuery,
  useGetTopRecommendedCampaignsQuery,
  useGetRecommendedCampaignsFeedPageQuery,
  useGetTopJoinedCampaignsQuery,
  useGetMyEngagementsPageQuery,
  useGetCreatorEarningsQuery,
  useApplyToCampaignMutation,
  useAcceptMyEngagementMutation,
  useDeclineMyEngagementMutation,
} = campaignFeedApi;
