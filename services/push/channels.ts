import { Platform } from 'react-native';

// The two Android notification channels the backend's pushes name
// (`android.notification.channelId`, backend PUSH_NOTIFICATIONS §8). The ids
// must match exactly: a push for a channel that doesn't exist lands in
// Android's default "Miscellaneous" channel. expo-notifications is in the app
// only for this (decision 2026-10-19); see plugins/withPushAndroid.js.
//
// expo-notifications is required lazily: a binary built before it was added
// (still reachable through EAS Update or a dev server) has no native module,
// and a top-level import would crash the app at start.

type ExpoNotifications = typeof import('expo-notifications');

export const PUSH_CHANNEL_IDS = ['high_priority', 'updates'] as const;

function channels(n: ExpoNotifications) {
  return [
    {
      id: 'high_priority',
      name: 'Important updates',
      importance: n.AndroidImportance.HIGH,
      sound: 'default',
      enableVibrate: true,
    },
    {
      id: 'updates',
      name: 'Other updates',
      importance: n.AndroidImportance.DEFAULT,
      sound: null,
      enableVibrate: false,
    },
  ];
}

/** Creates (or updates) both channels. Android only; never throws. */
export async function createPushChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  let notifications: ExpoNotifications;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notifications = require('expo-notifications') as ExpoNotifications;
  } catch {
    return;
  }
  await Promise.all(
    channels(notifications).map(({ id, ...channel }) =>
      notifications
        .setNotificationChannelAsync(id, {
          ...channel,
          lockscreenVisibility: notifications.AndroidNotificationVisibility.PRIVATE,
        })
        .catch(() => null),
    ),
  );
}
