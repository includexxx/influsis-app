import { BaseQueryFn, createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BaseQueryArgs } from '@/services/baseQuery';
import { ApiError } from '@/services/http';
import {
  CampaignFeedDetail,
  CampaignFeedFilteredPageArgs,
  CampaignFeedFilters,
  CampaignFeedItem,
  CampaignFeedPageArgs,
} from '../types/campaignFeed';
import { DeliverablePiece } from '../types/deliverables';
import { DeliveryRound, EngagementDelivery, SubmitRoundArgs } from '../types/delivery';
import {
  ApplyToCampaignArgs,
  CloseEngagementArgs,
  CounterOfferArgs,
  EngagementStatus,
  MyEngagementDetail,
  MyEngagementItem,
  MyEngagementsPageArgs,
} from '../types/myEngagement';
import {
  EngagementReview,
  EngagementReviewState,
  PendingReview,
  SubmitReviewArgs,
} from '../types/review';
import { PortfolioEntry, SetPortfolioHiddenArgs } from '../types/portfolio';

// Shared by every "3 on Home, all on its own screen" campaign list: Home's
// "Campaigns" and "Active Campaigns" previews (CampaignsListSection,
// ActiveCampaignsSection).
export const CAMPAIGNS_PREVIEW_LIMIT = 3;
// Page size for the full virtualized lists (Campaigns, LiveCampaign).
export const CAMPAIGNS_FEED_PAGE_SIZE = 10;

const CAMPAIGNS_FEED_URL = '/feed/campaigns';
const RECOMMENDED_FEED_URL = '/feed/campaigns/recommended';
const MY_ENGAGEMENTS_URL = '/me/engagements';
const ENGAGEMENTS_URL = '/engagements';
const MY_PENDING_REVIEWS_URL = '/me/reviews/pending';
const MY_CAMPAIGN_PORTFOLIO_URL = '/me/campaign-portfolio';

// "Joined" = the business and creator agreed terms and the work is on
// (engagement status `accepted`). Pending applications, invitations, and
// finished (`completed`) work are deliberately excluded.
export const JOINED_ENGAGEMENT_STATUSES: EngagementStatus[] = ['accepted'];
// The Applications screen's "Request" tab - invitations from a business the
// creator hasn't accepted or declined yet: still `pending`, or `countered`
// (mid-negotiation), so a negotiation in progress stays reachable.
export const PENDING_INVITATION_STATUSES: EngagementStatus[] = ['pending', 'countered'];
// Finished work - the business approved the final delivery (or it was
// auto-approved after 72 hours). The Applications screen's "Completed
// Campaigns" tab, Home's "Total earned", and the "can't apply again" check.
export const COMPLETED_ENGAGEMENT_STATUSES: EngagementStatus[] = ['completed'];

