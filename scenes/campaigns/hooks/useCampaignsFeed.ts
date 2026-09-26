import { useCallback, useEffect, useState } from 'react';
import {
  CAMPAIGNS_FEED_PAGE_SIZE,
  useGetCampaignsFeedPageQuery,
  useGetRecommendedCampaignsFeedPageQuery,
} from '../api/campaignFeedApi';
import { CampaignFeedItem, CampaignFeedPageArgs } from '../types/campaignFeed';

export interface UseCampaignsFeedResult {
  campaigns: CampaignFeedItem[];
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  isInitialError: boolean;
  isLoadMoreError: boolean;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
}

type UseFeedPageQuery = (args: CampaignFeedPageArgs) => {
  data?: CampaignFeedItem[];
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
};

// Accumulates pages of a campaign feed into one flat list for a virtualized
// FlatList. Each page is a normal, cached RTK Query call; the running list
// and "is there another page" flag are plain local state because
// services/http.ts unwraps the response envelope and drops the backend's
// `meta.hasNextPage` before RTK Query ever sees it - a page shorter than the
// requested limit is the only signal left that it was the last one.
function useCampaignFeedPages(useFeedPageQuery: UseFeedPageQuery): UseCampaignsFeedResult {
  const [page, setPage] = useState(1);
  const [campaigns, setCampaigns] = useState<CampaignFeedItem[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data, isFetching, isError, refetch } = useFeedPageQuery({
    page,
    limit: CAMPAIGNS_FEED_PAGE_SIZE,
  });

  useEffect(() => {
    if (!data) return;
    setCampaigns(prev => (page === 1 ? data : [...prev, ...data]));
    setHasMore(data.length === CAMPAIGNS_FEED_PAGE_SIZE);
  }, [data, page]);

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

// The full Campaigns screen - every live campaign with an open application
// deadline (campaign API group CB1, GET /feed/campaigns).
export function useCampaignsFeed(): UseCampaignsFeedResult {
  return useCampaignFeedPages(useGetCampaignsFeedPageQuery);
}

// The full Live Campaigns screen - the creator's recommended feed (campaign
// API group CB4, GET /feed/campaigns/recommended).
export function useRecommendedCampaignsFeed(): UseCampaignsFeedResult {
  return useCampaignFeedPages(useGetRecommendedCampaignsFeedPageQuery);
}
