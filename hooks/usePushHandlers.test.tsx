import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';
import authReducer, { sessionEstablished } from '@/slices/auth.slice';
import notificationsLive from '@/slices/notificationsLive.slice';
import { notificationsApi } from '@/services/notificationsApi';
import { getPushMessaging, PushMessage } from '@/services/push/messaging';
import { takeNotificationRoute } from '@/lib/notifications/pendingRoute';
import { AuthAccount } from '@/types';
import { usePushHandlers } from './usePushHandlers';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/services/push/messaging', () => ({ getPushMessaging: jest.fn() }));

type Listener = (message: PushMessage) => void;
let onMessage: Listener | undefined;
let onOpened: Listener | undefined;
let initial: PushMessage | null;
const offMessage = jest.fn();
const offOpened = jest.fn();

const fakeMessaging = {
  onMessage: jest.fn((l: Listener) => {
    onMessage = l;
    return offMessage;
  }),
  onNotificationOpenedApp: jest.fn((l: Listener) => {
    onOpened = l;
    return offOpened;
  }),
  getInitialNotification: jest.fn(async () => initial),
};

const messaging = getPushMessaging as unknown as jest.Mock<() => object | null>;
const push = router.push as jest.Mock;

const tap = (eventType: string, targetType: string): PushMessage => ({
  data: {
    kind: 'single',
    notificationId: 'n-1',
    eventType,
    urgency: 'high',
    targetType,
    targetId: 'e-1',
    targetParams: '{}',
  },
  notification: { title: 'Offer accepted', body: 'Terms are locked.' },
});

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

async function mount() {
  const hook = renderHook(() => usePushHandlers(), { wrapper });
  await act(async () => {
    await Promise.resolve();
  });
  return hook;
}

beforeEach(() => {
  jest.clearAllMocks();
  takeNotificationRoute();
  onMessage = undefined;
  onOpened = undefined;
  initial = null;
  messaging.mockReturnValue(fakeMessaging);
  store = makeStore();
});

describe('usePushHandlers', () => {
  test('subscribes to foreground and background-tap pushes, and unsubscribes', async () => {
    const { unmount } = await mount();
    expect(fakeMessaging.onMessage).toHaveBeenCalledTimes(1);
    expect(fakeMessaging.onNotificationOpenedApp).toHaveBeenCalledTimes(1);

    unmount();

    expect(offMessage).toHaveBeenCalled();
    expect(offOpened).toHaveBeenCalled();
  });

  test('a background tap while signed in opens its screen', async () => {
    store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
    await mount();

    act(() => onOpened?.(tap('engagement.accepted', 'engagement')));

    expect(push).toHaveBeenCalledWith('/engagement/e-1?n=n-1');
  });

  test('the cold-start tap is read once and held while the session restores', async () => {
    initial = tap('review.prompt', 'review');
    await mount();

    expect(fakeMessaging.getInitialNotification).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
    expect(takeNotificationRoute()).toBe('/engagement/e-1/review?n=n-1');
  });

  test('no cold-start tap: nothing held', async () => {
    await mount();
    expect(takeNotificationRoute()).toBeNull();
  });

  test('a foreground push is handled (banner for high urgency)', async () => {
    store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
    await mount();

    act(() => onMessage?.(tap('engagement.accepted', 'engagement')));

    expect(store.getState().notificationsLive.banner?.id).toBe('n-1');
  });

  test('no push in this build: subscribes to nothing', async () => {
    messaging.mockReturnValue(null);
    await mount();
    expect(fakeMessaging.onMessage).not.toHaveBeenCalled();
    expect(fakeMessaging.getInitialNotification).not.toHaveBeenCalled();
  });
});
