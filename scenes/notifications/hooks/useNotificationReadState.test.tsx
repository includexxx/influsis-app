import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { httpClient } from '@/services/http';
import { notificationsApi } from '@/services/notificationsApi';
import { NotificationItem } from '@/types';
import { applyReadState } from '../utils/readState';
import { MARK_ALL_ERROR, useNotificationReadState } from './useNotificationReadState';

function makeItem(id: string, createdAt: string): NotificationItem {
  return {
    id,
    eventType: 'engagement.accepted',
    category: 'engagement',
    urgency: 'normal',
    title: id,
    body: '',
    target: { type: 'engagement', id: 'e-1', params: {} },
    readAt: null,
    resolvedAt: null,
    createdAt,
  };
}

const older = makeItem('a', '2026-10-17T08:00:00.000Z');
const newer = makeItem('b', '2026-10-17T09:00:00.000Z');

let status = 200;
let code = 'OK';
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

function urls() {
  return adapter.mock.calls.map(([config]) => config.url);
}

beforeEach(() => {
  jest.useFakeTimers();
  store = makeStore();
  status = 200;
  code = 'OK';
  adapter = jest.fn((config: InternalAxiosRequestConfig) => {
    if (status !== 200) {
      const response = {
        data: { success: false, code, statusCode: status, message: code, errors: null },
        status,
        statusText: '',
        headers: {},
        config,
      };
      return Promise.reject(new AxiosError('err', 'ERR_BAD_RESPONSE', config, {}, response));
    }
    const data = config.url?.endsWith('/read-all')
      ? { updated: 0 }
      : { id: 'a', readAt: '2026-10-17T10:00:00.000Z' };
    return Promise.resolve({
      data: { success: true, statusCode: 200, message: 'ok', data, meta: null },
      status,
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
});

const readFlags = (result: { current: ReturnType<typeof useNotificationReadState> }) =>
  applyReadState([older, newer], result.current.readState).map(i => i.readAt !== null);

describe('useNotificationReadState', () => {
  test('markRead marks the item read at once and calls NT3', async () => {
    const { result } = renderHook(() => useNotificationReadState(), { wrapper });

    act(() => result.current.markRead(older));

    expect(readFlags(result)).toEqual([true, false]);
    await waitFor(() => expect(urls()).toContain('/notifications/a/read'));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });
    expect(readFlags(result)).toEqual([true, false]);
  });

  test('an NT3 404 reverts silently', async () => {
    status = 404;
    code = 'NOT_FOUND';
    const { result } = renderHook(() => useNotificationReadState(), { wrapper });

    act(() => result.current.markRead(older));
    expect(readFlags(result)).toEqual([true, false]);

    await waitFor(() => expect(readFlags(result)).toEqual([false, false]));
    expect(result.current.markAllError).toBeNull();
  });

  test('any other NT3 failure reverts too', async () => {
    status = 500;
    code = 'INTERNAL_ERROR';
    const { result } = renderHook(() => useNotificationReadState(), { wrapper });

    act(() => result.current.markRead(older));

    await waitFor(() => expect(readFlags(result)).toEqual([false, false]));
  });

  test('an already-read item sends nothing', async () => {
    const { result } = renderHook(() => useNotificationReadState(), { wrapper });

    act(() => result.current.markRead({ ...older, readAt: '2026-10-17T08:30:00.000Z' }));

    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });
    expect(urls()).toEqual([]);
  });

  test('markAllRead marks items up to `before` and sends it to NT4', async () => {
    const { result } = renderHook(() => useNotificationReadState(), { wrapper });

    await act(async () => {
      await result.current.markAllRead(older.createdAt);
    });

    expect(readFlags(result)).toEqual([true, false]);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/notifications/read-all');
    expect(JSON.parse(String(call.data))).toEqual({ before: older.createdAt });
    expect(result.current.markAllError).toBeNull();
  });

  test('a failed markAllRead reverts and reports an error', async () => {
    status = 422;
    code = 'VALIDATION_FAILED';
    const { result } = renderHook(() => useNotificationReadState(), { wrapper });

    await act(async () => {
      await result.current.markAllRead(newer.createdAt);
    });

    expect(readFlags(result)).toEqual([false, false]);
    expect(result.current.markAllError).toBe(MARK_ALL_ERROR);
  });
});
