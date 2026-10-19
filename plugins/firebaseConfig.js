// Push (build-plan 38e1) is wired into the native build only when this
// environment has its Firebase files - the EAS file env vars
// GOOGLE_SERVICES_JSON (Android) and GOOGLE_SERVICE_INFO_PLIST (iOS) hold
// their paths. Until the Firebase projects exist (backend README P4), builds
// without them stay exactly as before and the app treats push as unavailable
// (services/push/messaging.ts). Decision 2026-10-19.
//
// Plain CommonJS so app.config.ts can require it and Jest can test it.

const PUSH_PLUGINS = [
  '@react-native-firebase/app',
  '@react-native-firebase/messaging',
  // React Native Firebase needs static frameworks on iOS under Expo.
  ['expo-build-properties', { ios: { useFrameworks: 'static' } }],
  './plugins/withPushAndroid',
];

/**
 * @param {Record<string, string | undefined>} env
 * @returns {{ pushEnabled: boolean, androidGoogleServicesFile?: string, iosGoogleServicesFile?: string, plugins: unknown[], warning?: string }}
 */
function pushConfig(env) {
  const android = env.GOOGLE_SERVICES_JSON || undefined;
  const ios = env.GOOGLE_SERVICE_INFO_PLIST || undefined;

  if (android && ios) {
    return {
      pushEnabled: true,
      androidGoogleServicesFile: android,
      iosGoogleServicesFile: ios,
      plugins: PUSH_PLUGINS,
    };
  }

  return {
    pushEnabled: false,
    plugins: [],
    warning:
      android || ios
        ? 'Push is off for this build: set both GOOGLE_SERVICES_JSON and GOOGLE_SERVICE_INFO_PLIST.'
        : undefined,
  };
}

module.exports = { pushConfig, PUSH_PLUGINS };
