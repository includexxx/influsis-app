import type { UnknownAction } from '@reduxjs/toolkit';
import {
  availabilityChanged,
  deviceCleared,
  deviceRegistered,
  permissionChanged,
  PushPermission,
} from '@/slices/push.slice';
import { PUSH_AUTH_STATUS, PushMessaging } from './messaging';

// Registering this device for push (backend NT7/NT8, build-plan 38e1). Pure
// logic over injected dependencies (services/push/deps.ts wires the real
// ones), so every rule is testable without native modules.
//
// - NT7 binds the FCM token to the current backend session, so it runs after
//   every sign-in (`force`); on app start it runs at most once a day per user.
// - getToken() can fail (no Play Services, simulator): push is then
//   "unavailable" on this device, with no retry loop.
// - NT8 before sign-out is best-effort: the server deletes the device on
//   sign-out anyway, so it never blocks logout.

export const REGISTER_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const UNREGISTER_TIMEOUT_MS = 2_000;

export interface StoredPushDevice {
  deviceId: string;
  userId: string;
  registeredAt: string;
}

export type AndroidPermissionResult = 'granted' | 'denied' | 'never_ask_again';

export interface PushDeps {
  messaging: () => PushMessaging | null;
  os: string;
  /** Android API level (Platform.Version); ignored on iOS. */
  androidApiLevel: number;
  androidPermission: {
    check: () => Promise<boolean>;
    request: () => Promise<AndroidPermissionResult>;
  };
  storage: {
    get: () => Promise<StoredPushDevice | null>;
    set: (device: StoredPushDevice) => Promise<void>;
    remove: () => Promise<void>;
    /** This user switched push off on this device (38e3). */
    isOptedOut: (userId: string) => Promise<boolean>;
    setOptedOut: (userId: string, optedOut: boolean) => Promise<void>;
  };
  api: {
    register: (body: { token: string; platform: 'ios' | 'android' }) => Promise<{ id: string }>;
    /** Resolves on success and on 404 (already gone). */
    remove: (id: string) => Promise<void>;
  };
  dispatch: (action: UnknownAction) => unknown;
  userId: () => string | undefined;
  now: () => number;
}

export type RegisterResult =
  | 'registered'
  | 'skipped'
  | 'opted-out'
  | 'no-permission'
  | 'unavailable'
  | 'failed';

/** Android 13 (API 33) added the POST_NOTIFICATIONS runtime permission. */
const needsAndroidRuntimePermission = (deps: PushDeps) =>
  deps.os === 'android' && deps.androidApiLevel >= 33;

function fromIosStatus(status: number): PushPermission {
  switch (status) {
    case PUSH_AUTH_STATUS.AUTHORIZED:
    case PUSH_AUTH_STATUS.EPHEMERAL:
      return 'granted';
    case PUSH_AUTH_STATUS.PROVISIONAL:
      return 'provisional';
    case PUSH_AUTH_STATUS.DENIED:
      return 'denied';
    default:
      return 'unknown';
  }
}

const isGranted = (permission: PushPermission) =>
  permission === 'granted' || permission === 'provisional';

/**
 * The OS permission without asking. On Android 13+ a missing grant can't be
 * told apart from "never asked", so it reads as `unknown` and is not
 * dispatched (a known `denied`/`blocked` stays as recorded).
 */
export async function readPushPermission(deps: PushDeps): Promise<PushPermission> {
  const messaging = deps.messaging();
  if (!messaging) return 'unknown';

  let permission: PushPermission;
  if (deps.os === 'ios') {
    permission = fromIosStatus(await messaging.hasPermission().catch(() => -1));
  } else if (needsAndroidRuntimePermission(deps)) {
    const granted = await deps.androidPermission.check().catch(() => false);
    if (!granted) return 'unknown';
    permission = 'granted';
  } else {
    permission = 'granted'; // granted at install below Android 13
  }
  deps.dispatch(permissionChanged(permission));
  return permission;
}

/** Shows the OS permission prompt and records the answer. */
export async function requestPushPermission(deps: PushDeps): Promise<PushPermission> {
  const messaging = deps.messaging();
  if (!messaging) return 'unknown';

  let permission: PushPermission;
  if (deps.os === 'ios') {
    permission = fromIosStatus(await messaging.requestPermission().catch(() => -1));
  } else if (needsAndroidRuntimePermission(deps)) {
    const result = await deps.androidPermission.request().catch(() => 'denied' as const);
    permission =
      result === 'granted' ? 'granted' : result === 'never_ask_again' ? 'blocked' : 'denied';
  } else {
    permission = 'granted';
  }
  deps.dispatch(permissionChanged(permission));
  return permission;
}

/**
 * NT7 for this device. `force` skips the once-a-day throttle (every sign-in
 * is a new session the device must be bound to).
 */
export async function registerDevice(
  deps: PushDeps,
  { force }: { force: boolean },
): Promise<RegisterResult> {
  const messaging = deps.messaging();
  if (!messaging) {
    deps.dispatch(availabilityChanged('unavailable'));
    return 'unavailable';
  }
  if (!isGranted(await readPushPermission(deps))) return 'no-permission';

  const userId = deps.userId();
  if (!userId) return 'skipped';
  // Switched off on this device: nothing registers it again, not even a
  // sign-in, until the creator switches it back on (38e3).
  if (await deps.storage.isOptedOut(userId).catch(() => false)) return 'opted-out';

  if (!force) {
    const stored = await deps.storage.get().catch(() => null);
    const at = stored ? Date.parse(stored.registeredAt) : NaN;
    if (stored?.userId === userId && deps.now() - at < REGISTER_INTERVAL_MS) {
      // Still registered: let the settings switch know after a restart.
      deps.dispatch(deviceRegistered(stored.deviceId));
      return 'skipped';
    }
  }

  let token: string;
  try {
    token = await messaging.getToken();
  } catch {
    deps.dispatch(availabilityChanged('unavailable'));
    return 'unavailable';
  }
  deps.dispatch(availabilityChanged('available'));

  try {
    const { id } = await deps.api.register({
      token,
      platform: deps.os === 'ios' ? 'ios' : 'android',
    });
    await deps.storage
      .set({ deviceId: id, userId, registeredAt: new Date(deps.now()).toISOString() })
      .catch(() => undefined);
    deps.dispatch(deviceRegistered(id));
    return 'registered';
  } catch {
    // Retried at the next trigger (start, sign-in, token refresh).
    return 'failed';
  }
}

const within = <T>(promise: Promise<T>, ms: number) =>
  Promise.race([promise.catch(() => undefined), new Promise(resolve => setTimeout(resolve, ms))]);

/** NT8 + deleteToken() before sign-out. Never throws, never takes much longer than `timeoutMs`. */
export async function unregisterDevice(
  deps: PushDeps,
  { timeoutMs = UNREGISTER_TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<void> {
  const stored = await deps.storage.get().catch(() => null);
  const messaging = deps.messaging();
  await within(
    (async () => {
      if (stored?.deviceId) await deps.api.remove(stored.deviceId).catch(() => undefined);
      if (messaging) await messaging.deleteToken().catch(() => undefined);
    })(),
    timeoutMs,
  );
  await deps.storage.remove().catch(() => undefined);
  deps.dispatch(deviceCleared());
}
