import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { NotificationItem, NotificationPreference } from '@/types';
import { httpClient } from './http';
import { clearTokens, setTokens } from './tokenStore';
import { notificationsApi } from './notificationsApi';

const item: NotificationItem = {
  id: 'n-1',
  eventType: 'engagement.accepted',
  category: 'engagement',
  urgency: 'high',
  title: 'Offer accepted',
  body: 'Rafiul accepted the offer.',
  target: { type: 'engagement', id: 'e-1', params: { campaignId: 'c-1' } },
  readAt: null,
  resolvedAt: null,
  createdAt: '2026-10-17T09:30:00.000Z',
};

function preference(enabled: boolean): NotificationPreference {
  return {
    category: 'offer',
    inApp: { enabled: true, locked: true },
    email: { enabled, lockedEvents: [], optionalEvents: ['offer.countered'] },
    push: { enabled: true, lockedEvents: [], optionalEvents: ['offer.countered'] },
  };
}

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

function createStore() {
  return configureStore({
    reducer: { [notificationsApi.reducerPath]: notificationsApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(notificationsApi.middleware),
  });
}

const stores: ReturnType<typeof createStore>[] = [];

function makeStore() {
  const store = createStore();
  stores.push(store);
  return store;
}

type Adapter = (config: InternalAxiosRequestConfig) => Promise<unknown>;
let adapter: jest.MockedFunction<Adapter>;

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  await clearTokens();
  await setTokens({
    token: 'access-1',
    refreshToken: 'refresh-1',
    tokenExpires: 2_000_000_000_000,
  });
  adapter = jest.fn<Adapter>();
  httpClient.defaults.adapter = adapter as any;
});

afterEach(() => {
  stores.splice(0).forEach(s => s.dispatch(notificationsApi.util.resetApiState()));
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('notificationsApi', () => {
  test('getNotificationsPage GETs /notifications with page and limit only on page 1', async () => {
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([item])));

    const data = await store
      .dispatch(notificationsApi.endpoints.getNotificationsPage.initiate({ page: 1, limit: 20 }))
      .unwrap();

    expect(data).toEqual([item]);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/notifications');
    expect(call.method).toBe('get');
    expect(call.params).toEqual({ page: 1, limit: 20 });
    expect(call.headers.Authorization).toBe('Bearer access-1');
    expect(call.headers['x-custom-lang']).toBe('en');
  });

  test('getNotificationsPage sends unread and the before anchor when set', async () => {
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([])));

    await store
      .dispatch(
        notificationsApi.endpoints.getNotificationsPage.initiate({
          page: 2,
          limit: 20,
          unread: true,
          before: '2026-10-17T09:30:00.000Z',
        }),
      )
      .unwrap();

    expect(adapter.mock.calls[0][0].params).toEqual({
      page: 2,
      limit: 20,
      unread: true,
      before: '2026-10-17T09:30:00.000Z',
    });
  });

  test('getUnreadCount GETs /notifications/unread-count', async () => {
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope({ count: 7 })));

    const data = await store
      .dispatch(notificationsApi.endpoints.getUnreadCount.initiate())
      .unwrap();

    expect(data).toEqual({ count: 7 });
    expect(adapter.mock.calls[0][0].url).toBe('/notifications/unread-count');
    expect(adapter.mock.calls[0][0].method).toBe('get');
  });

  test('markNotificationRead PATCHes the encoded id', async () => {
    const store = makeStore();
    adapter.mockImplementation(c =>
      ok(c, envelope({ id: 'a/b', readAt: '2026-10-17T09:31:00.000Z' })),
    );

    await store
      .dispatch(notificationsApi.endpoints.markNotificationRead.initiate({ id: 'a/b' }))
      .unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/notifications/a%2Fb/read');
    expect(call.method).toBe('patch');
  });

  test('markAllNotificationsRead POSTs { before } to /notifications/read-all', async () => {
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope({ updated: 0 })));

    const data = await store
      .dispatch(
        notificationsApi.endpoints.markAllNotificationsRead.initiate({
          before: '2026-10-17T09:30:00.000Z',
        }),
      )
      .unwrap();

    expect(data).toEqual({ updated: 0 });
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/notifications/read-all');
    expect(call.method).toBe('post');
    expect(JSON.parse(String(call.data))).toEqual({ before: '2026-10-17T09:30:00.000Z' });
  });

  test('a successful mark-read refetches the unread count; a failed one does not', async () => {
    const store = makeStore();
    let count = 3;
    let markStatus = 200;
    adapter.mockImplementation(c => {
      if (c.url === '/notifications/unread-count') return ok(c, envelope({ count }));
      if (markStatus !== 200) {
        return ok(
          c,
          { success: false, code: 'NOT_FOUND', statusCode: 404, message: 'gone', errors: null },
          404,
        );
      }
      return ok(c, envelope({ id: 'n-1', readAt: '2026-10-17T09:31:00.000Z' }));
    });
    const sub = store.dispatch(notificationsApi.endpoints.getUnreadCount.initiate());
    await sub.unwrap();
    const countCalls = () =>
      adapter.mock.calls.filter(([c]) => c.url === '/notifications/unread-count').length;

    count = 2;
    await store.dispatch(notificationsApi.endpoints.markNotificationRead.initiate({ id: 'n-1' }));
    for (let i = 0; i < 5; i++) await jest.advanceTimersByTimeAsync(10);
    expect(countCalls()).toBe(2);

    markStatus = 404;
    await store.dispatch(notificationsApi.endpoints.markNotificationRead.initiate({ id: 'n-2' }));
    for (let i = 0; i < 5; i++) await jest.advanceTimersByTimeAsync(10);
    expect(countCalls()).toBe(2);
    sub.unsubscribe();
  });

  test('getNotificationPreferences GETs /notifications/preferences', async () => {
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([preference(true)])));

    const data = await store
      .dispatch(notificationsApi.endpoints.getNotificationPreferences.initiate())
      .unwrap();

    expect(data).toEqual([preference(true)]);
    expect(adapter.mock.calls[0][0].url).toBe('/notifications/preferences');
    expect(adapter.mock.calls[0][0].method).toBe('get');
  });

  test('updateNotificationPreferences PATCHes the partial body and replaces the cached NT5', async () => {
    const store = makeStore();
    adapter.mockImplementation(c =>
      ok(c, envelope([preference(c.method === 'patch' ? false : true)])),
    );
    const sub = store.dispatch(notificationsApi.endpoints.getNotificationPreferences.initiate());
    await sub.unwrap();

    await store
      .dispatch(
        notificationsApi.endpoints.updateNotificationPreferences.initiate({
          email: { offer: false },
        }),
      )
      .unwrap();

    const patch = adapter.mock.calls.find(([c]) => c.method === 'patch')?.[0];
    expect(patch?.url).toBe('/notifications/preferences');
    expect(JSON.parse(String(patch?.data))).toEqual({ email: { offer: false } });
    const cached = notificationsApi.endpoints.getNotificationPreferences.select()(
      store.getState() as never,
    ).data;
    expect(cached?.[0].email?.enabled).toBe(false);
    expect(adapter.mock.calls.filter(([c]) => c.method === 'get')).toHaveLength(1);
    sub.unsubscribe();
  });
});
