import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';
import { request } from '@/services/http';
import { notificationsApi } from '@/services/notificationsApi';
import authReducer, { sessionEstablished } from '@/slices/auth.slice';
import notificationsLive from '@/slices/notificationsLive.slice';
import { applyReadState } from '@/scenes/notifications/utils/readState';
import { AuthAccount, NotificationItem } from '@/types';
import { useNotificationReadParam } from './useNotificationReadParam';

let mockParams: { n?: string | string[] } = {};

jest.mock('expo-router', () => ({
  router: { setParams: jest.fn() },
  useGlobalSearchParams: () => mockParams,
}));

jest.mock('@/services/http', () => {
  class ApiError extends Error {
    code: string;
    statusCode: number;
    constructor(body: { code?: string; statusCode: number; message?: string }) {
      super(body.message ?? 'api error');
      this.code = body.code ?? 'UNKNOWN';
      this.statusCode = body.statusCode;
    }
  }
  return { __esModule: true, request: jest.fn(), ApiError };
});

const { ApiError } = jest.requireMock<{ ApiError: new (b: object) => Error }>('@/services/http');
const mockRequest = request as jest.MockedFunction<typeof request>;
const setParams = router.setParams as jest.Mock;

let store: ReturnType<typeof makeStore>;
function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      notificationsLive,
      [notificationsApi.reducerPath]: notificationsApi.reducer,
    },
    middleware: gDM => gDM({ serializableCheck: false }).concat(notificationsApi.middleware),
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

const readCalls = () => mockRequest.mock.calls.map(([c]) => c as { url: string; method?: string });

const isReadLocally = (id: string) =>
  applyReadState(
    [{ id, readAt: null, createdAt: '2026-10-17T09:00:00.000Z' } as NotificationItem],
    store.getState().notificationsLive.read,
  )[0].readAt !== null;

async function settle() {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(10);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockParams = {};
  setParams.mockReset();
  mockRequest.mockReset();
  mockRequest.mockImplementation((async () => ({
    id: 'abc',
    readAt: '2026-10-17T10:00:00.000Z',
  })) as typeof request);
  store = makeStore();
});

afterEach(() => {
  store.dispatch(notificationsApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('useNotificationReadParam', () => {
  test('signed in with ?n= marks it read once and drops the param', async () => {
    store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
    mockParams = { n: 'abc' };

    const { rerender } = renderHook(() => useNotificationReadParam(), { wrapper });
    await settle();
    rerender({});
    await settle();

    expect(readCalls()).toEqual([
      expect.objectContaining({ url: '/notifications/abc/read', method: 'PATCH' }),
    ]);
    expect(setParams).toHaveBeenCalledWith({ n: undefined });
    expect(isReadLocally('abc')).toBe(true);
  });

  test('waits while the session is restoring, then acts once signed in', async () => {
    mockParams = { n: 'abc' };
    renderHook(() => useNotificationReadParam(), { wrapper });
    await settle();
    expect(mockRequest).not.toHaveBeenCalled();
    expect(setParams).not.toHaveBeenCalled();

    act(() => {
      store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
    });
    await settle();

    expect(readCalls()).toHaveLength(1);
    expect(setParams).toHaveBeenCalledWith({ n: undefined });
  });

  test('a 404 (another account, or deleted) reverts the local mark without an alert', async () => {
    mockRequest.mockImplementation((async () => {
      throw new ApiError({ code: 'NOT_FOUND', statusCode: 404, message: 'gone' });
    }) as typeof request);
    store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
    mockParams = { n: 'abc' };

    renderHook(() => useNotificationReadParam(), { wrapper });
    await settle();

    expect(isReadLocally('abc')).toBe(false);
    expect(setParams).toHaveBeenCalledWith({ n: undefined });
  });

  test('no n, or an empty one, does nothing', async () => {
    store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
    const { rerender } = renderHook(() => useNotificationReadParam(), { wrapper });
    mockParams = { n: '' };
    rerender({});
    await settle();

    expect(mockRequest).not.toHaveBeenCalled();
    expect(setParams).not.toHaveBeenCalled();
  });

  test('a repeated n uses the first value', async () => {
    store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
    mockParams = { n: ['abc', 'def'] };

    renderHook(() => useNotificationReadParam(), { wrapper });
    await settle();

    expect(readCalls()).toEqual([expect.objectContaining({ url: '/notifications/abc/read' })]);
  });
});
