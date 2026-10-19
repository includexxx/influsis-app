import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { AppState } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react-native';
import { notificationsApi } from '@/services/notificationsApi';
import type { NotificationsSocketDeps } from '@/services/realtime/notificationsSocket';
import authReducer, { sessionEnded, sessionEstablished } from '@/slices/auth.slice';
import notificationsLive from '@/slices/notificationsLive.slice';
import { AuthAccount, NotificationItem } from '@/types';
import {
  REALTIME_APPSTATE_DEBOUNCE_MS,
  useRealtimeNotifications,
} from './useRealtimeNotifications';

jest.mock('@/utils/config', () => ({
  __esModule: true,
  default: { apiUrl: 'http://api.test:3000/api/v1', env: 'dev' },
}));

const mockConfig = jest.requireMock<{ default: { apiUrl: string } }>('@/utils/config').default;

jest.mock('socket.io-client', () => ({ io: jest.fn() }));

const mockStart = jest.fn();
const mockStop = jest.fn();
let mockDeps: NotificationsSocketDeps | undefined;

jest.mock('@/services/realtime/notificationsSocket', () => ({
  createNotificationsSocket: (deps: NotificationsSocketDeps) => {
    mockDeps = deps;
    return { start: mockStart, stop: mockStop };
  },
}));

type AppStateHandler = (state: string) => void;
let appStateHandlers: AppStateHandler[];

function setAppState(state: string) {
  act(() => appStateHandlers.forEach(handler => handler(state)));
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

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

const account = { id: 'u-1', email: 'c@influsis.test' } as AuthAccount;

beforeEach(() => {
  jest.useFakeTimers();
  mockStart.mockReset();
  mockStop.mockReset();
  mockDeps = undefined;
  store = makeStore();
  appStateHandlers = [];
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((
    _: string,
    handler: AppStateHandler,
  ) => {
    appStateHandlers.push(handler);
    return { remove: jest.fn() };
  }) as never);
});

afterEach(() => {
  store.dispatch(notificationsApi.util.resetApiState());
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useRealtimeNotifications', () => {
  test('builds the socket for the /realtime namespace with the shared refresh and language', () => {
    renderHook(() => useRealtimeNotifications(), { wrapper });

    expect(mockDeps?.url).toBe('http://api.test:3000/realtime');
    expect(mockDeps?.lang).toBe('en');
  });

  test('a missing API_URL skips realtime instead of crashing', () => {
    mockConfig.apiUrl = '';
    try {
      store.dispatch(sessionEstablished(account));
      renderHook(() => useRealtimeNotifications(), { wrapper });
      advance(REALTIME_APPSTATE_DEBOUNCE_MS * 2);

      expect(mockDeps).toBeUndefined();
      expect(mockStart).not.toHaveBeenCalled();
    } finally {
      mockConfig.apiUrl = 'http://api.test:3000/api/v1';
    }
  });

  test('does not connect while signed out', () => {
    renderHook(() => useRealtimeNotifications(), { wrapper });
    advance(REALTIME_APPSTATE_DEBOUNCE_MS * 5);

    expect(mockStart).not.toHaveBeenCalled();
  });

  test('connects once, 1 s after signed in and in the foreground', () => {
    store.dispatch(sessionEstablished(account));
    renderHook(() => useRealtimeNotifications(), { wrapper });

    advance(REALTIME_APPSTATE_DEBOUNCE_MS - 1);
    expect(mockStart).not.toHaveBeenCalled();
    advance(1);
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  test('a background/foreground flap within 1 s neither stops nor reopens the socket', () => {
    store.dispatch(sessionEstablished(account));
    renderHook(() => useRealtimeNotifications(), { wrapper });
    advance(REALTIME_APPSTATE_DEBOUNCE_MS);
    mockStart.mockClear();

    setAppState('background');
    advance(REALTIME_APPSTATE_DEBOUNCE_MS / 2);
    setAppState('active');
    advance(REALTIME_APPSTATE_DEBOUNCE_MS * 2);

    expect(mockStop).not.toHaveBeenCalled();
    // start() on an open socket is a no-op in the manager.
    expect(mockStart.mock.calls.length).toBeLessThanOrEqual(1);
  });

  test('staying in the background past 1 s stops the socket; coming back starts it', () => {
    store.dispatch(sessionEstablished(account));
    renderHook(() => useRealtimeNotifications(), { wrapper });
    advance(REALTIME_APPSTATE_DEBOUNCE_MS);

    setAppState('background');
    advance(REALTIME_APPSTATE_DEBOUNCE_MS);
    expect(mockStop).toHaveBeenCalledTimes(1);

    setAppState('active');
    advance(REALTIME_APPSTATE_DEBOUNCE_MS);
    expect(mockStart).toHaveBeenCalledTimes(2);
  });

  test('iOS inactive does not close the socket', () => {
    store.dispatch(sessionEstablished(account));
    renderHook(() => useRealtimeNotifications(), { wrapper });
    advance(REALTIME_APPSTATE_DEBOUNCE_MS);

    setAppState('inactive');
    advance(REALTIME_APPSTATE_DEBOUNCE_MS * 3);

    expect(mockStop).not.toHaveBeenCalled();
  });

  test('sign-out stops the socket at once, with no debounce', () => {
    store.dispatch(sessionEstablished(account));
    renderHook(() => useRealtimeNotifications(), { wrapper });
    advance(REALTIME_APPSTATE_DEBOUNCE_MS);

    act(() => {
      store.dispatch(sessionEnded());
    });

    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  test('the callbacks update the store', () => {
    store.dispatch(sessionEstablished(account));
    renderHook(() => useRealtimeNotifications(), { wrapper });
    const item = {
      id: 'n-1',
      urgency: 'high',
      createdAt: '2026-10-17T09:00:00.000Z',
    } as NotificationItem;

    act(() => {
      mockDeps?.onNew(item);
      mockDeps?.onRead({ ids: ['n-1'] });
      mockDeps?.onResync();
      mockDeps?.onConnectionChange(true);
    });

    const state = store.getState();
    expect(state.notificationsLive.incoming[0].id).toBe('n-1');
    expect(state.notificationsLive.banner?.id).toBe('n-1');
    expect(state.notificationsLive.read.readIds['n-1']).toBeDefined();
    expect(state.notificationsLive.resyncCount).toBe(1);
    expect(state.notificationsLive.connected).toBe(true);
  });

  test('a socket unread count overwrites the NT2 cache', async () => {
    renderHook(() => useRealtimeNotifications(), { wrapper });

    await act(async () => {
      mockDeps?.onUnreadCount(7);
      await jest.advanceTimersByTimeAsync(10);
    });

    expect(notificationsApi.endpoints.getUnreadCount.select()(store.getState()).data).toEqual({
      count: 7,
    });
  });

  test('onSignOut ends the session', async () => {
    store.dispatch(sessionEstablished(account));
    renderHook(() => useRealtimeNotifications(), { wrapper });

    await act(async () => {
      mockDeps?.onSignOut();
      await jest.advanceTimersByTimeAsync(10);
    });

    expect(store.getState().auth.status).toBe('unauthenticated');
  });
});
