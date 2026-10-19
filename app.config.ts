import { ExpoConfig, ConfigContext } from 'expo/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pushConfig } = require('./plugins/firebaseConfig');

export default ({ config }: ConfigContext): ExpoConfig => {
  const expoProjectId = process.env.EXPO_PROJECT_ID ?? '0fd3df0c-7c43-4859-9c5a-f4b7ecf8b179';
  // Push (38e1) only when this environment has its Firebase files.
  const push = pushConfig(process.env);
  if (push.warning) console.warn(`[app.config] ${push.warning}`);
  const expoConfig: ExpoConfig = {
    ...config,
    slug: process.env.EXPO_SLUG ?? 'infus',
    name: process.env.EXPO_NAME ?? 'Influsis',
    ios: {
      ...config.ios,
      bundleIdentifier: process.env.EXPO_IOS_BUNDLE_IDENTIFIER ?? 'com.influsis.native_dev',
      ...(push.iosGoogleServicesFile ? { googleServicesFile: push.iosGoogleServicesFile } : {}),
    },
    android: {
      ...config.android,
      package: process.env.EXPO_ANDROID_PACKAGE ?? 'com.influsis.native_dev',
      ...(push.androidGoogleServicesFile
        ? { googleServicesFile: push.androidGoogleServicesFile }
        : {}),
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
      googleWebClientId: process.env.EXPO_WEB_CLIENT_ID,
      pushEnabled: push.pushEnabled,
      // add more env variables here...
    },
    plugins: [
      [
        '@react-native-google-signin/google-signin',
        {
          // iosUrlScheme: process.env.EXPO_ISO_URL_SCREEN,
          iosUrlScheme: 'com.googleusercontent.apps.361563667577-oq9to7s2fvmb59tnrttbu8dvki0r9otk',
        },
      ],
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
      // Firebase + build properties + plugins/withPushAndroid, only with the
      // Firebase files (plugins/firebaseConfig.js).
      ...push.plugins,
    ],
  };
  // console.log('[##] expo config', expoConfig);
  return expoConfig;
};
