import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { httpClient } from '@/services/http';
import { notificationsApi } from '@/services/notificationsApi';
import { NotificationItem, NotificationsPageArgs } from '@/types';
import { NOTIFICATIONS_PAGE_SIZE, useNotificationsFeed } from './useNotificationsFeed';

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

// Minute `n` of 2026-10-17, so higher n = newer.
const at = (n: number) => new Date(Date.UTC(2026, 9, 17, 0, n)).toISOString();

type Pages = Record<number, NotificationItem[]>;
let pages: Pages;
let fail = false;
let adapter: jest.Mock<(config: InternalAxiosRequestConfig) => Promise<unknown>>;

function fullPage(prefix: string, start: number): NotificationItem[] {
  return Array.from({ length: NOTIFICATIONS_PAGE_SIZE }, (_, i) =>
    makeItem(`${prefix}-${i}`, at(start - i)),
  );
}

function calls(): NotificationsPageArgs[] {
  return adapter.mock.calls.map(([config]) => config.params as NotificationsPageArgs);
}

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

beforeEach(() => {
  jest.useFakeTimers();
  store = makeStore();
  fail = false;
  pages = { 1: fullPage('p1', 100), 2: [makeItem('p2-0', at(60)), makeItem('p2-1', at(59))] };
  adapter = jest.fn((config: InternalAxiosRequestConfig) => {
    if (fail) return Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', config));
    const { page } = config.params as NotificationsPageArgs;
    const data = pages[page] ?? [];
    return Promise.resolve({
      data: { success: true, statusCode: 200, message: 'ok', data, meta: null },
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
});

describe('useNotificationsFeed', () => {
  test('page 1 goes without `before`; page 2 sends page 1’s newest createdAt', async () => {
    const { result } = renderHook(() => useNotificationsFeed('all'), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(NOTIFICATIONS_PAGE_SIZE));
    expect(calls()[0]).toEqual({ page: 1, limit: NOTIFICATIONS_PAGE_SIZE });
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.items).toHaveLength(NOTIFICATIONS_PAGE_SIZE + 2));
    expect(calls().at(-1)).toEqual({ page: 2, limit: NOTIFICATIONS_PAGE_SIZE, before: at(100) });
    expect(result.current.hasMore).toBe(false);
  });

  test('the unread filter sends unread=true', async () => {
    const { result } = renderHook(() => useNotificationsFeed('unread'), { wrapper });
    await waitFor(() => expect(result.current.items.length).toBeGreaterThan(0));
    expect(calls()[0]).toEqual({ page: 1, limit: NOTIFICATIONS_PAGE_SIZE, unread: true });
  });

  test('an item on two pages shows once', async () => {
    pages[2] = [pages[1][NOTIFICATIONS_PAGE_SIZE - 1], makeItem('p2-new', at(50))];
    const { result } = renderHook(() => useNotificationsFeed('all'), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(NOTIFICATIONS_PAGE_SIZE));

    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.items.at(-1)?.id).toBe('p2-new'));
    const ids = result.current.items.map(i => i.id);
    expect(ids).toHaveLength(NOTIFICATIONS_PAGE_SIZE + 1);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('a short first page means there is no next page', async () => {
    pages[1] = [makeItem('only', at(1))];
    const { result } = renderHook(() => useNotificationsFeed('all'), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.hasMore).toBe(false);
  });

  test('refresh drops later pages and takes a new anchor from the fresh page 1', async () => {
    const { result } = renderHook(() => useNotificationsFeed('all'), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(NOTIFICATIONS_PAGE_SIZE));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(NOTIFICATIONS_PAGE_SIZE + 2));

    pages[1] = fullPage('fresh', 200);
    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => expect(result.current.items[0].id).toBe('fresh-0'));
    expect(result.current.items).toHaveLength(NOTIFICATIONS_PAGE_SIZE);

    act(() => result.current.loadMore());
    await waitFor(() =>
      expect(calls().at(-1)).toEqual(expect.objectContaining({ page: 2, before: at(200) })),
    );
  });

  test('an empty feed is not loading and has no error', async () => {
    pages[1] = [];
    const { result } = renderHook(() => useNotificationsFeed('all'), { wrapper });
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(result.current.isInitialError).toBe(false);
  });

  test('a failed first page is an initial error; retry recovers', async () => {
    fail = true;
    const { result } = renderHook(() => useNotificationsFeed('all'), { wrapper });
    await waitFor(() => expect(result.current.isInitialError).toBe(true));

    fail = false;
    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.items).toHaveLength(NOTIFICATIONS_PAGE_SIZE));
    expect(result.current.isInitialError).toBe(false);
  });

  test('a failed refresh keeps the list and flags it', async () => {
    const { result } = renderHook(() => useNotificationsFeed('all'), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(NOTIFICATIONS_PAGE_SIZE));

    fail = true;
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.isRefreshError).toBe(true);
    expect(result.current.items).toHaveLength(NOTIFICATIONS_PAGE_SIZE);
  });
});
