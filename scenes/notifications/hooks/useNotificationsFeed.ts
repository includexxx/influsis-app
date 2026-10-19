import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { notificationsApi, useGetNotificationsPageQuery } from '@/services/notificationsApi';
import { NotificationItem, NotificationsPageArgs } from '@/types';
import { newestCreatedAt } from '../utils/readState';

export const NOTIFICATIONS_PAGE_SIZE = 20;

export type NotificationsFilter = 'all' | 'unread';

export interface UseNotificationsFeedResult {
  items: NotificationItem[];
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  isInitialError: boolean;
  isLoadMoreError: boolean;
  /** The last pull-to-refresh failed; the list on screen is the previous one. */
  isRefreshError: boolean;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
  /** Pull-to-refresh: back to a fresh page 1 with a new anchor. */
  refresh: () => Promise<void>;
}

function pageArgs(
  filter: NotificationsFilter,
  page: number,
  before?: string,
): NotificationsPageArgs {
  return {
    page,
    limit: NOTIFICATIONS_PAGE_SIZE,
    ...(filter === 'unread' ? { unread: true } : {}),
    ...(page > 1 && before ? { before } : {}),
  };
}

// The NT1 feed as one flat list, newest first. Pages accumulate in local
// state, as in useCampaignFeedPages: services/http.ts drops the envelope's
// `meta`, so a short page is the only "last page" signal. Page 1's newest
// `createdAt` is the anchor sent with pages 2+, so new arrivals don't shift
// the pages; items are still deduped by id across pages.
export function useNotificationsFeed(filter: NotificationsFilter): UseNotificationsFeedResult {
  const dispatch = useDispatch<ThunkDispatch<unknown, unknown, UnknownAction>>();
  const [appliedFilter, setAppliedFilter] = useState(filter);
  const [page, setPage] = useState(1);
  const [anchor, setAnchor] = useState<string | undefined>(undefined);
  const [pages, setPages] = useState<NotificationItem[][]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshError, setIsRefreshError] = useState(false);

  if (appliedFilter !== filter) {
    setAppliedFilter(filter);
    setPage(1);
    setAnchor(undefined);
    setPages([]);
    setHasMore(true);
    setIsRefreshError(false);
  }

  const { currentData, isFetching, isError, refetch } = useGetNotificationsPageQuery(
    pageArgs(filter, page, anchor),
    // Refetch a page cached by an earlier visit, unless it is fresher than
    // 30 s - e.g. the page 1 that refresh() has just force-fetched, which
    // would otherwise be requested twice.
    { refetchOnMountOrArgChange: 30 },
  );

  useEffect(() => {
    if (!currentData) return;
    setPages(prev => {
      const next = prev.slice(0, page - 1);
      next[page - 1] = currentData;
      return next;
    });
    if (page === 1) setAnchor(newestCreatedAt(currentData));
    setHasMore(currentData.length === NOTIFICATIONS_PAGE_SIZE);
  }, [currentData, page]);

  const items = useMemo(() => {
    const seen = new Set<string>();
    return pages.flat().filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [pages]);

  const loadMore = useCallback(() => {
    if (isFetching || !hasMore || isError || !anchor) return;
    setPage(prev => prev + 1);
  }, [isFetching, hasMore, isError, anchor]);

  const refresh = useCallback(async () => {
    const request = dispatch(
      notificationsApi.endpoints.getNotificationsPage.initiate(pageArgs(filter, 1), {
        forceRefetch: true,
        subscribe: false,
      }),
    );
    try {
      const first = await request.unwrap();
      setPages([first]);
      setAnchor(newestCreatedAt(first));
      setHasMore(first.length === NOTIFICATIONS_PAGE_SIZE);
      setPage(1);
      setIsRefreshError(false);
    } catch {
      setIsRefreshError(true);
    }
  }, [dispatch, filter]);

  // Same first-page rule as useCampaignFeedPages: loading until page 1 has
  // been merged, unless it came back empty.
  const firstPagePending =
    page === 1 &&
    items.length === 0 &&
    !isError &&
    (isFetching || currentData === undefined || currentData.length > 0);

  return {
    items,
    isInitialLoading: firstPagePending,
    isLoadingMore: isFetching && page > 1,
    isInitialError: isError && items.length === 0,
    isLoadMoreError: isError && items.length > 0,
    isRefreshError,
    hasMore,
    loadMore,
    retry: refetch,
    refresh,
  };
}
