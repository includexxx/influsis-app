import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthAccount, AuthTokens } from '@/types';
import { authApi, clearTokens, getTokens, httpClient, setTokens } from '@/services';
import authReducer, {
  accountUpdated,
  restoreSession,
  sessionEnded,
  sessionEstablished,
} from './auth.slice';

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

function errorBody(code: string, statusCode: number) {
  return { success: false, code, statusCode, message: `err ${code}`, errors: null };
}

type Store = ReturnType<typeof configureStore>;
const stores: Store[] = [];

function makeStore() {
  const store = configureStore({
    reducer: { auth: authReducer, [authApi.reducerPath]: authApi.reducer },
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

describe('auth.slice reducer', () => {
  test('starts in restoring with no account', () => {
    expect(authReducer(undefined, { type: '@@INIT' })).toEqual({
      status: 'restoring',
      account: null,
    });
  });

  test('sessionEstablished stores the account and authenticates', () => {
    const next = authReducer(undefined, sessionEstablished(account));
    expect(next).toEqual({ status: 'authenticated', account });
  });

  test('sessionEnded clears the account and unauthenticates', () => {
    const next = authReducer({ status: 'authenticated', account }, sessionEnded());
    expect(next).toEqual({ status: 'unauthenticated', account: null });
  });

  test('accountUpdated replaces the account without touching status', () => {
    const next = authReducer(
      { status: 'authenticated', account },
      accountUpdated({ ...account, handle: 'creatorx' }),
    );
    expect(next.status).toBe('authenticated');
    expect(next.account?.handle).toBe('creatorx');
  });
});

describe('restoreSession', () => {
  test('with no stored tokens: unauthenticated, no /auth/me call', async () => {
    const store = makeStore();

    await store.dispatch(restoreSession());

    expect(store.getState().auth).toEqual({ status: 'unauthenticated', account: null });
    expect(adapter).not.toHaveBeenCalled();
  });

  test('with tokens and a /auth/me success: authenticated with the account', async () => {
    await setTokens(storedTokens);
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope(account)));

    await store.dispatch(restoreSession());

    expect(store.getState().auth).toEqual({ status: 'authenticated', account });
  });

  test('with tokens and a definitive 401: unauthenticated and the token store is cleared', async () => {
    await setTokens(storedTokens);
    const store = makeStore();
    adapter.mockImplementation(c => {
      if (c.url === '/auth/refresh') return ok(c, errorBody('AUTH_SESSION_REVOKED', 401), 401);
      return ok(c, errorBody('AUTH_TOKEN_EXPIRED', 401), 401);
    });

    await store.dispatch(restoreSession());

    expect(store.getState().auth.status).toBe('unauthenticated');
    expect(await getTokens()).toBeNull();
  });

  test('with tokens and a transport error: unauthenticated but the token store is kept', async () => {
    await setTokens(storedTokens);
    const store = makeStore();
    adapter.mockImplementation(c =>
      Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', c, {})),
    );

    await store.dispatch(restoreSession());

    expect(store.getState().auth.status).toBe('unauthenticated');
    expect(await getTokens()).toEqual(storedTokens);
  });
});
