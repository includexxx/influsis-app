import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError, httpClient } from '@/services/http';
import { clearTokens, setTokens } from '@/services/tokenStore';
import { businessDirectoryApi } from './businessDirectoryApi';
import { BusinessDirectoryItem, BusinessProfilePublic } from '../types/businessDirectory';

const directoryItem: BusinessDirectoryItem = {
  userId: 'business-1',
  businessName: 'Bkash Ltd. Company',
  username: 'bkash',
  description: null,
  categories: ['fintech'],
  subcategories: [],
  country: 'Bangladesh',
  state: null,
  city: 'Dhaka',
  contactEmail: null,
  contactPhone: null,
  websiteUrl: 'https://bkash.com',
  avatarUrl: 'https://cdn.influsis.test/business-1/avatar.jpg',
  verificationStatus: 'verified',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const publicProfile: BusinessProfilePublic = {
  userId: 'business-1',
  businessName: 'Bkash Ltd. Company',
  username: 'bkash',
  description: 'A fintech company.',
  categories: ['fintech'],
  subcategories: [],
  socialLinks: [],
  country: 'Bangladesh',
  state: null,
  city: 'Dhaka',
  contactEmail: null,
  contactPhone: null,
  websiteUrl: 'https://bkash.com',
  avatarUrl: 'https://cdn.influsis.test/business-1/avatar.jpg',
  coverUrl: 'https://cdn.influsis.test/business-1/cover.jpg',
  verificationStatus: 'verified',
  handle: 'bkash',
  createdAt: '2026-01-01T00:00:00.000Z',
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
    reducer: { [businessDirectoryApi.reducerPath]: businessDirectoryApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(businessDirectoryApi.middleware),
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
  stores.splice(0).forEach(s => s.dispatch(businessDirectoryApi.util.resetApiState()));
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('businessDirectoryApi', () => {
  test('getTopBusinesses GETs page 1 of /business-profiles with the given limit', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([directoryItem])));

    const data = await store
      .dispatch(businessDirectoryApi.endpoints.getTopBusinesses.initiate({ limit: 6 }))
      .unwrap();

    expect(data).toEqual([directoryItem]);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/business-profiles');
    expect(call.method).toBe('get');
    expect(call.params).toEqual({ page: 1, limit: 6 });
    expect(call.headers.Authorization).toBe('Bearer access-1');
  });

  test('getBusinessesDirectoryPage GETs the given page/limit of /business-profiles', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([directoryItem])));

    await store
      .dispatch(
        businessDirectoryApi.endpoints.getBusinessesDirectoryPage.initiate({ page: 2, limit: 12 }),
      )
      .unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/business-profiles');
    expect(call.method).toBe('get');
    expect(call.params).toEqual({ page: 2, limit: 12 });
  });

  test('getBusinessProfile GETs /business-profiles/:userId without a bearer token', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope(publicProfile)));

    const data = await store
      .dispatch(
        businessDirectoryApi.endpoints.getBusinessProfile.initiate({ userId: 'business-1' }),
      )
      .unwrap();

    expect(data).toEqual(publicProfile);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/business-profiles/business-1');
    expect(call.method).toBe('get');
    expect(call.headers.Authorization).toBeUndefined();
  });

  test('a failed fetch surfaces as a result.error ApiError', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, errorBody('NOT_FOUND', 404), 404));

    const result = await store.dispatch(
      businessDirectoryApi.endpoints.getBusinessProfile.initiate({ userId: 'missing' }),
    );

    expect(result.error).toBeInstanceOf(ApiError);
    expect((result.error as ApiError).code).toBe('NOT_FOUND');
  });
});
