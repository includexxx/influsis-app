import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CAMPAIGNS_FEED_PAGE_SIZE,
  JOINED_ENGAGEMENT_STATUSES,
  PENDING_INVITATION_STATUSES,
  useGetCampaignsFeedPageQuery,
  useGetMyEngagementsPageQuery,
} from '../api/campaignFeedApi';
import { CampaignFeedFilters, CampaignFeedItem, CampaignFeedPageArgs } from '../types/campaignFeed';
import { MyEngagementItem } from '../types/myEngagement';

export interface UseCampaignsFeedResult<T = CampaignFeedItem> {
  campaigns: T[];
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  isInitialError: boolean;
  isLoadMoreError: boolean;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
}

type UseFeedPageQuery<T, F extends object> = (args: CampaignFeedPageArgs & F) => {
  currentData?: T[];
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
};

// Accumulates pages of a campaign feed into one flat list for a virtualized
// FlatList. Each page is a normal, cached RTK Query call; the loaded pages
// and "is there another page" flag are plain local state because
// services/http.ts unwraps the response envelope and drops the backend's
// `meta.hasNextPage` before RTK Query ever sees it - a page shorter than the
// requested limit is the only signal left that it was the last one.
//
// Pages are stored by index (not appended) so a refetch of an already-loaded
// page replaces it instead of duplicating it. `currentData` (not `data`) is
// read because `data` keeps returning the previous args' result while the
// next page or a new filter set loads. Changing `filters` starts over from
// page 1.
function useCampaignFeedPages<T, F extends object>(
  useFeedPageQuery: UseFeedPageQuery<T, F>,
  filters: F,
): UseCampaignsFeedResult<T> {
  const filtersKey = JSON.stringify(filters);
  const [appliedFiltersKey, setAppliedFiltersKey] = useState(filtersKey);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState<T[][]>([]);
  const [hasMore, setHasMore] = useState(true);

  if (appliedFiltersKey !== filtersKey) {
    setAppliedFiltersKey(filtersKey);
    setPage(1);
    setPages([]);
    setHasMore(true);
  }

  const { currentData, isFetching, isError, refetch } = useFeedPageQuery({
    ...filters,
    page,
    limit: CAMPAIGNS_FEED_PAGE_SIZE,
  });

  useEffect(() => {
    if (!currentData) return;
    setPages(prev => {
      const next = prev.slice(0, page - 1);
      next[page - 1] = currentData;
      return next;
    });
    setHasMore(currentData.length === CAMPAIGNS_FEED_PAGE_SIZE);
  }, [currentData, page]);

  const campaigns = useMemo(() => pages.flat(), [pages]);

  const loadMore = useCallback(() => {
    if (isFetching || !hasMore || isError) return;
    setPage(prev => prev + 1);
  }, [isFetching, hasMore, isError]);

  return {
    campaigns,
    isInitialLoading: isFetching && page === 1 && campaigns.length === 0,
    isLoadingMore: isFetching && page > 1,
    isInitialError: isError && campaigns.length === 0,
    isLoadMoreError: isError && campaigns.length > 0,
    hasMore,
    loadMore,
    retry: refetch,
  };
}

const NO_FILTERS = {};
const JOINED_FILTERS = { engagementStatus: JOINED_ENGAGEMENT_STATUSES };
const APPLIED_FILTERS = { origin: 'requested' as const };
const REQUEST_FILTERS = {
  origin: 'invited' as const,
  engagementStatus: PENDING_INVITATION_STATUSES,
};

// The full Campaigns screen - every live campaign with an open application
// deadline (campaign API group CB1, GET /feed/campaigns), optionally narrowed
// by `filters` (search, category, platform, city, budget, deadline, sort).
export function useCampaignsFeed(
  filters: CampaignFeedFilters = NO_FILTERS,
): UseCampaignsFeedResult {
  return useCampaignFeedPages(useGetCampaignsFeedPageQuery, filters);
}

// The full Live Campaigns screen - the logged-in creator's joined campaigns
// (campaign API group CF2, GET /me/engagements?engagementStatus=accepted).
// Each item is an engagement carrying a campaign summary.
export function useJoinedCampaigns(): UseCampaignsFeedResult<MyEngagementItem> {
  return useCampaignFeedPages(useGetMyEngagementsPageQuery, JOINED_FILTERS);
}

// The Applications screen's "Applied" tab - every campaign the logged-in
// creator asked to join, in any status (GET /me/engagements?origin=requested).
export function useMyApplications(): UseCampaignsFeedResult<MyEngagementItem> {
  return useCampaignFeedPages(useGetMyEngagementsPageQuery, APPLIED_FILTERS);
}

// The Applications screen's "Request" tab - business invitations the creator
// hasn't answered yet (GET /me/engagements?origin=invited&engagementStatus=pending).
export function useCampaignRequests(): UseCampaignsFeedResult<MyEngagementItem> {
  return useCampaignFeedPages(useGetMyEngagementsPageQuery, REQUEST_FILTERS);
}
