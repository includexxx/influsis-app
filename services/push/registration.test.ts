import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import type { UnknownAction } from '@reduxjs/toolkit';
import {
  availabilityChanged,
  deviceCleared,
  deviceRegistered,
  permissionChanged,
} from '@/slices/push.slice';
import { PUSH_AUTH_STATUS, PushMessaging } from './messaging';
import {
  AndroidPermissionResult,
  PushDeps,
  readPushPermission,
  registerDevice,
  REGISTER_INTERVAL_MS,
  requestPushPermission,
  StoredPushDevice,
  unregisterDevice,
} from './registration';

const NOW = Date.parse('2026-10-19T12:00:00.000Z');

function fakeMessaging(overrides: Partial<PushMessaging> = {}): PushMessaging {
  return {
    hasPermission: jest.fn(async () => PUSH_AUTH_STATUS.AUTHORIZED),
    requestPermission: jest.fn(async () => PUSH_AUTH_STATUS.AUTHORIZED),
    getToken: jest.fn(async () => 'fcm-token'),
    deleteToken: jest.fn(async () => undefined),
    onTokenRefresh: jest.fn(() => () => undefined),
    ...overrides,
  };
}

let stored: StoredPushDevice | null;
let messaging: PushMessaging | null;
let actions: UnknownAction[];
type RegisterBody = { token: string; platform: 'ios' | 'android' };
let deps: PushDeps & {
  api: {
    register: jest.Mock<(body: RegisterBody) => Promise<{ id: string }>>;
    remove: jest.Mock<(id: string) => Promise<void>>;
  };
  androidPermission: {
    check: jest.Mock<() => Promise<boolean>>;
    request: jest.Mock<() => Promise<AndroidPermissionResult>>;
  };
};

function makeDeps(os: 'ios' | 'android' = 'ios', androidApiLevel = 34) {
  return {
    messaging: () => messaging,
    os,
    androidApiLevel,
    androidPermission: {
      check: jest.fn(async () => true),
      request: jest.fn(async () => 'granted'),
    },
    storage: {
      get: async () => stored,
      set: async (device: StoredPushDevice) => {
        stored = device;
      },
      remove: async () => {
        stored = null;
      },
    },
    api: {
      register: jest.fn(async () => ({ id: 'dev-1' })),
      remove: jest.fn(async () => undefined),
    },
    dispatch: (action: UnknownAction) => actions.push(action),
    userId: () => 'u-1',
    now: () => NOW,
  } as unknown as typeof deps;
}

