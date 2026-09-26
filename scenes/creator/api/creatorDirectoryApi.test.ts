import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError, httpClient } from '@/services/http';
import { clearTokens, setTokens } from '@/services/tokenStore';
import { creatorDirectoryApi } from './creatorDirectoryApi';
import { CreatorDirectoryItem, CreatorProfilePublic } from '../types/creatorDirectory';

const directoryItem: CreatorDirectoryItem = {
  userId: 'creator-1',
  displayName: 'Sunehra Tasnim',
  categories: ['lifestyle'],
  country: 'Bangladesh',
  state: null,
  city: 'Dhaka',
  contactEmail: null,
  contactPhone: null,
  avatarUrl: 'https://cdn.influsis.test/creator-1/avatar.jpg',
  isDiscoverable: true,
  verificationStatus: 'verified',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const publicProfile: CreatorProfilePublic = {
  userId: 'creator-1',
  displayName: 'Sunehra Tasnim',
  bio: 'Beauty and lifestyle content creator.',
  email: 'sunehra@example.com',
  phone: null,
  categories: ['lifestyle'],
  country: 'Bangladesh',
  state: null,
  city: 'Dhaka',
  websiteUrl: null,
  avatarUrl: 'https://cdn.influsis.test/creator-1/avatar.jpg',
  coverUrl: 'https://cdn.influsis.test/creator-1/cover.jpg',
  verificationStatus: 'verified',
  handle: 'sunehra',
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
    reducer: { [creatorDirectoryApi.reducerPath]: creatorDirectoryApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(creatorDirectoryApi.middleware),
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
  stores.splice(0).forEach(s => s.dispatch(creatorDirectoryApi.util.resetApiState()));
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('creatorDirectoryApi', () => {
  test('getTopCreators GETs page 1 of /creator-profiles with the given limit', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([directoryItem])));

    const data = await store
      .dispatch(creatorDirectoryApi.endpoints.getTopCreators.initiate({ limit: 6 }))
      .unwrap();

    expect(data).toEqual([directoryItem]);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/creator-profiles');
    expect(call.method).toBe('get');
    expect(call.params).toEqual({ page: 1, limit: 6 });
    expect(call.headers.Authorization).toBe('Bearer access-1');
  });

  test('getCreatorsDirectoryPage GETs the given page/limit of /creator-profiles', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([directoryItem])));

    await store
      .dispatch(
        creatorDirectoryApi.endpoints.getCreatorsDirectoryPage.initiate({ page: 2, limit: 10 }),
      )
      .unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/creator-profiles');
    expect(call.method).toBe('get');
    expect(call.params).toEqual({ page: 2, limit: 10 });
  });

  test('getCreatorProfile GETs /creator-profiles/:userId without a bearer token', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope(publicProfile)));

    const data = await store
      .dispatch(creatorDirectoryApi.endpoints.getCreatorProfile.initiate({ userId: 'creator-1' }))
      .unwrap();

    expect(data).toEqual(publicProfile);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/creator-profiles/creator-1');
    expect(call.method).toBe('get');
    expect(call.headers.Authorization).toBeUndefined();
  });

  test('a failed fetch surfaces as a result.error ApiError', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, errorBody('NOT_FOUND', 404), 404));

    const result = await store.dispatch(
      creatorDirectoryApi.endpoints.getCreatorProfile.initiate({ userId: 'missing' }),
    );

    expect(result.error).toBeInstanceOf(ApiError);
    expect((result.error as ApiError).code).toBe('NOT_FOUND');
  });
});
