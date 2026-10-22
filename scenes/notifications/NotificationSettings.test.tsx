import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { request } from '@/services/http';
import { notificationsApi } from '@/services/notificationsApi';
import authReducer, { sessionEstablished } from '@/slices/auth.slice';
import { AuthAccount, NotificationPreference } from '@/types';
import type { PushDeviceState } from './hooks/usePushDeviceSwitch';
import NotificationSettings, { LOCKED_NOTE } from './NotificationSettings';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

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

// The device switch has its own test (hooks/usePushDeviceSwitch.test.tsx);
// here it is driven directly.
let mockDevice: { state: PushDeviceState; busy: boolean };
const mockToggleDevice = jest.fn(async () => undefined);
const mockOpenSettings = jest.fn();
jest.mock('./hooks/usePushDeviceSwitch', () => ({
  usePushDeviceSwitch: () => ({
    ...mockDevice,
    toggle: mockToggleDevice,
    openSettings: mockOpenSettings,
  }),
}));

const { ApiError } = jest.requireMock<{ ApiError: new (b: object) => Error }>('@/services/http');
const mockRequest = request as jest.MockedFunction<typeof request>;
type RequestConfig = {
  url: string;
  method?: string;
  data?: { email?: Record<string, boolean>; push?: Record<string, boolean> };
};

function pref(
  category: string,
  email: boolean,
  push: boolean | null,
  locked: string[] = [],
): NotificationPreference {
  return {
    category,
    inApp: { enabled: true, locked: true },
    email: { enabled: email, lockedEvents: locked, optionalEvents: ['x'] },
    push: push === null ? null : { enabled: push, lockedEvents: locked, optionalEvents: ['x'] },
  };
}

const PREFS = [
  pref('engagement', true, true, ['engagement.accepted']),
  pref('offer', true, true),
  pref('review', false, false),
  // account.suspended is email-only; here account has no push block at all
  pref('account', true, null),
];

function answerWith(handler: (cfg: RequestConfig) => unknown) {
  mockRequest.mockImplementation((async (cfg: unknown) =>
    handler(cfg as RequestConfig)) as typeof request);
}

const calls = (method: string) =>
  mockRequest.mock.calls
    .map(([c]) => c as RequestConfig)
    .filter(c => (c.method ?? 'GET') === method);

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

function signIn(emailVerified: boolean) {
  store.dispatch(
    sessionEstablished({ id: 'u-1', email: 'c@influsis.test', emailVerified } as AuthAccount),
  );
}

const checked = (label: string) =>
  (screen.getByLabelText(label).props.accessibilityState as { checked?: boolean }).checked;

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
  mockToggleDevice.mockClear();
  mockOpenSettings.mockClear();
  mockDevice = { state: 'off', busy: false };
  store = makeStore();
});

