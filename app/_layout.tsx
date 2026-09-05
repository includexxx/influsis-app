import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useDataPersist, DataPersistKeys } from '@/hooks';
import { loadImages, loadFonts } from '@/theme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppSlice } from '@/slices';
import { getUserAsync } from '@/services';
import Provider from '@/providers';
import { User } from '@/types';

// keep the splash screen visible while complete fetching resources
SplashScreen.preventAutoHideAsync();

function Router() {
  const { dispatch, setUser, setLoggedIn } = useAppSlice();
  const { setPersistData, getPersistData } = useDataPersist();

  /**
   * preload assets and user info
   */
  useEffect(() => {
    (async () => {
      try {
        // preload assets
        await Promise.all([loadImages(), loadFonts()]);

        // fetch & store user data to store (fake promise function to simulate async function)
        const user = await getUserAsync();
        dispatch(setUser(user));
        dispatch(setLoggedIn(!!user));
        if (user) setPersistData<User>(DataPersistKeys.USER, user);
      } catch {
        // if preload failed, try to get user data from persistent storage
        const user = await getPersistData<User>(DataPersistKeys.USER);
        if (user) dispatch(setUser(user));
        dispatch(setLoggedIn(!!user));
      } finally {
        // hide splash screen
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