// The backend's PaginationQueryDto caps `limit` at 50.
const MAX_PAGE_SIZE = 50;
// Stops a runaway loop if the backend ever ignores `page`.
const MAX_COMPLETED_PAGES = 20;

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
  tagTypes: [
    'CampaignFeed',
    'MyEngagements',
    'MyEngagement',
    'Deliverables',
    'Delivery',
    'EngagementReviews',
    'PendingReviews',
    'CampaignPortfolio',
  ],
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
        const result = await fetchAllCompletedEngagements(baseQuery);
        if (result.error) return result;

        let totalMinor = 0;
        let currency: string | null = null;
        for (const row of result.data) {
          totalMinor += row.agreedAmountMinor ?? 0;
          currency ??= row.currency;
        }
        return {
          data: { totalMinor, currency: currency ?? 'BDT', completedCount: result.data.length },
        };
      },
      providesTags: ['MyEngagements'],
    }),
    // The ids of every campaign the creator has finished. The backend lets a
    // creator apply again once an engagement is `completed`, and the feed's
    // `myEngagement` never reports one (it carries only pending/countered/
    // accepted), so this list is what marks those campaigns "Completed" and
    // keeps Apply closed on them.
    getMyCompletedCampaignIds: builder.query<string[], void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const result = await fetchAllCompletedEngagements(baseQuery);
        if (result.error) return result;
        return { data: [...new Set(result.data.map(row => row.campaignId))] };
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
    declineMyEngagement: builder.mutation<MyEngagementDetail, CloseEngagementArgs>({
      query: ({ engagementId, reason = '' }) => ({
        url: `${MY_ENGAGEMENTS_URL}/${encodeURIComponent(engagementId)}/decline`,
        method: 'POST',
        data: { reason },
      }),
      invalidatesTags: (_result, error, { engagementId }) => engagementTags(error, engagementId),
    }),
    // Campaign API group CF3 - one engagement with its whole negotiation
    // thread; backs the Offer screen.
    getMyEngagement: builder.query<MyEngagementDetail, { engagementId: string }>({
      query: ({ engagementId }) => ({
        url: `${MY_ENGAGEMENTS_URL}/${encodeURIComponent(engagementId)}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { engagementId }) => [
        { type: 'MyEngagement', id: engagementId },
      ],
    }),
    // Campaign API group CF4 with an explicit offer id - the Offer screen
    // already holds the thread, so it accepts exactly the offer it showed. A
    // stale id (the business countered meanwhile) is a 409 OFFER_NOT_PENDING.
    acceptOffer: builder.mutation<MyEngagementDetail, { engagementId: string; offerId: string }>({
      query: ({ engagementId, offerId }) => ({
        url: `${MY_ENGAGEMENTS_URL}/${encodeURIComponent(engagementId)}/accept`,
        method: 'POST',
        data: { offerId },
      }),
      invalidatesTags: (_result, error, { engagementId }) => engagementTags(error, engagementId),
    }),
    // Campaign API group CG2 - counter-offer. The response envelope's
    // `meta.roundsRemaining` is dropped by services/http.ts; the engagement
    // itself carries both round counters.
    sendCounterOffer: builder.mutation<MyEngagementDetail, CounterOfferArgs>({
      // Backend 18l - `scope` (the deliverables list) rides along only when
      // the creator changed it; omitted, the engagement keeps its list.
      query: ({ engagementId, amountMinor, note, scope }) => ({
        url: `${ENGAGEMENTS_URL}/${encodeURIComponent(engagementId)}/offers`,
        method: 'POST',
        data: { amountMinor, ...(note ? { note } : {}), ...(scope ? { scope } : {}) },
      }),
      invalidatesTags: (_result, error, { engagementId }) => engagementTags(error, engagementId),
    }),
    // Campaign API group CG3 - withdraws the creator's own un-answered offer.
    withdrawOffer: builder.mutation<MyEngagementDetail, { engagementId: string; offerId: string }>({
      query: ({ engagementId, offerId }) => ({
        url: `${ENGAGEMENTS_URL}/${encodeURIComponent(engagementId)}/offers/${encodeURIComponent(offerId)}/withdraw`,
        method: 'POST',
      }),
      invalidatesTags: (_result, error, { engagementId }) => engagementTags(error, engagementId),
    }),
    // Campaign API group CF6 - the creator withdraws their own application.
    withdrawMyEngagement: builder.mutation<MyEngagementDetail, CloseEngagementArgs>({
      query: ({ engagementId, reason = '' }) => ({
        url: `${MY_ENGAGEMENTS_URL}/${encodeURIComponent(engagementId)}/withdraw`,
        method: 'POST',
        data: { reason },
      }),
      invalidatesTags: (_result, error, { engagementId }) => engagementTags(error, engagementId),
    }),
    // Campaign API group CI1 - the accepted engagement's pieces and each
    // piece's submission history, read-only (the piece screen). Content is
    // submitted as delivery rounds below.
    getEngagementDeliverables: builder.query<DeliverablePiece[], { engagementId: string }>({
      query: ({ engagementId }) => ({
        url: `${ENGAGEMENTS_URL}/${encodeURIComponent(engagementId)}/deliverables`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { engagementId }) => [
        { type: 'Deliverables', id: engagementId },
      ],
    }),
    // Delivery rounds (backend 18r1-18r3) - the engagement's stage, revision
    // budgets, escalation, pieces and every round. Either party may read it;
    // anyone else gets 404.
    getEngagementDelivery: builder.query<EngagementDelivery, { engagementId: string }>({
      query: ({ engagementId }) => ({
        url: `${ENGAGEMENTS_URL}/${encodeURIComponent(engagementId)}/delivery`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { engagementId }) => [{ type: 'Delivery', id: engagementId }],
    }),
    // One round with an item per non-cancelled piece (JSON - images are
    // uploaded first with POST /media and sent as `mediaId`). The backend
    // picks the phase from the stage. The response `meta` (new stage and
    // budgets) is dropped by request(), so the refetch the tags trigger is
    // what updates the screens. 409 while in review, completed or escalated;
    // 422 keyed `items[i]...`.
    submitDeliveryRound: builder.mutation<DeliveryRound, SubmitRoundArgs>({
      query: ({ engagementId, items }) => ({
        url: `${ENGAGEMENTS_URL}/${encodeURIComponent(engagementId)}/delivery/rounds`,
        method: 'POST',
        data: { items },
      }),
      invalidatesTags: (_result, error, { engagementId }) =>
        error
          ? []
          : [
              { type: 'Delivery' as const, id: engagementId },
              { type: 'Deliverables' as const, id: engagementId },
              { type: 'MyEngagement' as const, id: engagementId },
            ],
    }),
    // Campaign API CK1 (backend 23a) - both sides' reviews of one engagement
    // under the blind reveal. Any engagement status; not a party -> 404.
    getEngagementReviews: builder.query<EngagementReviewState, { engagementId: string }>({
      query: ({ engagementId }) => ({
        url: `${ENGAGEMENTS_URL}/${encodeURIComponent(engagementId)}/reviews`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { engagementId }) => [
        { type: 'EngagementReviews', id: engagementId },
      ],
    }),
    // Campaign API CK2 - the creator reviews the business, once. The
    // response's `meta.revealed` is dropped by request(); the CK1 refetch
    // the tags trigger returns `theirs` when both sides have now reviewed.
    // 409 CONFLICT before completion, 409 ALREADY_EXISTS on a repeat (no
    // idempotency key) - the screen refetches CK1 for both.
    submitEngagementReview: builder.mutation<EngagementReview, SubmitReviewArgs>({
      query: ({ engagementId, rating, message }) => ({
        url: `${ENGAGEMENTS_URL}/${encodeURIComponent(engagementId)}/reviews`,
        method: 'POST',
        data: { rating, message },
      }),
      invalidatesTags: (_result, error, { engagementId }) =>
        error
          ? []
          : [
              { type: 'EngagementReviews' as const, id: engagementId },
              { type: 'MyEngagement' as const, id: engagementId },
              'PendingReviews' as const,
            ],
    }),
    // Campaign API CK8 (backend 23b) - completed engagements the creator
    // hasn't reviewed yet, newest first. Home's "Reviews to write".
    getPendingReviews: builder.query<PendingReview[], { page: number; limit: number }>({
      query: ({ page, limit }) => ({
        url: MY_PENDING_REVIEWS_URL,
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['PendingReviews'],
    }),
    // Campaign API CK6 (backend 23c) - the creator's own "Campaign work",
    // hidden entries included, newest first. One page at a time (the paging
    // hook accumulates them). Not affected by discoverability.
    getMyCampaignPortfolioPage: builder.query<PortfolioEntry[], CampaignFeedPageArgs>({
      query: ({ page, limit }) => ({
        url: MY_CAMPAIGN_PORTFOLIO_URL,
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['CampaignPortfolio'],
    }),
    // Campaign API CK7 - hide or show one entry on the public profile.
    // Optimistic: every cached CK6 page holding the entry flips at once and
    // flips back if the request fails (404 not this creator's, 409 not
    // completed). The server's echo matches, so nothing is refetched.
    setPortfolioEntryHidden: builder.mutation<PortfolioEntry, SetPortfolioHiddenArgs>({
      query: ({ engagementId, hidden }) => ({
        url: `${MY_CAMPAIGN_PORTFOLIO_URL}/${encodeURIComponent(engagementId)}`,
        method: 'PATCH',
        data: { hidden },
      }),
      async onQueryStarted({ engagementId, hidden }, { dispatch, getState, queryFulfilled }) {
        const patches = campaignFeedApi.util
          .selectInvalidatedBy(getState(), ['CampaignPortfolio'])
          .filter(({ endpointName }) => endpointName === 'getMyCampaignPortfolioPage')
          .map(({ originalArgs }) =>
            dispatch(
              campaignFeedApi.util.updateQueryData(
                'getMyCampaignPortfolioPage',
                originalArgs as CampaignFeedPageArgs,
                entries => {
                  const entry = entries.find(item => item.engagementId === engagementId);
                  if (entry) entry.hidden = hidden;
                },
              ),
            ),
          );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach(patch => patch.undo());
        }
      },
    }),
  }),
});

// Every completed engagement of the logged-in creator (GET /me/engagements?
// engagementStatus=completed), paged at the backend's 50-row maximum.
async function fetchAllCompletedEngagements(
  baseQuery: (args: BaseQueryArgs) => ReturnType<BaseQueryFn<BaseQueryArgs, unknown, ApiError>>,
): Promise<{ data: MyEngagementItem[]; error?: never } | { error: ApiError; data?: never }> {
  const rows: MyEngagementItem[] = [];
  for (let page = 1; page <= MAX_COMPLETED_PAGES; page++) {
    const result = await baseQuery({
      url: MY_ENGAGEMENTS_URL,
      method: 'GET',
      params: { page, limit: MAX_PAGE_SIZE, engagementStatus: COMPLETED_ENGAGEMENT_STATUSES },
    });
    if (result.error) return { error: result.error as ApiError };

    const pageRows = result.data as MyEngagementItem[];
    rows.push(...pageRows);
    if (pageRows.length < MAX_PAGE_SIZE) break;
  }
  return { data: rows };
}

// Every negotiation mutation changes the engagement, its row in the CF2
// lists, and the feed's "Applied" badge. Nothing is invalidated on error - the
// Offer screen refetches explicitly after a 409.
function engagementTags(error: unknown, engagementId: string) {
  return error
    ? []
    : [
        { type: 'MyEngagement' as const, id: engagementId },
        'MyEngagements' as const,
        'CampaignFeed' as const,
      ];
}

export const {
  useGetTopCampaignsQuery,
  useGetCampaignsFeedPageQuery,
  useGetFeedCampaignQuery,
  useGetTopRecommendedCampaignsQuery,
  useGetRecommendedCampaignsFeedPageQuery,
  useGetTopJoinedCampaignsQuery,
  useGetMyEngagementsPageQuery,
  useGetCreatorEarningsQuery,
  useGetMyCompletedCampaignIdsQuery,
  useApplyToCampaignMutation,
  useAcceptMyEngagementMutation,
  useDeclineMyEngagementMutation,
  useGetMyEngagementQuery,
  useAcceptOfferMutation,
  useSendCounterOfferMutation,
  useWithdrawOfferMutation,
  useWithdrawMyEngagementMutation,
  useGetEngagementDeliverablesQuery,
  useGetEngagementDeliveryQuery,
  useSubmitDeliveryRoundMutation,
  useGetEngagementReviewsQuery,
  useSubmitEngagementReviewMutation,
  useGetPendingReviewsQuery,
  useGetMyCampaignPortfolioPageQuery,
  useSetPortfolioEntryHiddenMutation,
} = campaignFeedApi;
