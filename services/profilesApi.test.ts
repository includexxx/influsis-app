import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { MyProfileResponse } from '@/types';
import { ApiError, httpClient } from './http';
import { clearTokens, setTokens } from './tokenStore';
import { profilesApi } from './profilesApi';

const profileResponse: MyProfileResponse = {
  kind: 'creator',
  handle: 'ayesha',
  profile: {
    id: 'p-1',
    name: 'Ayesha Rahman',
    bio: null,
    categories: [],
    subcategories: [],
    languages: [],
    deliverables: [],
    platforms: [],
    portfolio: [],
    dateOfBirth: null,
    gender: null,
    country: null,
    state: null,
    city: null,
    postalCode: null,
    address: null,
    contactEmail: null,
    contactPhone: null,
    websiteUrl: null,
    avatarUrl: null,
    coverUrl: null,
    isDiscoverable: true,
    verificationDocumentsUrl: null,
    verificationStatus: 'unverified',
    verificationNotes: null,
    verifiedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
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
    reducer: { [profilesApi.reducerPath]: profilesApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(profilesApi.middleware),
  });
  stores.push(store as Store);
  return store;
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
  stores.splice(0).forEach(s => s.dispatch(profilesApi.util.resetApiState()));
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('profilesApi', () => {
  test('onboardCreator posts the body to /profiles/onboarding-creator with the bearer path', async () => {
    await setTokens({
      token: 'access-1',
      refreshToken: 'refresh-1',
      tokenExpires: 2_000_000_000_000,
    });
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope(profileResponse)));

    const data = await store
      .dispatch(profilesApi.endpoints.onboardCreator.initiate({ name: 'Ayesha' }))
      .unwrap();

    expect(data).toEqual(profileResponse);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/profiles/onboarding-creator');
    expect(call.method).toBe('post');
    expect(call.skipAuth).toBeUndefined();
    expect(call.headers.Authorization).toBe('Bearer access-1');
    expect(JSON.parse(String(call.data))).toEqual({ name: 'Ayesha' });
  });

  test('getMyProfile GETs /profiles/me and returns the profile', async () => {
    await setTokens({
      token: 'access-1',
      refreshToken: 'refresh-1',
      tokenExpires: 2_000_000_000_000,
    });
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope(profileResponse)));

    const data = await store
      .dispatch(profilesApi.endpoints.getMyProfile.initiate(undefined, { forceRefetch: true }))
      .unwrap();

    expect(data).toEqual(profileResponse);
    expect(adapter.mock.calls[0][0].url).toBe('/profiles/me');
    expect(adapter.mock.calls[0][0].method).toBe('get');
  });

  test('updateMyProfile PATCHes /profiles/me with the given body', async () => {
    await setTokens({
      token: 'access-1',
      refreshToken: 'refresh-1',
      tokenExpires: 2_000_000_000_000,
    });
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope(profileResponse)));

    await store.dispatch(profilesApi.endpoints.updateMyProfile.initiate({ bio: null })).unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/profiles/me');
    expect(call.method).toBe('patch');
    expect(JSON.parse(String(call.data))).toEqual({ bio: null });
  });

  test('a handle-conflict error becomes a result.error ApiError with code HANDLE_TAKEN', async () => {
    await setTokens({
      token: 'access-1',
      refreshToken: 'refresh-1',
      tokenExpires: 2_000_000_000_000,
    });
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, errorBody('HANDLE_TAKEN', 409), 409));

    const result = await store.dispatch(
      profilesApi.endpoints.onboardCreator.initiate({ handle: 'taken' }),
    );

    expect(result.error).toBeInstanceOf(ApiError);
    expect((result.error as ApiError).code).toBe('HANDLE_TAKEN');
    expect((result.error as ApiError).statusCode).toBe(409);
  });
});
