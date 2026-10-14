import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { InternalAxiosRequestConfig } from 'axios';
import { AuthAccount } from '@/types';
import authReducer, { sessionEstablished } from '@/slices/auth.slice';
import { campaignFeedApi } from '@/scenes/campaigns/api/campaignFeedApi';
import { businessDirectoryApi } from '@/scenes/business/api/businessDirectoryApi';
import { creatorDirectoryApi } from '@/scenes/creator/api/creatorDirectoryApi';
import { authApi } from './authApi';
import { profilesApi } from './profilesApi';
import { httpClient } from './http';
import { clearTokens, setTokens } from './tokenStore';
import cacheSync from './cacheSync';

const account = {
  id: 'u-1',
  email: 'c@influsis.test',
  handle: 'old',
  isOnboardingComplete: true,
} as AuthAccount;

const apis = [authApi, profilesApi, campaignFeedApi, businessDirectoryApi, creatorDirectoryApi];

function envelope<T>(data: T) {
  return { success: true, statusCode: 200, message: 'ok', data, meta: null };
}

type Adapter = (config: InternalAxiosRequestConfig) => Promise<unknown>;
let adapter: jest.MockedFunction<Adapter>;

// Every request answers 200 with `bodies[url]` (or `{}`); `calls(url)` counts
// how many times a URL was hit.
let bodies: Record<string, unknown>;
function calls(url: string) {
  return adapter.mock.calls.filter(([config]) => config.url === url).length;
}

type Store = ReturnType<typeof makeStore>;
const stores: Store[] = [];

function makeStore() {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      ...Object.fromEntries(apis.map(api => [api.reducerPath, api.reducer])),
    },
    middleware: gDM =>
      gDM({ serializableCheck: false })
        .prepend(cacheSync.middleware)
        .concat(apis.map(api => api.middleware)),
  });
  stores.push(store);
  store.dispatch(sessionEstablished(account));
  return store;
}

async function settle() {
  for (let i = 0; i < 5; i++) await jest.advanceTimersByTimeAsync(10);
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  await setTokens({
    token: 'access-1',
    refreshToken: 'refresh-1',
    tokenExpires: 2_000_000_000_000,
  });
  bodies = {};
  adapter = jest.fn<Adapter>(config =>
    Promise.resolve({
      data: envelope(bodies[config.url ?? ''] ?? {}),
      status: 200,
      statusText: '',
      headers: {},
      config,
    }),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpClient.defaults.adapter = adapter as any;
});

afterEach(async () => {
  stores.splice(0).forEach(s => apis.forEach(api => s.dispatch(api.util.resetApiState())));
  await clearTokens();
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('cacheSync', () => {
  test('a profile edit refetches /auth/me into auth.account and the own public profile', async () => {
    const store = makeStore();
    const sub = store.dispatch(
      creatorDirectoryApi.endpoints.getCreatorProfile.initiate({ userId: 'u-1' }),
    );
    await settle();
    expect(calls('/creator-profiles/u-1')).toBe(1);

    bodies['/auth/me'] = { ...account, handle: 'new' };
    await store.dispatch(profilesApi.endpoints.updateMyProfile.initiate({ handle: 'new' }));
    await settle();

    expect(calls('/auth/me')).toBe(1);
    expect(store.getState().auth.account?.handle).toBe('new');
    expect(calls('/creator-profiles/u-1')).toBe(2);
    sub.unsubscribe();
  });

  test('reviewing a business refetches business profiles and the own received reviews', async () => {
    const store = makeStore();
    const business = store.dispatch(
      businessDirectoryApi.endpoints.getBusinessProfile.initiate({ userId: 'b-1' }),
    );
    const reviews = store.dispatch(
      creatorDirectoryApi.endpoints.getCreatorReviewsPage.initiate({
        userId: 'u-1',
        page: 1,
        limit: 10,
      }),
    );
    await settle();

    await store.dispatch(
      campaignFeedApi.endpoints.submitEngagementReview.initiate({
        engagementId: 'e-1',
        rating: 5,
        message: 'Great to work with.',
      }),
    );
    await settle();

    expect(calls('/business-profiles/b-1')).toBe(2);
    expect(calls('/creator-profiles/u-1/reviews')).toBe(2);
    business.unsubscribe();
    reviews.unsubscribe();
  });

  test('hiding a portfolio entry refetches the own public campaign portfolio', async () => {
    const store = makeStore();
    const sub = store.dispatch(
      creatorDirectoryApi.endpoints.getCreatorCampaignPortfolioPage.initiate({
        userId: 'u-1',
        page: 1,
        limit: 10,
      }),
    );
    await settle();

    await store.dispatch(
      campaignFeedApi.endpoints.setPortfolioEntryHidden.initiate({
        engagementId: 'e-1',
        hidden: true,
      }),
    );
    await settle();

    expect(calls('/creator-profiles/u-1/campaign-portfolio')).toBe(2);
    sub.unsubscribe();
  });

  test('a failed mutation leaves other caches alone', async () => {
    const store = makeStore();
    const sub = store.dispatch(
      creatorDirectoryApi.endpoints.getCreatorProfile.initiate({ userId: 'u-1' }),
    );
    await settle();

    adapter.mockImplementationOnce(config =>
      Promise.reject(
        Object.assign(new Error('bad'), {
          isAxiosError: true,
          config,
          response: {
            status: 422,
            data: { success: false, code: 'VALIDATION', statusCode: 422, message: 'bad' },
          },
        }),
      ),
    );
    await store.dispatch(profilesApi.endpoints.updateMyProfile.initiate({ handle: 'x' }));
    await settle();

    expect(calls('/auth/me')).toBe(0);
    expect(calls('/creator-profiles/u-1')).toBe(1);
    sub.unsubscribe();
  });
});
