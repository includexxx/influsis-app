import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { loadImages, loadFonts } from '@/theme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthSlice } from '@/slices';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useIncomingNotificationLinks } from '@/hooks/useIncomingNotificationLinks';
import { useNotificationReadParam } from '@/hooks/useNotificationReadParam';
import Provider from '@/providers';
import NotificationBannerHost from '@/components/layouts/NotificationBannerHost';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import config from '@/utils/config';

// keep the splash screen visible while complete fetching resources
SplashScreen.preventAutoHideAsync();

GoogleSignin.configure({
  webClientId: config.googleWebClientId,
  offlineAccess: true,
});

function Router() {
  const { dispatch, restoreSession } = useAuthSlice();
  // The realtime notifications socket (38b): open while signed in and in the
  // foreground.
  useRealtimeNotifications();
  // Notification links (38d1): keep one that arrives signed out for after
  // sign-in, and mark `?n={id}` read on whatever screen it opens.
  useIncomingNotificationLinks();
  useNotificationReadParam();

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
      {/* After the Stack so it draws over every screen. */}
      <NotificationBannerHost />
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
