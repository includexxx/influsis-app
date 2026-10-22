import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { sessionEnded, sessionEstablished } from '@/slices/auth.slice';
import notificationsLive, { notificationReceived } from '@/slices/notificationsLive.slice';
import { notificationsApi } from '@/services/notificationsApi';
import { AuthAccount, NotificationItem } from '@/types';
import { handleForegroundPush, handlePushTap, PushHandlerDeps } from './pushHandlers';

const NOW = Date.parse('2026-10-22T09:00:00.000Z');

const singleData = (overrides: Record<string, string> = {}) => ({
  kind: 'single',
  notificationId: 'n-1',
  eventType: 'delivery.changes_requested',
  urgency: 'high',
  targetType: 'delivery',
  targetId: 'e-1',
  targetParams: '{}',
  ...overrides,
});

const message = (data: Record<string, string>) => ({
  data,
  notification: { title: 'Changes requested', body: 'Update your draft.' },
});

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

let store: ReturnType<typeof makeStore>;
let push: jest.Mock<(path: string) => void>;
let hold: jest.Mock<(path: string) => void>;
let dispatched: { type: string }[];
let deps: PushHandlerDeps;

const signIn = () => store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
const types = () => dispatched.map(action => action.type);

beforeEach(() => {
  store = makeStore();
  push = jest.fn();
  hold = jest.fn();
  dispatched = [];
  deps = {
    dispatch: ((action: unknown) => {
      dispatched.push(action as { type: string });
      return store.dispatch(action as never);
    }) as PushHandlerDeps['dispatch'],
    getState: store.getState,
    push,
    hold,
    now: () => NOW,
  };
});

describe('handlePushTap', () => {
  test('signed in: opens the mapped screen with ?n=', () => {
    signIn();
    handlePushTap(message(singleData()), deps);
    expect(push).toHaveBeenCalledWith('/engagement/e-1/submit-delivery?n=n-1');
    expect(hold).not.toHaveBeenCalled();
  });

  test('while the session is restoring (cold start): held until sign-in', () => {
    handlePushTap(message(singleData()), deps);
    expect(hold).toHaveBeenCalledWith('/engagement/e-1/submit-delivery?n=n-1');
    expect(push).not.toHaveBeenCalled();
  });

  test('signed out: held until sign-in', () => {
    store.dispatch(sessionEnded());
    handlePushTap(message(singleData()), deps);
    expect(hold).toHaveBeenCalledWith('/engagement/e-1/submit-delivery?n=n-1');
  });

  test('a batch opens the notifications page', () => {
    signIn();
    handlePushTap(message({ kind: 'batch', urgency: 'normal' }), deps);
    expect(push).toHaveBeenCalledWith('/notifications');
  });

  test('unreadable data opens the notifications page', () => {
    signIn();
    handlePushTap(message(singleData({ targetParams: '{oops' })), deps);
    handlePushTap(null, deps);
    expect(push.mock.calls).toEqual([['/notifications'], ['/notifications']]);
  });
});

describe('handleForegroundPush', () => {
  test('high, not seen by the socket: banner, feed reload, unread count refetch', () => {
    signIn();
    handleForegroundPush(message(singleData()), deps);

    const live = store.getState().notificationsLive;
    expect(live.banner).toEqual({
      id: 'n-1',
      eventType: 'delivery.changes_requested',
      category: '',
      urgency: 'high',
      title: 'Changes requested',
      body: 'Update your draft.',
      target: { type: 'delivery', id: 'e-1', params: {} },
      readAt: null,
      resolvedAt: null,
      createdAt: new Date(NOW).toISOString(),
    });
    expect(live.resyncCount).toBe(1);
    expect(live.incoming).toEqual([]);
    expect(types()).toContain(notificationsApi.util.invalidateTags(['UnreadCount']).type);
  });

  test('already delivered by the socket: no banner, no reload, count still refetched', () => {
    signIn();
    store.dispatch(notificationReceived({ id: 'n-1', urgency: 'normal' } as NotificationItem));

    handleForegroundPush(message(singleData()), deps);

    const live = store.getState().notificationsLive;
    expect(live.banner).toBeNull();
    expect(live.resyncCount).toBe(0);
    expect(types()).toContain(notificationsApi.util.invalidateTags(['UnreadCount']).type);
  });

  test('normal urgency: feed reload only, no banner', () => {
    signIn();
    handleForegroundPush(message(singleData({ urgency: 'normal' })), deps);

    const live = store.getState().notificationsLive;
    expect(live.banner).toBeNull();
    expect(live.resyncCount).toBe(1);
  });

  test('batch: feed reload only', () => {
    signIn();
    handleForegroundPush(message({ kind: 'batch', urgency: 'normal' }), deps);

    const live = store.getState().notificationsLive;
    expect(live.banner).toBeNull();
    expect(live.resyncCount).toBe(1);
  });

  test('a second push for the same id shows no second banner', () => {
    signIn();
    handleForegroundPush(message(singleData()), deps);
    store.dispatch({ type: 'notificationsLive/bannerDismissed' });

    handleForegroundPush(message(singleData()), deps);

    expect(store.getState().notificationsLive.banner).toBeNull();
  });

  test('signed out: nothing', () => {
    store.dispatch(sessionEnded());
    handleForegroundPush(message(singleData()), deps);
    expect(dispatched).toEqual([]);
  });
});
