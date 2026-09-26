import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError, httpClient } from '@/services/http';
import { clearTokens, setTokens } from '@/services/tokenStore';
import { campaignFeedApi } from './campaignFeedApi';
import { CampaignFeedItem } from '../types/campaignFeed';

const campaign: CampaignFeedItem = {
  id: 'campaign-1',
  title: 'Bkash Branding Campaign',
  type: 'sponsored_post',
  status: 'live',
  coverUrl: 'https://cdn.influsis.test/campaign-1/cover.jpg',
  avatarUrl: 'https://cdn.influsis.test/campaign-1/avatar.jpg',
  budgetAmountMinor: 50000,
  currency: 'BDT',
  licensingTier: 1,
  applicationDeadline: '2026-10-01',
  contentDeadline: null,
  campaignEndDate: null,
  publishedAt: '2026-09-01T00:00:00.000Z',
  businessId: 'business-1',
  businessName: 'Bkash Ltd. Company',
  myEngagement: null,
};

function ok(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  const response = { data, status, statusText: '', headers: {}, config };
  if (status >= 200 && status < 300) return Promise.resolve(response);
  return Promise.reject(
    new AxiosError(`status ${status}`, 'ERR_BAD_RESPONSE', config, {}, response),
  );
}

function envelope<T>(data: T) {
  return { success: true, statusCode: 200, message: 'ok', data, meta: null };
}

function errorBody(code: string, statusCode: number) {
  return { success: false, code, statusCode, message: `err ${code}`, errors: null };
}

type Store = ReturnType<typeof configureStore>;
const stores: Store[] = [];

function makeStore() {
  const store = configureStore({
    reducer: { [campaignFeedApi.reducerPath]: campaignFeedApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(campaignFeedApi.middleware),
  });
  stores.push(store as Store);
  return store;
}

async function withToken() {
  await setTokens({
    token: 'access-1',
    refreshToken: 'refresh-1',
    tokenExpires: 2_000_000_000_000,
  });
}

type Adapter = (config: InternalAxiosRequestConfig) => Promise<unknown>;
let adapter: jest.MockedFunction<Adapter>;

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  await clearTokens();
  jest.clearAllMocks();
  adapter = jest.fn<Adapter>();
  httpClient.defaults.adapter = adapter as any;
});

afterEach(() => {
  stores.splice(0).forEach(s => s.dispatch(campaignFeedApi.util.resetApiState()));
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('campaignFeedApi', () => {
  test('getTopCampaigns GETs page 1 of /feed/campaigns with the given limit', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([campaign])));

    const data = await store
      .dispatch(campaignFeedApi.endpoints.getTopCampaigns.initiate({ limit: 3 }))
      .unwrap();

    expect(data).toEqual([campaign]);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/feed/campaigns');
    expect(call.method).toBe('get');
    expect(call.params).toEqual({ page: 1, limit: 3 });
    expect(call.headers.Authorization).toBe('Bearer access-1');
  });

  test('getCampaignsFeedPage GETs the given page/limit of /feed/campaigns', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([campaign])));

    await store
      .dispatch(campaignFeedApi.endpoints.getCampaignsFeedPage.initiate({ page: 2, limit: 10 }))
      .unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/feed/campaigns');
    expect(call.method).toBe('get');
    expect(call.params).toEqual({ page: 2, limit: 10 });
  });

  test('getTopRecommendedCampaigns GETs page 1 of /feed/campaigns/recommended with the given limit', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([campaign])));

    const data = await store
      .dispatch(campaignFeedApi.endpoints.getTopRecommendedCampaigns.initiate({ limit: 3 }))
      .unwrap();

    expect(data).toEqual([campaign]);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/feed/campaigns/recommended');
    expect(call.params).toEqual({ page: 1, limit: 3 });
  });

  test('getRecommendedCampaignsFeedPage GETs the given page/limit of /feed/campaigns/recommended', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([campaign])));

    await store
      .dispatch(
        campaignFeedApi.endpoints.getRecommendedCampaignsFeedPage.initiate({ page: 2, limit: 10 }),
      )
      .unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/feed/campaigns/recommended');
    expect(call.params).toEqual({ page: 2, limit: 10 });
  });

  test('a failed fetch surfaces as a result.error ApiError', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, errorBody('INTERNAL_ERROR', 500), 500));

    const result = await store.dispatch(
      campaignFeedApi.endpoints.getTopCampaigns.initiate({ limit: 3 }),
    );

    expect(result.error).toBeInstanceOf(ApiError);
    expect((result.error as ApiError).code).toBe('INTERNAL_ERROR');
  });
});
