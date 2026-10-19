import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { httpClient } from '@/services/http';
import { notificationsApi } from '@/services/notificationsApi';
import { NotificationPreference } from '@/types';
import { EMAIL_SAVE_ERROR, useEmailPreferences } from './useEmailPreferences';

const CATEGORIES = ['engagement', 'offer', 'delivery', 'review', 'account'];

// The fake server's email toggles.
let server: Record<string, boolean>;
let failWith: { status: number; code: string; message: string } | null;
// PATCHes are held until released, to drive the "in flight" cases.
let pending: (() => void)[];
let holdPatches: boolean;
let adapter: jest.Mock<(config: InternalAxiosRequestConfig) => Promise<unknown>>;

function prefs(): NotificationPreference[] {
  return CATEGORIES.map(category => ({
    category,
    inApp: { enabled: true, locked: true },
    email: { enabled: server[category], lockedEvents: [], optionalEvents: ['x'] },
    push: null,
  }));
}

function respond(config: InternalAxiosRequestConfig) {
  if (failWith) {
    const { status, code, message } = failWith;
    const response = {
      data: { success: false, code, statusCode: status, message, errors: null },
      status,
      statusText: '',
      headers: {},
      config,
    };
    return Promise.reject(new AxiosError('err', 'ERR_BAD_RESPONSE', config, {}, response));
  }
  if (config.method === 'patch') {
    const { email } = JSON.parse(String(config.data)) as { email: Record<string, boolean> };
    server = { ...server, ...email };
  }
  return Promise.resolve({
    data: { success: true, statusCode: 200, message: 'ok', data: prefs(), meta: null },
    status: 200,
    statusText: '',
    headers: {},
    config,
  });
}

function patchBodies() {
  return adapter.mock.calls
    .filter(([c]) => c.method === 'patch')
    .map(([c]) => JSON.parse(String(c.data)) as unknown);
}

async function settle() {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(10);
  });
}

async function releaseOne() {
  await act(async () => {
    pending.shift()?.();
    await jest.advanceTimersByTimeAsync(10);
  });
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

async function loaded() {
  const hook = renderHook(() => useEmailPreferences({ skip: false }), { wrapper });
  await waitFor(() => expect(hook.result.current.toggles).toHaveLength(CATEGORIES.length));
  return hook;
}

const enabledOf = (result: { current: ReturnType<typeof useEmailPreferences> }, category: string) =>
  result.current.toggles.find(t => t.category === category)?.enabled;

beforeEach(() => {
  jest.useFakeTimers();
  store = makeStore();
  server = Object.fromEntries(CATEGORIES.map(c => [c, true]));
  failWith = null;
  pending = [];
  holdPatches = false;
  adapter = jest.fn((config: InternalAxiosRequestConfig) => {
    if (config.method === 'patch' && holdPatches) {
      return new Promise(resolve => pending.push(() => resolve(respond(config))));
    }
    return respond(config);
  });
  httpClient.defaults.adapter = adapter as any;
});

afterEach(() => {
  store.dispatch(notificationsApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('useEmailPreferences', () => {
  test('loads the toggles in NT5 order', async () => {
    const { result } = await loaded();
    expect(result.current.toggles.map(t => t.category)).toEqual(CATEGORIES);
  });

  test('skip makes no request', async () => {
    renderHook(() => useEmailPreferences({ skip: true }), { wrapper });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });
    expect(adapter).not.toHaveBeenCalled();
  });

  test('a toggle shows at once and sends only that category', async () => {
    const { result } = await loaded();

    act(() => result.current.toggle('offer'));
    expect(enabledOf(result, 'offer')).toBe(false);

    await waitFor(() => expect(patchBodies()).toEqual([{ email: { offer: false } }]));
    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(enabledOf(result, 'offer')).toBe(false);
  });

  test('three quick taps while the first save is in flight end on the last state with one follow-up', async () => {
    holdPatches = true;
    const { result } = await loaded();

    act(() => result.current.toggle('offer')); // false -> sent
    act(() => result.current.toggle('offer')); // true
    act(() => result.current.toggle('offer')); // false
    await settle();
    expect(patchBodies()).toHaveLength(1);
    expect(enabledOf(result, 'offer')).toBe(false);

    await releaseOne();
    // The server already has false, which is the last state: nothing more.
    expect(patchBodies()).toEqual([{ email: { offer: false } }]);
    await waitFor(() => expect(result.current.isSaving).toBe(false));
  });

  test('taps that return to the original value during a save are sent once it settles', async () => {
    holdPatches = true;
    const { result } = await loaded();

    act(() => result.current.toggle('offer')); // false -> sent
    act(() => result.current.toggle('offer')); // true (back to the original)
    await settle();

    await releaseOne(); // server now false; screen wants true
    expect(patchBodies()).toEqual([{ email: { offer: false } }, { email: { offer: true } }]);
    await releaseOne();
    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(server.offer).toBe(true);
    expect(enabledOf(result, 'offer')).toBe(true);
  });

  test('changes to two categories during a save go out together', async () => {
    holdPatches = true;
    const { result } = await loaded();

    act(() => result.current.toggle('offer'));
    act(() => result.current.toggle('review'));
    act(() => result.current.toggle('account'));
    await settle();
    expect(patchBodies()).toEqual([{ email: { offer: false } }]);

    await releaseOne();
    expect(patchBodies()[1]).toEqual({ email: { review: false, account: false } });
    await releaseOne();
    await waitFor(() => expect(result.current.isSaving).toBe(false));
  });

  test('a failed save reverts to the server value and reports it', async () => {
    const { result } = await loaded();
    failWith = { status: 500, code: 'INTERNAL_ERROR', message: 'boom' };

    act(() => result.current.toggle('offer'));
    expect(enabledOf(result, 'offer')).toBe(false);

    await waitFor(() => expect(result.current.saveError).toBe(EMAIL_SAVE_ERROR));
    expect(enabledOf(result, 'offer')).toBe(true);
  });

  test('a 422 shows the server message; the next toggle clears it', async () => {
    const { result } = await loaded();
    failWith = { status: 422, code: 'VALIDATION_FAILED', message: 'Unknown category.' };

    act(() => result.current.toggle('offer'));
    await waitFor(() => expect(result.current.saveError).toBe('Unknown category.'));

    failWith = null;
    act(() => result.current.toggle('review'));
    expect(result.current.saveError).toBeNull();
  });

  test('never sends an empty email object', async () => {
    const { result } = await loaded();
    act(() => result.current.toggle('offer'));
    act(() => result.current.toggle('offer'));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(50);
    });

    for (const body of patchBodies() as { email: object }[]) {
      expect(Object.keys(body.email).length).toBeGreaterThan(0);
    }
  });
});
