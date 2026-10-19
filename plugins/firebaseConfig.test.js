const { describe, expect, test } = require('@jest/globals');
const { pushConfig, PUSH_PLUGINS } = require('./firebaseConfig');

describe('pushConfig', () => {
  test('both Firebase files set: push on, with the files and plugins', () => {
    const config = pushConfig({
      GOOGLE_SERVICES_JSON: '/tmp/google-services.json',
      GOOGLE_SERVICE_INFO_PLIST: '/tmp/GoogleService-Info.plist',
    });

    expect(config).toEqual({
      pushEnabled: true,
      androidGoogleServicesFile: '/tmp/google-services.json',
      iosGoogleServicesFile: '/tmp/GoogleService-Info.plist',
      plugins: PUSH_PLUGINS,
    });
    expect(PUSH_PLUGINS).toEqual([
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
      ['expo-build-properties', { ios: { useFrameworks: 'static' } }],
      './plugins/withPushAndroid',
    ]);
  });

  test('neither set: push off, nothing added, no warning', () => {
    expect(pushConfig({})).toEqual({ pushEnabled: false, plugins: [], warning: undefined });
  });

  test.each([
    [{ GOOGLE_SERVICES_JSON: '/tmp/google-services.json' }],
    [{ GOOGLE_SERVICE_INFO_PLIST: '/tmp/GoogleService-Info.plist' }],
  ])('only one set (%o): treated as unset, with a warning', env => {
    const config = pushConfig(env);
    expect(config.pushEnabled).toBe(false);
    expect(config.plugins).toEqual([]);
    expect(config.androidGoogleServicesFile).toBeUndefined();
    expect(config.warning).toMatch(/GOOGLE_SERVICES_JSON and GOOGLE_SERVICE_INFO_PLIST/);
  });

  test('empty strings count as unset', () => {
    expect(
      pushConfig({ GOOGLE_SERVICES_JSON: '', GOOGLE_SERVICE_INFO_PLIST: '' }).pushEnabled,
    ).toBe(false);
  });
});
