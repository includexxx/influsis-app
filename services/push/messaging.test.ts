import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Platform } from 'react-native';
import { getPushMessaging, resetPushMessagingForTests } from './messaging';

const mockFirebase = {
  getMessaging: jest.fn(() => ({ app: 'default' })),
  hasPermission: jest.fn(async () => 1),
  requestPermission: jest.fn(async () => 1),
  getToken: jest.fn(async () => 'fcm-token'),
  deleteToken: jest.fn(async () => undefined),
  onTokenRefresh: jest.fn(() => () => undefined),
};

jest.mock('@react-native-firebase/messaging', () => mockFirebase);

let mockExtra: Record<string, unknown> | undefined;
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: mockExtra };
    },
  },
}));

const originalOS = Platform.OS;

beforeEach(() => {
  resetPushMessagingForTests();
  jest.clearAllMocks();
  mockExtra = { pushEnabled: true };
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
});

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
});

describe('getPushMessaging', () => {
  test('wraps the modular API on a push-enabled native build', async () => {
    const messaging = getPushMessaging();

    expect(messaging).not.toBeNull();
    await expect(messaging!.getToken()).resolves.toBe('fcm-token');
    await messaging!.deleteToken();
    await messaging!.hasPermission();
    await messaging!.requestPermission();
    messaging!.onTokenRefresh(() => undefined);
    const instance = { app: 'default' };
    expect(mockFirebase.getToken).toHaveBeenCalledWith(instance);
    expect(mockFirebase.deleteToken).toHaveBeenCalledWith(instance);
    expect(mockFirebase.hasPermission).toHaveBeenCalledWith(instance);
    expect(mockFirebase.requestPermission).toHaveBeenCalledWith(instance);
    expect(mockFirebase.onTokenRefresh).toHaveBeenCalledWith(instance, expect.any(Function));
  });

  test('is cached', () => {
    expect(getPushMessaging()).toBe(getPushMessaging());
    expect(mockFirebase.getMessaging).toHaveBeenCalledTimes(1);
  });

  test('is null on the web', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    expect(getPushMessaging()).toBeNull();
  });

  test.each([[{ pushEnabled: false }], [{}], [undefined]])(
    'is null when the build has no push (extra %o)',
    value => {
      mockExtra = value;
      expect(getPushMessaging()).toBeNull();
      expect(mockFirebase.getMessaging).not.toHaveBeenCalled();
    },
  );

  test('is null when the Firebase app will not start', () => {
    mockFirebase.getMessaging.mockImplementationOnce(() => {
      throw new Error('No Firebase App [DEFAULT] has been created');
    });
    expect(getPushMessaging()).toBeNull();
  });
});