afterEach(() => {
  store.dispatch(notificationsApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<NotificationSettings />', () => {
  describe('email (38c)', () => {
    test('lists the email toggles in NT5 order with labels and the locked note', async () => {
      signIn(true);
      answerWith(() => PREFS);
      render(<NotificationSettings />, { wrapper });

      await screen.findByLabelText('Email for Offers');
      const rows = screen.getAllByTestId(/^email-row-/).map(r => r.props.testID);
      expect(rows).toEqual([
        'email-row-engagement',
        'email-row-offer',
        'email-row-review',
        'email-row-account',
      ]);
      expect(
        within(screen.getByTestId('email-row-engagement')).getByText(
          `New invitations and declined requests. ${LOCKED_NOTE}`,
        ),
      ).toBeTruthy();
      expect(screen.getByText('In-app notifications are always on.')).toBeTruthy();
      expect(checked('Email for Reviews')).toBe(false);
    });

    test('a toggle switches at once and saves just that category', async () => {
      signIn(true);
      answerWith(cfg =>
        cfg.method === 'PATCH' ? [PREFS[0], pref('offer', false, true), PREFS[2], PREFS[3]] : PREFS,
      );
      render(<NotificationSettings />, { wrapper });
      await screen.findByLabelText('Email for Offers');

      fireEvent.press(screen.getByLabelText('Email for Offers'));

      expect(checked('Email for Offers')).toBe(false);
      await waitFor(() => expect(calls('PATCH')).toHaveLength(1));
      expect(calls('PATCH')[0]).toEqual(
        expect.objectContaining({
          url: '/notifications/preferences',
          data: { email: { offer: false } },
        }),
      );
    });

    test('a failed save puts the toggle back and says so', async () => {
      signIn(true);
      answerWith(cfg => {
        if (cfg.method === 'PATCH') {
          throw new ApiError({ code: 'INTERNAL_ERROR', statusCode: 500, message: 'boom' });
        }
        return PREFS;
      });
      render(<NotificationSettings />, { wrapper });
      await screen.findByLabelText('Email for Offers');

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Email for Offers'));
        await jest.advanceTimersByTimeAsync(10);
      });

      expect(await screen.findByText("Couldn't save your email settings. Try again.")).toBeTruthy();
      expect(checked('Email for Offers')).toBe(true);
    });

    test('without a verified email: the notice instead of Email toggles, Push still there', async () => {
      signIn(false);
      answerWith(() => PREFS);
      render(<NotificationSettings />, { wrapper });

      expect(
        await screen.findByText('Add an email to get important updates when the app is closed.'),
      ).toBeTruthy();
      expect(await screen.findByLabelText('Push for Offers')).toBeTruthy();
      expect(screen.queryByTestId(/^email-row-/)).toBeNull();
    });
  });

  describe('loading and errors', () => {
    test('loading, then one error with retry for both sections', async () => {
      signIn(true);
      let fail = true;
      answerWith(() => {
        if (fail) throw new ApiError({ code: 'NETWORK_ERROR', statusCode: 0, message: 'offline' });
        return PREFS;
      });
      render(<NotificationSettings />, { wrapper });

      expect(screen.getByTestId('notification-settings-loading')).toBeTruthy();
      expect(await screen.findAllByText("Couldn't load your settings")).toHaveLength(1);

      fail = false;
      fireEvent.press(screen.getByText('Try again'));

      expect(await screen.findByLabelText('Email for Offers')).toBeTruthy();
      expect(screen.getByLabelText('Push for Offers')).toBeTruthy();
    });

    test('says so when a channel has no settings', async () => {
      signIn(true);
      answerWith(() => [pref('account', true, null)]);
      render(<NotificationSettings />, { wrapper });

      expect(await screen.findByText('There are no push settings for your account.')).toBeTruthy();
    });
  });

  describe('push (38e3)', () => {
    test('one Push toggle per category with a push block, with the locked note', async () => {
      signIn(true);
      answerWith(() => PREFS);
      render(<NotificationSettings />, { wrapper });

      await screen.findByLabelText('Push for Offers');
      const rows = screen.getAllByTestId(/^push-row-/).map(r => r.props.testID);
      expect(rows).toEqual(['push-row-engagement', 'push-row-offer', 'push-row-review']);
      expect(
        within(screen.getByTestId('push-row-engagement')).getByText(
          `New invitations and declined requests. ${LOCKED_NOTE}`,
        ),
      ).toBeTruthy();
      expect(checked('Push for Reviews')).toBe(false);
    });

    test('a Push toggle saves on the push channel only', async () => {
      signIn(true);
      answerWith(cfg =>
        cfg.method === 'PATCH' ? [PREFS[0], pref('offer', true, false), PREFS[2], PREFS[3]] : PREFS,
      );
      render(<NotificationSettings />, { wrapper });
      await screen.findByLabelText('Push for Offers');

      fireEvent.press(screen.getByLabelText('Push for Offers'));

      expect(checked('Push for Offers')).toBe(false);
      await waitFor(() => expect(calls('PATCH')).toHaveLength(1));
      expect(calls('PATCH')[0].data).toEqual({ push: { offer: false } });
      expect(checked('Email for Offers')).toBe(true);
    });

    test.each<[PushDeviceState, boolean]>([
      ['on', true],
      ['off', false],
    ])('device switch %s: shows it and toggles', async (state, on) => {
      mockDevice = { state, busy: false };
      signIn(true);
      answerWith(() => PREFS);
      render(<NotificationSettings />, { wrapper });
      await screen.findByLabelText('Push for Offers');

      expect(checked('Push on this device')).toBe(on);
      await act(async () => {
        fireEvent.press(screen.getByLabelText('Push on this device'));
      });

      expect(mockToggleDevice).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('push-device-blocked')).toBeNull();
      expect(screen.queryByTestId('push-device-unavailable')).toBeNull();
    });

    test('blocked by the OS: says so and links to the phone settings', async () => {
      mockDevice = { state: 'blocked', busy: false };
      signIn(true);
      answerWith(() => PREFS);
      render(<NotificationSettings />, { wrapper });

      expect(await screen.findByText('Turned off in your phone settings')).toBeTruthy();
      fireEvent.press(screen.getByText('Open settings'));
      expect(mockOpenSettings).toHaveBeenCalled();
      expect(checked('Push on this device')).toBe(false);
      expect(screen.getByLabelText('Push on this device').props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true }),
      );
    });

    test('unavailable: says so, and the account-wide Push toggles still show', async () => {
      mockDevice = { state: 'unavailable', busy: false };
      signIn(true);
      answerWith(() => PREFS);
      render(<NotificationSettings />, { wrapper });

      expect(await screen.findByLabelText('Push for Offers')).toBeTruthy();
      expect(screen.getByText('Push unavailable on this device')).toBeTruthy();
      expect(screen.getByLabelText('Push on this device').props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true }),
      );
    });
  });
});
