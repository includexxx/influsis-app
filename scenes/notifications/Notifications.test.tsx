import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { request } from '@/services/http';
import { notificationsApi } from '@/services/notificationsApi';
import authReducer, { sessionEstablished } from '@/slices/auth.slice';
import notificationsLive, {
  notificationReceived,
  notificationsReadReceived,
  resyncRequested,
} from '@/slices/notificationsLive.slice';
import { AuthAccount, NotificationItem } from '@/types';
import Notifications from './Notifications';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
}));

jest.mock('@/services/http', () => {
  class ApiError extends Error {
    code: string;
    statusCode: number;
    constructor(body: { code?: string; statusCode: number; message?: string }) {
      super(body.message ?? 'api error');
      this.name = 'ApiError';
      this.code = body.code ?? 'UNKNOWN';
      this.statusCode = body.statusCode;
    }
  }
  return { __esModule: true, request: jest.fn(), ApiError };
});

const { ApiError } = jest.requireMock<{ ApiError: new (b: object) => Error }>('@/services/http');
const mockRequest = request as jest.MockedFunction<typeof request>;
type RequestConfig = {
  url: string;
  method?: string;
  params?: { page: number; unread?: boolean; before?: string };
  data?: { before?: string };
};

function answerWith(handler: (cfg: RequestConfig) => unknown) {
  mockRequest.mockImplementation((async (cfg: unknown) =>
    handler(cfg as RequestConfig)) as typeof request);
}

function calls(url: string) {
  return mockRequest.mock.calls.map(([cfg]) => cfg as RequestConfig).filter(cfg => cfg.url === url);
}

function item(overrides: Partial<NotificationItem>): NotificationItem {
  return {
    id: 'n-1',
    eventType: 'engagement.accepted',
    category: 'engagement',
    urgency: 'high',
    title: 'Offer accepted',
    body: 'Rafiul accepted the offer for "Eid Collection".',
    target: { type: 'engagement', id: 'eng-1', params: { campaignId: 'c-1' } },
    readAt: null,
    resolvedAt: null,
    createdAt: '2026-10-17T09:30:00.000Z',
    ...overrides,
  };
}

const accepted = item({});
const changes = item({
  id: 'n-2',
  eventType: 'delivery.changes_requested',
  category: 'delivery',
  title: 'Changes requested',
  body: 'Update your draft.',
  target: { type: 'delivery', id: 'eng-2', params: {} },
  createdAt: '2026-10-17T08:00:00.000Z',
  readAt: '2026-10-17T08:10:00.000Z',
});

