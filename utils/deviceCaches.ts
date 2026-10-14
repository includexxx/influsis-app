import { Image } from 'expo-image';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

/**
 * Logout-time wipe of the caches that live outside Redux and AsyncStorage:
 * the Google account chosen at sign-in (so the next Google sign-in asks for
 * an account again) and expo-image's memory and disk caches (avatars, covers,
 * campaign media). Best-effort - a failure (e.g. a call unsupported on web)
 * never blocks the logout.
 */
export async function clearDeviceCaches(): Promise<void> {
  await Promise.allSettled([
    Promise.resolve().then(() => GoogleSignin.signOut()),
    Promise.resolve().then(() => Image.clearMemoryCache()),
    Promise.resolve().then(() => Image.clearDiskCache()),
  ]);
}
