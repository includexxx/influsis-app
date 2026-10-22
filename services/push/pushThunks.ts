import { createAsyncThunk } from '@reduxjs/toolkit';
import type { PushPermission } from '@/slices/push.slice';
import type { AuthState } from '@/slices/auth.slice';
import { pushDeps } from './deps';
import {
  readPushPermission,
  registerDevice,
  RegisterResult,
  requestPushPermission,
  unregisterDevice,
} from './registration';

/** NT7 for this device (sign-in: `force`; app start: once a day; token refresh: `force`). */
export const syncPushDevice = createAsyncThunk<RegisterResult, { force: boolean }>(
  'push/sync',
  ({ force }, { dispatch, getState }) => registerDevice(pushDeps(dispatch, getState), { force }),
);

/** Best-effort NT8 + deleteToken() before an explicit logout (at most ~2 s). */
export const releasePushDevice = createAsyncThunk<void, void>(
  'push/release',
  (_, { dispatch, getState }) => unregisterDevice(pushDeps(dispatch, getState)),
);

/** Shows the OS permission prompt; registers the device when granted. */
export const askPushPermission = createAsyncThunk<
  { permission: PushPermission; result: RegisterResult | null },
  void
>('push/ask', async (_, { dispatch, getState }) => {
  const deps = pushDeps(dispatch, getState);
  const permission = await requestPushPermission(deps);
  const granted = permission === 'granted' || permission === 'provisional';
  const result = granted ? await registerDevice(deps, { force: true }) : null;
  return { permission, result };
});

/** "Push on this device" switched on (38e3): forget the opt-out, ask the OS, register. */
export const enablePushOnDevice = createAsyncThunk<
  { permission: PushPermission; result: RegisterResult | null },
  void
>('push/enable', async (_, { dispatch, getState }) => {
  const deps = pushDeps(dispatch, getState);
  const userId = (getState() as { auth: AuthState }).auth.account?.id;
  if (userId) await deps.storage.setOptedOut(userId, false).catch(() => undefined);
  const permission = await requestPushPermission(deps);
  const granted = permission === 'granted' || permission === 'provisional';
  const result = granted ? await registerDevice(deps, { force: true }) : null;
  return { permission, result };
});

/**
 * "Push on this device" switched off (38e3): remember it for this creator on
 * this device, then NT8 + deleteToken(). Logging out (releasePushDevice) is
 * not this - it leaves the preference alone.
 */
export const disablePushOnDevice = createAsyncThunk<void, void>(
  'push/disable',
  async (_, { dispatch, getState }) => {
    const deps = pushDeps(dispatch, getState);
    const userId = (getState() as { auth: AuthState }).auth.account?.id;
    if (userId) await deps.storage.setOptedOut(userId, true).catch(() => undefined);
    await unregisterDevice(deps);
  },
);

/** Re-reads the OS permission (e.g. after the creator visits the phone settings). */
export const refreshPushPermission = createAsyncThunk<PushPermission, void>(
  'push/refreshPermission',
  (_, { dispatch, getState }) => readPushPermission(pushDeps(dispatch, getState)),
);
