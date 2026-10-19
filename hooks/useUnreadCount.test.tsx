import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { AppState } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { httpClient } from '@/services/http';
import { notificationsApi } from '@/services/notificationsApi';
import { UNREAD_COUNT_POLL_MS, useUnreadCount } from './useUnreadCount';

type AppStateHandler = (state: string) => void;
let appStateHandlers: AppStateHandler[];
let count = 3;
let fail = false;
let adapter: jest.Mock<(config: InternalAxiosRequestConfig) => Promise<unknown>>;

let store: ReturnType<typeof makeStore>;
function makeStore() {
  return configureStore({
    reducer: { [notificationsApi.reducerPath]: notificationsApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(notificationsApi.middleware),
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

const reads = () => adapter.mock.calls.length;

function setAppState(state: string) {
  act(() => appStateHandlers.forEach(handler => handler(state)));
}

beforeEach(() => {
  jest.useFakeTimers();
  store = makeStore();
  count = 3;
  fail = false;
  appStateHandlers = [];
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((
    _: string,
    handler: AppStateHandler,
  ) => {
    appStateHandlers.push(handler);
    return { remove: jest.fn() };
  }) as never);
  adapter = jest.fn((config: InternalAxiosRequestConfig) => {
    if (fail) return Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', config));
    return Promise.resolve({
      data: { success: true, statusCode: 200, message: 'ok', data: { count }, meta: null },
      status: 200,
      statusText: '',
      headers: {},
      config,
    });
  });
  httpClient.defaults.adapter = adapter as any;
});

afterEach(() => {
  store.dispatch(notificationsApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useUnreadCount', () => {
  test('reads NT2 and returns the count', async () => {
    const { result } = renderHook(() => useUnreadCount(), { wrapper });
    await waitFor(() => expect(result.current).toBe(3));
    expect(adapter.mock.calls[0][0].url).toBe('/notifications/unread-count');
  });

  test('polls every 60 s while active', async () => {
    const { result } = renderHook(() => useUnreadCount(), { wrapper });
    await waitFor(() => expect(result.current).toBe(3));
    const before = reads();

    count = 5;
    await act(async () => {
      await jest.advanceTimersByTimeAsync(UNREAD_COUNT_POLL_MS);
    });

    await waitFor(() => expect(result.current).toBe(5));
    expect(reads()).toBe(before + 1);
  });

  test('stops polling in the background and refetches on return to active', async () => {
    const { result } = renderHook(() => useUnreadCount(), { wrapper });
    await waitFor(() => expect(result.current).toBe(3));

    setAppState('background');
    const before = reads();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(UNREAD_COUNT_POLL_MS * 3);
    });
    expect(reads()).toBe(before);

    count = 8;
    setAppState('active');

    await waitFor(() => expect(result.current).toBe(8));
    expect(reads()).toBeGreaterThan(before);
  });

  test('a failed read counts as 0', async () => {
    fail = true;
    const { result } = renderHook(() => useUnreadCount(), { wrapper });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });
    await waitFor(() => expect(adapter).toHaveBeenCalled());
    expect(result.current).toBe(0);
  });
});
