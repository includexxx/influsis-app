import { useCallback, useEffect, useState } from 'react';
import {
  BUSINESSES_PAGE_SIZE,
  useGetBusinessesDirectoryPageQuery,
} from '../api/businessDirectoryApi';
import { BusinessDirectoryItem } from '../types/businessDirectory';

export interface UseBusinessesFeedResult {
  businesses: BusinessDirectoryItem[];
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  isInitialError: boolean;
  isLoadMoreError: boolean;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
}

// Accumulates pages of the business directory (RBAC API §E1) into one flat
// list for the Businesses screen's virtualized grid. Each page is a normal,
// cached RTK Query call; the running list and "is there another page" flag
// are plain local state because services/http.ts unwraps the response
// envelope and drops the backend's `meta.hasNextPage` before RTK Query ever
// sees it - a page shorter than the requested limit is the only signal left
// that it was the last one (same technique as
// scenes/campaigns/hooks/useCampaignsFeed.ts).
export function useBusinessesFeed(): UseBusinessesFeedResult {
  const [page, setPage] = useState(1);
  const [businesses, setBusinesses] = useState<BusinessDirectoryItem[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data, isFetching, isError, refetch } = useGetBusinessesDirectoryPageQuery({
    page,
    limit: BUSINESSES_PAGE_SIZE,
  });

  useEffect(() => {
    if (!data) return;
    setBusinesses(prev => (page === 1 ? data : [...prev, ...data]));
    setHasMore(data.length === BUSINESSES_PAGE_SIZE);
  }, [data, page]);

  const loadMore = useCallback(() => {
    if (isFetching || !hasMore || isError) return;
    setPage(prev => prev + 1);
  }, [isFetching, hasMore, isError]);

  // `data` reaches `businesses` one render after RTK Query delivers it (the
  // merge above runs in an effect), so `isFetching` alone flips to false a
  // render too early - the screen would flash its empty state for a frame.
  // The first page counts as loading until it has been merged, unless it came
  // back empty (then the empty state is the right answer).
  const firstPagePending =
    page === 1 &&
    businesses.length === 0 &&
    !isError &&
    (isFetching || data === undefined || data.length > 0);

  return {
    businesses,
    isInitialLoading: firstPagePending,
    isLoadingMore: isFetching && page > 1,
    isInitialError: isError && businesses.length === 0,
    isLoadMoreError: isError && businesses.length > 0,
    hasMore,
    loadMore,
    retry: refetch,
  };
}
