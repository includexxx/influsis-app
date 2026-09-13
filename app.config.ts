import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const expoProjectId = process.env.EXPO_PROJECT_ID ?? '0fd3df0c-7c43-4859-9c5a-f4b7ecf8b179';
  const expoConfig: ExpoConfig = {
    ...config,
    slug: process.env.EXPO_SLUG ?? 'infus',
    name: process.env.EXPO_NAME ?? 'Influsis',
    ios: {
      ...config.ios,
      bundleIdentifier:
        process.env.EXPO_IOS_BUNDLE_IDENTIFIER ?? 'com.watarumaeda.react-native-boilerplate',
    },
    android: {
      ...config.android,
      package: process.env.EXPO_ANDROID_PACKAGE ?? 'com.watarumaeda.react_native_boilerplate',
    },
    web: {
      ...config.web,
      bundler: 'metro',
      output: 'static',
    },
    updates: {
      url: `https://u.expo.dev/${expoProjectId}`,
    },
    extra: {
      ...config.extra,
      eas: { projectId: expoProjectId },
      env: process.env.ENV ?? 'development',
      apiUrl: process.env.API_URL ?? 'https://example.com',
      // add more env variables here...
    },
    plugins: [
      'expo-router',
      'expo-asset',
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow $(PRODUCT_NAME) to access your photos to upload a gig cover.',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#ffffff',
          image: './assets/images/Influsis_logo.png',
          imageWidth: 300,
        },
      ],
      [
        'expo-font',
        {
          fonts: [
            './assets/fonts/OpenSans-Bold.ttf',
            './assets/fonts/OpenSans-BoldItalic.ttf',
            './assets/fonts/OpenSans-Italic.ttf',
            './assets/fonts/OpenSans-Regular.ttf',
            './assets/fonts/OpenSans-Semibold.ttf',
            './assets/fonts/OpenSans-SemiboldItalic.ttf',
            './assets/fonts/ClashDisplay/ClashDisplay-Bold.otf',
            './assets/fonts/ClashDisplay/ClashDisplay-Extralight.otf',
            './assets/fonts/ClashDisplay/ClashDisplay-Light.otf',
            './assets/fonts/ClashDisplay/ClashDisplay-Medium.otf',
            './assets/fonts/ClashDisplay/ClashDisplay-Regular.otf',
            './assets/fonts/ClashDisplay/ClashDisplay-Semibold.otf',
          ],
        },
      ],
    ],
  };
  // console.log('[##] expo config', expoConfig);
  return expoConfig;
};
