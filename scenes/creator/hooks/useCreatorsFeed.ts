import { useCallback, useEffect, useState } from 'react';
import { CREATORS_PAGE_SIZE, useGetCreatorsDirectoryPageQuery } from '../api/creatorDirectoryApi';
import { CreatorDirectoryItem } from '../types/creatorDirectory';

export interface UseCreatorsFeedResult {
  creators: CreatorDirectoryItem[];
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  isInitialError: boolean;
  isLoadMoreError: boolean;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
}

// Accumulates pages of the creator directory (RBAC API §E3) into one flat
// list for the Top Creators screen's virtualized list. Each page is a
// normal, cached RTK Query call; the running list and "is there another
// page" flag are plain local state because services/http.ts unwraps the
// response envelope and drops the backend's `meta.hasNextPage` before RTK
// Query ever sees it - a page shorter than the requested limit is the only
// signal left that it was the last one (same technique as
// scenes/campaigns/hooks/useCampaignsFeed.ts and
// scenes/business/hooks/useBusinessesFeed.ts).
export function useCreatorsFeed(): UseCreatorsFeedResult {
  const [page, setPage] = useState(1);
  const [creators, setCreators] = useState<CreatorDirectoryItem[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data, isFetching, isError, refetch } = useGetCreatorsDirectoryPageQuery({
    page,
    limit: CREATORS_PAGE_SIZE,
  });

  useEffect(() => {
    if (!data) return;
    setCreators(prev => (page === 1 ? data : [...prev, ...data]));
    setHasMore(data.length === CREATORS_PAGE_SIZE);
  }, [data, page]);

  const loadMore = useCallback(() => {
    if (isFetching || !hasMore || isError) return;
    setPage(prev => prev + 1);
  }, [isFetching, hasMore, isError]);

  return {
    creators,
    isInitialLoading: isFetching && page === 1 && creators.length === 0,
    isLoadingMore: isFetching && page > 1,
    isInitialError: isError && creators.length === 0,
    isLoadMoreError: isError && creators.length > 0,
    hasMore,
    loadMore,
    retry: refetch,
  };
}
