import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthAccount, AuthTokens } from '@/types';
import { ApiError, httpClient } from './http';
import { clearTokens, setTokens } from './tokenStore';
import { authApi } from './authApi';

const account: AuthAccount = {
  id: 'u-1',
  roleKey: 'creator',
  status: 'active',
  role: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  deactivatedAt: null,
  email: 'c@influsis.test',
  phone: null,
  emailVerified: true,
  phoneVerified: false,
  twoFactorEnabled: false,
  handle: null,
  profile: null,
};

const storedTokens: AuthTokens = {
  token: 'access-1',
  refreshToken: 'refresh-1',
  tokenExpires: 2_000_000_000_000,
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

function errorBody(code: string, statusCode: number, errors: unknown = null) {
  return { success: false, code, statusCode, message: `err ${code}`, errors };
}

type Store = ReturnType<typeof configureStore>;
const stores: Store[] = [];

function makeStore() {
  const store = configureStore({
    reducer: { [authApi.reducerPath]: authApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(authApi.middleware),
  });
  stores.push(store as Store);
  return store;
}

type Adapter = (config: InternalAxiosRequestConfig) => Promise<unknown>;
let adapter: jest.MockedFunction<Adapter>;

beforeEach(async () => {
  // fake timers keep RTK Query's keepUnusedDataFor cleanup from scheduling real
  // work that outlives the test worker
  jest.useFakeTimers();
  await AsyncStorage.clear();
  await clearTokens();
  jest.clearAllMocks();
  adapter = jest.fn<Adapter>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpClient.defaults.adapter = adapter as any;
});

afterEach(() => {
  stores.splice(0).forEach(s => s.dispatch(authApi.util.resetApiState()));
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('authApi', () => {
  test('login posts to /auth/login with skipAuth and resolves the token pair', async () => {
    const store = makeStore();
    adapter.mockImplementation(c =>
      ok(c, envelope({ token: 'a', refreshToken: 'r', tokenExpires: 1, user: account })),
    );

    const data = await store
      .dispatch(authApi.endpoints.login.initiate({ identifier: 'c@influsis.test', password: 'pw' }))
      .unwrap();

    expect(data).toMatchObject({ token: 'a', user: { id: 'u-1' } });
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/auth/login');
    expect(call.skipAuth).toBe(true);
    expect(call.headers.Authorization).toBeUndefined();
  });

  test('the login MFA branch surfaces { mfaRequired, preAuthToken }', async () => {
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope({ mfaRequired: true, preAuthToken: 'pre-1' })));

    const data = await store
      .dispatch(authApi.endpoints.login.initiate({ identifier: 'c@influsis.test', password: 'pw' }))
      .unwrap();

    expect(data).toEqual({ mfaRequired: true, preAuthToken: 'pre-1' });
  });

  test('getMe GETs /auth/me on the bearer path and returns the account', async () => {
    await setTokens(storedTokens);
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope(account)));

    const data = await store
      .dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true }))
      .unwrap();

    expect(data).toEqual(account);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/auth/me');
    expect(call.skipAuth).toBeUndefined();
    expect(call.headers.Authorization).toBe('Bearer access-1');
  });

  test('register resolves null data', async () => {
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope(null)));

    const data = await store
      .dispatch(
        authApi.endpoints.register.initiate({
          roleKey: 'creator',
          email: 'c@influsis.test',
          password: 'password1',
        }),
      )
      .unwrap();

    expect(data).toBeNull();
    expect(adapter.mock.calls[0][0].url).toBe('/auth/register');
  });

  test('requestOtp posts the body to /auth/otp/request', async () => {
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope(null)));

    await store
      .dispatch(
        authApi.endpoints.requestOtp.initiate({
          destination: 'c@influsis.test',
          channel: 'email',
          purpose: 'registration',
        }),
      )
      .unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/auth/otp/request');
    expect(JSON.parse(String(call.data))).toEqual({
      destination: 'c@influsis.test',
      channel: 'email',
      purpose: 'registration',
    });
  });

  test('verifyOtp posts to /auth/otp/verify with skipAuth and unwraps the token pair', async () => {
    const store = makeStore();
    adapter.mockImplementation(c =>
      ok(c, envelope({ token: 'a', refreshToken: 'r', tokenExpires: 1, user: account })),
    );

    const data = await store
      .dispatch(
        authApi.endpoints.verifyOtp.initiate({
          destination: 'c@influsis.test',
          purpose: 'registration',
          code: '1234',
        }),
      )
      .unwrap();

    expect(data).toMatchObject({ token: 'a', user: { id: 'u-1' } });
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/auth/otp/verify');
    expect(call.skipAuth).toBe(true);
    expect(call.headers.Authorization).toBeUndefined();
  });

  test('resetPassword posts to /auth/reset-password with skipAuth and resolves null', async () => {
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope(null)));

    const data = await store
      .dispatch(
        authApi.endpoints.resetPassword.initiate({ resetToken: 'rt-1', newPassword: 'password1' }),
      )
      .unwrap();

    expect(data).toBeNull();
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/auth/reset-password');
    expect(call.skipAuth).toBe(true);
    expect(call.headers.Authorization).toBeUndefined();
  });

  test('a success:false body becomes a result.error that is an ApiError with the server code', async () => {
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, errorBody('AUTH_INVALID_CREDENTIALS', 401), 401));

    const result = await store.dispatch(
      authApi.endpoints.login.initiate({ identifier: 'c@influsis.test', password: 'nope' }),
    );

    expect(result.error).toBeInstanceOf(ApiError);
    expect((result.error as ApiError).code).toBe('AUTH_INVALID_CREDENTIALS');
    expect((result.error as ApiError).statusCode).toBe(401);
  });
});
