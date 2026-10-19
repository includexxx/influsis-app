const { describe, expect, test } = require('@jest/globals');
const {
  removeExpoFcmService,
  NOTIFICATION_ICON_XML,
  EXPO_FCM_SERVICE,
} = require('./withPushAndroid');

function manifest(services = []) {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      application: [{ $: { 'android:name': '.MainApplication' }, service: services }],
    },
  };
}

describe('ic_notification drawable', () => {
  test('is a white 24dp vector drawable', () => {
    expect(NOTIFICATION_ICON_XML).toContain('<vector');
    expect(NOTIFICATION_ICON_XML).toContain('android:width="24dp"');
    expect(NOTIFICATION_ICON_XML).toContain('android:fillColor="#FFFFFF"');
    expect(NOTIFICATION_ICON_XML).toContain('android:pathData=');
  });
});

describe('removeExpoFcmService', () => {
  test('adds a tools:node="remove" entry for the expo-notifications FCM service', () => {
    const result = removeExpoFcmService(manifest());

    expect(result.manifest.$['xmlns:tools']).toBe('http://schemas.android.com/tools');
    expect(result.manifest.application[0].service).toEqual([
      { $: { 'android:name': EXPO_FCM_SERVICE, 'tools:node': 'remove' } },
    ]);
    expect(EXPO_FCM_SERVICE).toBe(
      'expo.modules.notifications.service.ExpoFirebaseMessagingService',
    );
  });

  test('keeps the existing services', () => {
    const existing = { $: { 'android:name': '.SomeService' } };
    const result = removeExpoFcmService(manifest([existing]));

    expect(result.manifest.application[0].service[0]).toBe(existing);
    expect(result.manifest.application[0].service).toHaveLength(2);
  });

  test('is idempotent', () => {
    const once = removeExpoFcmService(manifest());
    const twice = removeExpoFcmService(once);

    expect(twice.manifest.application[0].service).toHaveLength(1);
  });

  test('adds a service list when the application has none', () => {
    const bare = { manifest: { $: {}, application: [{ $: {} }] } };
    expect(removeExpoFcmService(bare).manifest.application[0].service).toHaveLength(1);
  });
});
