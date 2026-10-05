import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { InternalAxiosRequestConfig } from 'axios';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { httpClient } from '@/services/http';
import { campaignFeedApi, CAMPAIGNS_FEED_PAGE_SIZE } from '../api/campaignFeedApi';
import { CampaignFeedFilters, CampaignFeedItem } from '../types/campaignFeed';
import { useCampaignsFeed } from './useCampaignsFeed';

function makeCampaign(id: string): CampaignFeedItem {
  return {
    id,
    title: `Campaign ${id}`,
    type: 'sponsored_post',
    status: 'live',
    coverUrl: null,
    avatarUrl: null,
    budgetAmountMinor: 50000,
    currency: 'BDT',
    licensingTier: 1,
    applicationDeadline: '2026-10-01',
    contentDeadline: null,
    campaignEndDate: null,
    publishedAt: null,
    businessId: 'business-1',
    businessName: 'Bkash',
    myEngagement: null,
  };
}

// Serves `CAMPAIGNS_FEED_PAGE_SIZE` rows for page 1 and 2 rows for page 2,
// with ids prefixed by the `q` param so filtered results are distinguishable.
function feedAdapter(config: InternalAxiosRequestConfig) {
  const { page, q } = config.params as { page: number; q?: string };
  const prefix = q ?? 'all';
  const count = page === 1 ? CAMPAIGNS_FEED_PAGE_SIZE : 2;
  const data = Array.from({ length: count }, (_, i) => makeCampaign(`${prefix}-${page}-${i}`));
  return Promise.resolve({
    data: { success: true, statusCode: 200, message: 'ok', data, meta: null },
    status: 200,
    statusText: '',
    headers: {},
    config,
  });
}

let store: ReturnType<typeof makeStore>;

function makeStore() {
  return configureStore({
    reducer: { [campaignFeedApi.reducerPath]: campaignFeedApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(campaignFeedApi.middleware),
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

beforeEach(() => {
  jest.useFakeTimers();
  store = makeStore();
  httpClient.defaults.adapter = jest.fn(feedAdapter) as any;
});

afterEach(() => {
  store.dispatch(campaignFeedApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('useCampaignsFeed', () => {
  test('loads page 1, then appends page 2 without duplicating page 1', async () => {
    const { result } = renderHook(() => useCampaignsFeed(), { wrapper });

    await waitFor(() => expect(result.current.campaigns).toHaveLength(CAMPAIGNS_FEED_PAGE_SIZE));
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());

    await waitFor(() =>
      expect(result.current.campaigns).toHaveLength(CAMPAIGNS_FEED_PAGE_SIZE + 2),
    );
    expect(result.current.hasMore).toBe(false);
    const ids = result.current.campaigns.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('changing filters starts over from page 1 with only the new results', async () => {
    const { result, rerender } = renderHook(
      ({ filters }: { filters: CampaignFeedFilters }) => useCampaignsFeed(filters),
      { wrapper, initialProps: { filters: {} } },
    );

    await waitFor(() => expect(result.current.campaigns).toHaveLength(CAMPAIGNS_FEED_PAGE_SIZE));
    act(() => result.current.loadMore());
    await waitFor(() =>
      expect(result.current.campaigns).toHaveLength(CAMPAIGNS_FEED_PAGE_SIZE + 2),
    );

    rerender({ filters: { q: 'food' } });

    await waitFor(() => expect(result.current.campaigns[0]?.id).toBe('food-1-0'));
    expect(result.current.campaigns).toHaveLength(CAMPAIGNS_FEED_PAGE_SIZE);
    expect(result.current.campaigns.every(c => c.id.startsWith('food-'))).toBe(true);
  });

  // Records what every render returned, so a one-render gap (rows arrived
  // but not merged yet) can't hide between assertions. A render that is
  // neither loading nor showing rows is the screen's empty state flashing.
  test('never reports "loaded and empty" while the first page is arriving', async () => {
    const renders: { loading: boolean; count: number }[] = [];
    const { result, rerender } = renderHook(
      ({ filters }: { filters: CampaignFeedFilters }) => {
        const feed = useCampaignsFeed(filters);
        renders.push({ loading: feed.isInitialLoading, count: feed.campaigns.length });
        return feed;
      },
      { wrapper, initialProps: { filters: {} } },
    );

    await waitFor(() => expect(result.current.campaigns).toHaveLength(CAMPAIGNS_FEED_PAGE_SIZE));
    // A filter change starts over from page 1 - the same gap applies.
    rerender({ filters: { q: 'food' } });
    await waitFor(() => expect(result.current.campaigns[0]?.id).toBe('food-1-0'));

    expect(renders.filter(r => !r.loading && r.count === 0)).toEqual([]);
  });

  test('an empty feed stops loading so the empty state can show', async () => {
    httpClient.defaults.adapter = jest.fn((config: InternalAxiosRequestConfig) =>
      Promise.resolve({
        data: { success: true, statusCode: 200, message: 'ok', data: [], meta: null },
        status: 200,
        statusText: '',
        headers: {},
        config,
      }),
    ) as any;
    const { result } = renderHook(() => useCampaignsFeed(), { wrapper });

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.campaigns).toEqual([]);
    expect(result.current.isInitialError).toBe(false);
  });
});
