import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { loadImages, loadFonts } from '@/theme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppSlice, bootstrapSession } from '@/slices';
import Provider from '@/providers';

// keep the splash screen visible while assets load and the session rehydrates
SplashScreen.preventAutoHideAsync();

function Router() {
  const { dispatch } = useAppSlice();

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadImages(), loadFonts()]);
        await dispatch(bootstrapSession());
      } finally {
        SplashScreen.hideAsync();
      }
    })();
  }, [dispatch]);

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
