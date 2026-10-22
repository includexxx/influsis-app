import { Platform } from 'react-native';

/**
 * Sets the iOS app icon badge (build-plan 38e2). The backend's `aps.badge`
 * sets it while the app is in the background; the app keeps it equal to the
 * unread count (NT2) while open. iOS only. expo-notifications is required
 * lazily (a binary built before 38e1 has no native module), and a failure is
 * ignored - the badge is cosmetic.
 */
export async function setAppBadge(count: number): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const notifications = require('expo-notifications') as typeof import('expo-notifications');
    await notifications.setBadgeCountAsync(Math.max(0, count));
  } catch {
    // no module, or the OS refused: leave the badge as it is
  }
}
