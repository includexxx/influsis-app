import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { InternalAxiosRequestConfig } from 'axios';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { httpClient } from '@/services/http';
import { notificationsApi } from '@/services/notificationsApi';
import { setAppBadge } from '@/services/push/badge';
import authReducer, { sessionEnded, sessionEstablished } from '@/slices/auth.slice';
import { AuthAccount } from '@/types';
import { useAppBadge } from './useAppBadge';

jest.mock('@/services/push/badge', () => ({ setAppBadge: jest.fn(async () => undefined) }));

const badge = setAppBadge as unknown as jest.Mock<(count: number) => Promise<void>>;
type AppStateHandler = (state: string) => void;
let appStateHandlers: AppStateHandler[];
let count: number;
let adapter: jest.Mock<(config: InternalAxiosRequestConfig) => Promise<unknown>>;
const originalOS = Platform.OS;
const setOS = (os: string) =>
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });

let store: ReturnType<typeof makeStore>;
function makeStore() {
  return configureStore({
    reducer: { auth: authReducer, [notificationsApi.reducerPath]: notificationsApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(notificationsApi.middleware),
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

beforeEach(() => {
  jest.useFakeTimers();
  badge.mockClear();
  count = 4;
  store = makeStore();
  appStateHandlers = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((
    _: string,
    handler: AppStateHandler,
  ) => {
    appStateHandlers.push(handler);
    return { remove: jest.fn() };
  }) as never);
  adapter = jest.fn((config: InternalAxiosRequestConfig) =>
    Promise.resolve({
      data: { success: true, statusCode: 200, message: 'ok', data: { count }, meta: null },
      status: 200,
      statusText: '',
      headers: {},
      config,
    }),
  );
  httpClient.defaults.adapter = adapter as any;
  setOS('ios');
});

afterEach(() => {
  store.dispatch(notificationsApi.util.resetApiState());
  setOS(originalOS);
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useAppBadge', () => {
  test('iOS, signed in: the badge follows the unread count', async () => {
    store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
    renderHook(() => useAppBadge(), { wrapper });

    await waitFor(() => expect(badge).toHaveBeenCalledWith(4));
  });

  test('refetches and updates on every return to the app', async () => {
    store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
    renderHook(() => useAppBadge(), { wrapper });
    await waitFor(() => expect(badge).toHaveBeenCalledWith(4));

    count = 9;
    act(() => appStateHandlers.forEach(handler => handler('active')));

    await waitFor(() => expect(badge).toHaveBeenCalledWith(9));
  });

  test('sign-out clears it', async () => {
    store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
    renderHook(() => useAppBadge(), { wrapper });
    await waitFor(() => expect(badge).toHaveBeenCalledWith(4));

    act(() => {
      store.dispatch(sessionEnded());
    });

    expect(badge).toHaveBeenLastCalledWith(0);
  });

  test('Android: nothing, and no unread-count request', async () => {
    setOS('android');
    store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
    renderHook(() => useAppBadge(), { wrapper });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });

    expect(badge).not.toHaveBeenCalled();
    expect(adapter).not.toHaveBeenCalled();
  });
});
