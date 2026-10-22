import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { usePushSlice } from '@/slices';
import { getPushMessaging } from '@/services/push/messaging';
import {
  disablePushOnDevice,
  enablePushOnDevice,
  refreshPushPermission,
} from '@/services/push/pushThunks';

/**
 * - `on`: this device is registered (NT7) and the OS allows notifications.
 * - `off`: not registered here (never turned on, or switched off - 38e3).
 * - `blocked`: the OS won't show notifications and can't be asked again
 *   (iOS denied, Android "don't ask again"): only the phone settings help.
 * - `unavailable`: no push in this build or on this platform, or getToken()
 *   failed (no Play Services, simulator).
 */
export type PushDeviceState = 'on' | 'off' | 'blocked' | 'unavailable';

export interface UsePushDeviceSwitchResult {
  state: PushDeviceState;
  busy: boolean;
  toggle: () => Promise<void>;
  openSettings: () => void;
}

// "Push on this device" (build-plan 38e3; backend CLIENT_INTEGRATION §6
// Settings). On: ask the OS, then NT7. Off: remember the choice, NT8 +
// deleteToken(). The OS permission is re-read on every return to the app, so
// a change made in the phone settings shows up.
export function usePushDeviceSwitch(): UsePushDeviceSwitchResult {
  const { permission, availability, deviceId, dispatch } = usePushSlice();
  const [busy, setBusy] = useState(false);
  const pushInThisBuild = getPushMessaging() !== null;

  let state: PushDeviceState;
  if (!pushInThisBuild || availability === 'unavailable') state = 'unavailable';
  else if (permission === 'blocked' || (permission === 'denied' && Platform.OS === 'ios')) {
    state = 'blocked';
  } else if (deviceId && (permission === 'granted' || permission === 'provisional')) state = 'on';
  else state = 'off';

  useEffect(() => {
    if (!pushInThisBuild) return;
    void dispatch(refreshPushPermission());
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') void dispatch(refreshPushPermission());
    });
    return () => subscription.remove();
  }, [dispatch, pushInThisBuild]);

  const toggle = useCallback(async () => {
    if (busy || state === 'unavailable' || state === 'blocked') return;
    setBusy(true);
    try {
      if (state === 'on') await dispatch(disablePushOnDevice());
      else await dispatch(enablePushOnDevice());
    } finally {
      setBusy(false);
    }
  }, [busy, state, dispatch]);

  const openSettings = useCallback(() => {
    void Linking.openSettings().catch(() => undefined);
  }, []);

  return { state, busy, toggle, openSettings };
}
