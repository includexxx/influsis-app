import { Platform } from 'react-native';
import Constants from 'expo-constants';

// The one way into React Native Firebase messaging (build-plan 38e1).
// Push only exists in builds made with this environment's Firebase files
// (plugins/firebaseConfig.js sets `extra.pushEnabled`); everywhere else - web,
// Expo Go, a build without the plugins, a Firebase app that won't start -
// this returns null and the app treats push as unavailable. It never throws.

/** iOS authorization status (React Native Firebase AuthorizationStatus). */
export const PUSH_AUTH_STATUS = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
  EPHEMERAL: 3,
} as const;

export interface PushMessaging {
  hasPermission(): Promise<number>;
  requestPermission(): Promise<number>;
  getToken(): Promise<string>;
  deleteToken(): Promise<void>;
  onTokenRefresh(listener: (token: string) => void): () => void;
}

let cached: PushMessaging | null | undefined;

function load(): PushMessaging | null {
  if (Platform.OS === 'web') return null;
  if (Constants.expoConfig?.extra?.pushEnabled !== true) return null;
  try {
    // Required lazily: the native module only exists in push-enabled builds.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m =
      require('@react-native-firebase/messaging') as typeof import('@react-native-firebase/messaging');
    const instance = m.getMessaging();
    return {
      hasPermission: () => m.hasPermission(instance),
      requestPermission: () => m.requestPermission(instance),
      getToken: () => m.getToken(instance),
      deleteToken: () => m.deleteToken(instance),
      onTokenRefresh: listener => m.onTokenRefresh(instance, listener),
    };
  } catch {
    return null;
  }
}

/** Messaging, or null when push can't work in this build or on this platform. */
export function getPushMessaging(): PushMessaging | null {
  if (cached === undefined) cached = load();
  return cached;
}

/** Tests only: forget the cached result. */
export function resetPushMessagingForTests(): void {
  cached = undefined;
}
