import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createPushChannels } from './channels';

jest.mock('expo-notifications', () => ({
  setNotificationChannelAsync: jest.fn(async () => null),
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  AndroidNotificationVisibility: { PRIVATE: 0 },
}));

const setChannel = Notifications.setNotificationChannelAsync as unknown as jest.Mock<
  (id: string, channel: object) => Promise<unknown>
>;
const originalOS = Platform.OS;

function setOS(os: string) {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
}

beforeEach(() => {
  setChannel.mockClear();
});

afterEach(() => setOS(originalOS));

describe('createPushChannels', () => {
  test('creates high_priority and updates on Android with the backend ids', async () => {
    setOS('android');

    await createPushChannels();

    expect(setChannel).toHaveBeenCalledTimes(2);
    expect(setChannel).toHaveBeenCalledWith('high_priority', {
      name: 'Important updates',
      importance: 4,
      sound: 'default',
      enableVibrate: true,
      lockscreenVisibility: 0,
    });
    expect(setChannel).toHaveBeenCalledWith('updates', {
      name: 'Other updates',
      importance: 3,
      sound: null,
      enableVibrate: false,
      lockscreenVisibility: 0,
    });
  });

  test('does nothing on iOS', async () => {
    setOS('ios');
    await createPushChannels();
    expect(setChannel).not.toHaveBeenCalled();
  });

  test('a binary without expo-notifications skips channels instead of crashing', async () => {
    setOS('android');
    jest.isolateModules(() => {
      jest.doMock('expo-notifications', () => {
        throw new Error("Cannot find native module 'ExpoNotificationPresenter'");
      });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createPushChannels: isolated } = require('./channels') as typeof import('./channels');
      void expect(isolated()).resolves.toBeUndefined();
    });
  });

  test('never throws', async () => {
    setOS('android');
    setChannel.mockRejectedValue(new Error('native module missing'));
    await expect(createPushChannels()).resolves.toBeUndefined();
  });
});
