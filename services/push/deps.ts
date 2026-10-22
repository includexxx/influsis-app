import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { DataPersistKeys } from '@/hooks/useDataPersist';
import { notificationsApi } from '@/services/notificationsApi';
import type { AuthState } from '@/slices/auth.slice';
import { getPushMessaging } from './messaging';
import type { AndroidPermissionResult, PushDeps, StoredPushDevice } from './registration';

type AppDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

/** User ids that switched push off on this device (kept across sign-out). */
async function readOptOut(): Promise<string[]> {
  try {
    const parsed: unknown = JSON.parse(
      (await AsyncStorage.getItem(DataPersistKeys.PUSH_DEVICE_OFF)) ?? '[]',
    );
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

// The real dependencies for services/push/registration.ts.
export function pushDeps(dispatch: AppDispatch, getState: () => unknown): PushDeps {
  return {
    messaging: getPushMessaging,
    os: Platform.OS,
    androidApiLevel: typeof Platform.Version === 'number' ? Platform.Version : 0,
    androidPermission: {
      check: () => PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS),
      request: async () =>
        (await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        )) as AndroidPermissionResult,
    },
    storage: {
      get: async () => {
        const raw = await AsyncStorage.getItem(DataPersistKeys.PUSH_DEVICE);
        return raw ? (JSON.parse(raw) as StoredPushDevice) : null;
      },
      set: device => AsyncStorage.setItem(DataPersistKeys.PUSH_DEVICE, JSON.stringify(device)),
      remove: () => AsyncStorage.removeItem(DataPersistKeys.PUSH_DEVICE),
      isOptedOut: async userId => (await readOptOut()).includes(userId),
      setOptedOut: async (userId, optedOut) => {
        const others = (await readOptOut()).filter(id => id !== userId);
        await AsyncStorage.setItem(
          DataPersistKeys.PUSH_DEVICE_OFF,
          JSON.stringify(optedOut ? [...others, userId] : others),
        );
      },
    },
    api: {
      register: body =>
        dispatch(notificationsApi.endpoints.registerPushDevice.initiate(body)).unwrap(),
      remove: async id => {
        try {
          await dispatch(notificationsApi.endpoints.deletePushDevice.initiate({ id })).unwrap();
        } catch (err) {
          // 404: already gone (signed out elsewhere, revoked, or dropped above 10).
          if ((err as { statusCode?: number } | undefined)?.statusCode !== 404) throw err;
        }
      },
    },
    dispatch,
    userId: () => (getState() as { auth?: AuthState }).auth?.account?.id,
    now: Date.now,
  };
}