beforeEach(() => {
  stored = null;
  messaging = fakeMessaging();
  actions = [];
  deps = makeDeps();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('registerDevice', () => {
  test('registers: NT7 with the token and platform, stores and records the device', async () => {
    await expect(registerDevice(deps, { force: false })).resolves.toBe('registered');

    expect(deps.api.register).toHaveBeenCalledWith({ token: 'fcm-token', platform: 'ios' });
    expect(stored).toEqual({
      deviceId: 'dev-1',
      userId: 'u-1',
      registeredAt: new Date(NOW).toISOString(),
    });
    expect(actions).toContainEqual(availabilityChanged('available'));
    expect(actions).toContainEqual(deviceRegistered('dev-1'));
  });

  test('Android sends platform android', async () => {
    deps = makeDeps('android');
    await registerDevice(deps, { force: true });
    expect(deps.api.register).toHaveBeenCalledWith({ token: 'fcm-token', platform: 'android' });
  });

  test('no push in this build: unavailable, no NT7', async () => {
    messaging = null;
    await expect(registerDevice(deps, { force: true })).resolves.toBe('unavailable');
    expect(actions).toContainEqual(availabilityChanged('unavailable'));
    expect(deps.api.register).not.toHaveBeenCalled();
  });

  test.each([PUSH_AUTH_STATUS.NOT_DETERMINED, PUSH_AUTH_STATUS.DENIED])(
    'iOS permission %i: no NT7',
    async status => {
      messaging = fakeMessaging({ hasPermission: jest.fn(async () => status) });
      await expect(registerDevice(deps, { force: true })).resolves.toBe('no-permission');
      expect(deps.api.register).not.toHaveBeenCalled();
    },
  );

  test('iOS provisional counts as granted', async () => {
    messaging = fakeMessaging({ hasPermission: jest.fn(async () => PUSH_AUTH_STATUS.PROVISIONAL) });
    await expect(registerDevice(deps, { force: true })).resolves.toBe('registered');
    expect(actions).toContainEqual(permissionChanged('provisional'));
  });

  test('Android 13+ without POST_NOTIFICATIONS: no NT7', async () => {
    deps = makeDeps('android', 33);
    deps.androidPermission.check.mockResolvedValue(false);
    await expect(registerDevice(deps, { force: true })).resolves.toBe('no-permission');
  });

  test('Android below 13 is granted at install', async () => {
    deps = makeDeps('android', 31);
    deps.androidPermission.check.mockResolvedValue(false);
    await expect(registerDevice(deps, { force: true })).resolves.toBe('registered');
    expect(deps.androidPermission.check).not.toHaveBeenCalled();
  });

  describe('the once-a-day throttle', () => {
    const recently = (userId: string, ageMs: number): StoredPushDevice => ({
      deviceId: 'dev-0',
      userId,
      registeredAt: new Date(NOW - ageMs).toISOString(),
    });

    test('skips within 24 h for the same user', async () => {
      stored = recently('u-1', REGISTER_INTERVAL_MS - 1);
      await expect(registerDevice(deps, { force: false })).resolves.toBe('skipped');
      expect(deps.api.register).not.toHaveBeenCalled();
    });

    test('force (a sign-in) registers anyway', async () => {
      stored = recently('u-1', 1_000);
      await expect(registerDevice(deps, { force: true })).resolves.toBe('registered');
    });

    test('registers for another user', async () => {
      stored = recently('u-2', 1_000);
      await expect(registerDevice(deps, { force: false })).resolves.toBe('registered');
    });

    test('registers after 24 h', async () => {
      stored = recently('u-1', REGISTER_INTERVAL_MS);
      await expect(registerDevice(deps, { force: false })).resolves.toBe('registered');
    });
  });

  test('getToken failing (no Play Services, simulator): unavailable, no NT7, no retry', async () => {
    messaging = fakeMessaging({
      getToken: jest.fn(async () => {
        throw new Error('SERVICE_NOT_AVAILABLE');
      }),
    });
    await expect(registerDevice(deps, { force: true })).resolves.toBe('unavailable');
    expect(actions).toContainEqual(availabilityChanged('unavailable'));
    expect(deps.api.register).not.toHaveBeenCalled();
    expect(messaging.getToken).toHaveBeenCalledTimes(1);
  });

  test('a failing NT7 stores nothing and reports failed', async () => {
    deps.api.register.mockRejectedValue(new Error('422'));
    await expect(registerDevice(deps, { force: true })).resolves.toBe('failed');
    expect(stored).toBeNull();
  });

  test('signed out: nothing is sent', async () => {
    deps.userId = () => undefined;
    await expect(registerDevice(deps, { force: true })).resolves.toBe('skipped');
    expect(deps.api.register).not.toHaveBeenCalled();
  });
});

describe('permission', () => {
  test('readPushPermission on Android 13+ without the grant reads unknown and records nothing', async () => {
    deps = makeDeps('android', 33);
    deps.androidPermission.check.mockResolvedValue(false);
    await expect(readPushPermission(deps)).resolves.toBe('unknown');
    expect(actions).toEqual([]);
  });

  test.each([
    ['granted', 'granted'],
    ['denied', 'denied'],
    ['never_ask_again', 'blocked'],
  ])('Android 13+ request %s -> %s', async (answer, permission) => {
    deps = makeDeps('android', 33);
    deps.androidPermission.request.mockResolvedValue(answer as AndroidPermissionResult);
    await expect(requestPushPermission(deps)).resolves.toBe(permission);
    expect(actions).toContainEqual(permissionChanged(permission as never));
  });

  test('iOS request maps the authorization status', async () => {
    messaging = fakeMessaging({ requestPermission: jest.fn(async () => PUSH_AUTH_STATUS.DENIED) });
    await expect(requestPushPermission(deps)).resolves.toBe('denied');
  });

  test('no push: request does nothing', async () => {
    messaging = null;
    await expect(requestPushPermission(deps)).resolves.toBe('unknown');
    expect(actions).toEqual([]);
  });
});

describe('unregisterDevice', () => {
  test('NT8 for the stored device, then deleteToken, then forgets it', async () => {
    stored = { deviceId: 'dev-1', userId: 'u-1', registeredAt: new Date(NOW).toISOString() };

    await unregisterDevice(deps);

    expect(deps.api.remove).toHaveBeenCalledWith('dev-1');
    expect(messaging!.deleteToken).toHaveBeenCalled();
    expect(stored).toBeNull();
    expect(actions).toContainEqual(deviceCleared());
  });

  test('an NT8 failure (404 or otherwise) still deletes the token', async () => {
    stored = { deviceId: 'dev-1', userId: 'u-1', registeredAt: new Date(NOW).toISOString() };
    deps.api.remove.mockRejectedValue(Object.assign(new Error('gone'), { statusCode: 404 }));

    await unregisterDevice(deps);

    expect(messaging!.deleteToken).toHaveBeenCalled();
    expect(stored).toBeNull();
  });

  test('a hanging NT8 never holds logout past the timeout', async () => {
    jest.useFakeTimers();
    stored = { deviceId: 'dev-1', userId: 'u-1', registeredAt: new Date(NOW).toISOString() };
    deps.api.remove.mockImplementation(() => new Promise(() => undefined));

    const done = jest.fn();
    void unregisterDevice(deps, { timeoutMs: 2_000 }).then(done);

    await jest.advanceTimersByTimeAsync(1_999);
    expect(done).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalled();
    expect(stored).toBeNull();
  });

  test('no stored device: only deleteToken', async () => {
    await unregisterDevice(deps);
    expect(deps.api.remove).not.toHaveBeenCalled();
    expect(messaging!.deleteToken).toHaveBeenCalled();
  });

  test('no push in this build: nothing native, still resolves', async () => {
    messaging = null;
    await expect(unregisterDevice(deps)).resolves.toBeUndefined();
  });
});