// Serves the feed by `unread`; NT3/NT4 succeed.
function serveFeed(all: NotificationItem[] | Error, unread: NotificationItem[] = []) {
  answerWith(cfg => {
    if (cfg.url === '/notifications') {
      if (cfg.params?.unread) return unread;
      if (all instanceof Error) throw all;
      return all;
    }
    if (cfg.url === '/notifications/read-all') return { updated: 1 };
    if (cfg.url === '/notifications/unread-count') return { count: 0 };
    return { id: 'n-1', readAt: '2026-10-17T10:00:00.000Z' };
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

function renderScreen() {
  return render(<Notifications />, { wrapper });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockPush.mockReset();
  mockRequest.mockReset();
  store = makeStore();
  store.dispatch(sessionEstablished({ id: 'u-1', email: 'c@influsis.test' } as AuthAccount));
});

afterEach(() => {
  store.dispatch(notificationsApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<Notifications />', () => {
  test('shows the skeleton, then the feed with unread items marked', async () => {
    serveFeed([accepted, changes]);
    renderScreen();

    expect(screen.getByTestId('notifications-loading')).toBeTruthy();
    expect(await screen.findByText('Offer accepted')).toBeTruthy();
    expect(screen.getByText('Changes requested')).toBeTruthy();
    expect(screen.getByLabelText(/^Unread, Offer accepted/)).toBeTruthy();
    expect(screen.getByLabelText(/^Changes requested/)).toBeTruthy();
  });

  test('says so when there are no notifications', async () => {
    serveFeed([]);
    renderScreen();

    expect(await screen.findByText('No notifications yet')).toBeTruthy();
    expect(screen.queryByTestId('notifications-mark-all')).toBeNull();
  });

  test('the Unread tab asks for unread only and has its own empty state', async () => {
    serveFeed([changes], []);
    renderScreen();
    await screen.findByText('Changes requested');

    fireEvent.press(screen.getByTestId('applications-tab-unread'));

    expect(await screen.findByText("You're all caught up")).toBeTruthy();
    expect(calls('/notifications').some(cfg => cfg.params?.unread === true)).toBe(true);
  });

  test('a failed first load shows the error state, and Try again reloads', async () => {
    serveFeed(new ApiError({ code: 'NETWORK_ERROR', statusCode: 0, message: 'offline' }));
    renderScreen();

    expect(await screen.findByText("Couldn't load notifications")).toBeTruthy();

    serveFeed([accepted]);
    fireEvent.press(screen.getByText('Try again'));

    expect(await screen.findByText('Offer accepted')).toBeTruthy();
  });

  test('a tap marks the item read and opens its mapped route', async () => {
    serveFeed([accepted, changes]);
    renderScreen();

    fireEvent.press(await screen.findByTestId('notification-n-1'));

    expect(mockPush).toHaveBeenCalledWith('/engagement/eng-1');
    expect(screen.getByLabelText(/^Offer accepted/)).toBeTruthy();
    await waitFor(() => expect(calls('/notifications/n-1/read')).toHaveLength(1));
  });

  test('tapping an already-read item opens it without marking it again', async () => {
    serveFeed([accepted, changes]);
    renderScreen();

    fireEvent.press(await screen.findByTestId('notification-n-2'));

    expect(mockPush).toHaveBeenCalledWith('/engagement/eng-2/submit-delivery');
    expect(calls('/notifications/n-2/read')).toHaveLength(0);
  });

  test('Mark all as read sends the newest createdAt on screen and clears the unread marks', async () => {
    serveFeed([accepted, changes]);
    renderScreen();
    await screen.findByText('Offer accepted');

    await act(async () => {
      fireEvent.press(screen.getByTestId('notifications-mark-all'));
    });

    await waitFor(() => expect(calls('/notifications/read-all')).toHaveLength(1));
    expect(calls('/notifications/read-all')[0].data).toEqual({ before: accepted.createdAt });
    expect(screen.queryByLabelText(/^Unread,/)).toBeNull();
    expect(screen.queryByTestId('notifications-mark-all')).toBeNull();
  });

  describe('live updates (38b)', () => {
    test('a notification from the socket appears at the top', async () => {
      serveFeed([accepted, changes]);
      renderScreen();
      await screen.findByText('Offer accepted');

      act(() => {
        store.dispatch(
          notificationReceived(
            item({
              id: 'n-live',
              title: 'New campaign invitation',
              createdAt: '2026-10-17T10:00:00.000Z',
            }),
          ),
        );
      });

      const cards = screen.getAllByTestId(/^notification-n-/);
      expect(cards[0].props.testID).toBe('notification-n-live');
      expect(screen.getByLabelText(/^Unread, New campaign invitation/)).toBeTruthy();
    });

    test('a notification already on the page is not shown twice', async () => {
      serveFeed([accepted, changes]);
      renderScreen();
      await screen.findByText('Offer accepted');

      act(() => {
        store.dispatch(notificationReceived(accepted));
      });

      expect(screen.getAllByTestId('notification-n-1')).toHaveLength(1);
    });

    test('a read event from another device clears the unread mark', async () => {
      serveFeed([accepted, changes]);
      renderScreen();
      await screen.findByLabelText(/^Unread, Offer accepted/);

      act(() => {
        store.dispatch(notificationsReadReceived({ ids: ['n-1'] }));
      });

      expect(screen.queryByLabelText(/^Unread, Offer accepted/)).toBeNull();
      expect(screen.getByLabelText(/^Offer accepted/)).toBeTruthy();
    });

    test('a resync reloads page 1 without the before anchor', async () => {
      serveFeed([accepted, changes]);
      renderScreen();
      await screen.findByText('Offer accepted');
      const before = calls('/notifications').length;

      await act(async () => {
        store.dispatch(resyncRequested());
        await jest.advanceTimersByTimeAsync(10);
      });

      const reloads = calls('/notifications').slice(before);
      expect(reloads).toHaveLength(1);
      expect(reloads[0].params).toEqual(expect.objectContaining({ page: 1 }));
      expect(reloads[0].params?.before).toBeUndefined();
    });
  });
});
