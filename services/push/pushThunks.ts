import { createAsyncThunk } from '@reduxjs/toolkit';
import type { PushPermission } from '@/slices/push.slice';
import { pushDeps } from './deps';
import {
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
