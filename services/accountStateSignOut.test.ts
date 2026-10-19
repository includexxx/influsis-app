import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthAccount } from '@/types';
import authReducer, { sessionEstablished } from '@/slices/auth.slice';
import { httpClient } from './http';
import { setTokens } from './tokenStore';
import { notificationsApi } from './notificationsApi';
import accountStateSignOut from './accountStateSignOut';

const account = { id: 'u-1', email: 'c@influsis.test' } as AuthAccount;

function createStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [notificationsApi.reducerPath]: notificationsApi.reducer,
    },
    middleware: gDM =>
      gDM({ serializableCheck: false })
        .prepend(accountStateSignOut.middleware)
        .concat(notificationsApi.middleware),
  });
}

type Adapter = (config: InternalAxiosRequestConfig) => Promise<unknown>;
let adapter: jest.MockedFunction<Adapter>;

function answer(statusCode: number, code: string) {
  adapter.mockImplementation(config => {
    const response = {
      data: { success: false, code, statusCode, message: code, errors: null },
      status: statusCode,
      statusText: '',
      headers: {},
      config,
    };
    return Promise.reject(
      new AxiosError(`status ${statusCode}`, 'ERR_BAD_RESPONSE', config, {}, response),
    );
  });
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
  adapter = jest.fn<Adapter>();
  httpClient.defaults.adapter = adapter as any;
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('accountStateSignOut', () => {
  test.each(['ACCOUNT_SUSPENDED', 'ACCOUNT_DEACTIVATED', 'ACCOUNT_PENDING_VERIFICATION'])(
    '%s on a notification call signs out',
    async code => {
      const store = createStore();
      store.dispatch(sessionEstablished(account));
      answer(403, code);

      await store.dispatch(notificationsApi.endpoints.getUnreadCount.initiate());
      await settle();

      expect(store.getState().auth.status).toBe('unauthenticated');
    },
  );

  test('a mutation rejected with an account code signs out too', async () => {
    const store = createStore();
    store.dispatch(sessionEstablished(account));
    answer(403, 'ACCOUNT_SUSPENDED');

    await store.dispatch(notificationsApi.endpoints.markNotificationRead.initiate({ id: 'n-1' }));
    await settle();

    expect(store.getState().auth.status).toBe('unauthenticated');
  });

  test.each([
    [404, 'NOT_FOUND'],
    [422, 'VALIDATION_FAILED'],
    [500, 'INTERNAL_ERROR'],
  ])('%s %s keeps the session', async (status, code) => {
    const store = createStore();
    store.dispatch(sessionEstablished(account));
    answer(status, code);

    await store.dispatch(notificationsApi.endpoints.getUnreadCount.initiate());
    await settle();

    expect(store.getState().auth.status).toBe('authenticated');
  });

  test('a network error keeps the session', async () => {
    const store = createStore();
    store.dispatch(sessionEstablished(account));
    adapter.mockImplementation(config =>
      Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', config)),
    );

    await store.dispatch(notificationsApi.endpoints.getUnreadCount.initiate());
    await settle();

    expect(store.getState().auth.status).toBe('authenticated');
  });
});
