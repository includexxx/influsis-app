import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { loadImages, loadFonts } from '@/theme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthSlice } from '@/slices';
import Provider from '@/providers';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// keep the splash screen visible while complete fetching resources
SplashScreen.preventAutoHideAsync();

GoogleSignin.configure({
  webClientId: process.env.EXPO_WEB_CLIENT_ID,
  offlineAccess: true,
});

function Router() {
  const { dispatch, restoreSession } = useAuthSlice();

  /**
   * preload assets, then rehydrate the session from the token store
   * (GET /auth/me, with the 19a interceptor refreshing a stale token)
   */
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadImages(), loadFonts()]).catch(() => {});
        await dispatch(restoreSession());
      } finally {
        SplashScreen.hideAsync();
      }
    })();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider>
      <Router />
    </Provider>
  );
}
