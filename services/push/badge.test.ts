import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { setAppBadge } from './badge';

jest.mock('expo-notifications', () => ({ setBadgeCountAsync: jest.fn(async () => true) }));

const setBadge = Notifications.setBadgeCountAsync as unknown as jest.Mock<
  (count: number) => Promise<boolean>
>;
const originalOS = Platform.OS;
const setOS = (os: string) =>
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });

beforeEach(() => {
  setBadge.mockClear();
});
afterEach(() => {
  setOS(originalOS);
});

describe('setAppBadge', () => {
  test('iOS sets the badge to the count', async () => {
    setOS('ios');
    await setAppBadge(7);
    expect(setBadge).toHaveBeenCalledWith(7);
  });

  test('never negative', async () => {
    setOS('ios');
    await setAppBadge(-2);
    expect(setBadge).toHaveBeenCalledWith(0);
  });

  test('Android does nothing', async () => {
    setOS('android');
    await setAppBadge(7);
    expect(setBadge).not.toHaveBeenCalled();
  });

  test('a failure is ignored', async () => {
    setOS('ios');
    setBadge.mockRejectedValueOnce(new Error('not allowed'));
    await expect(setAppBadge(3)).resolves.toBeUndefined();
  });

  test('a binary without expo-notifications does not throw', async () => {
    setOS('ios');
    await jest.isolateModulesAsync(async () => {
      jest.doMock('expo-notifications', () => {
        throw new Error("Cannot find native module 'ExpoBadgeModule'");
      });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { setAppBadge: isolated } = require('./badge') as typeof import('./badge');
      await expect(isolated(3)).resolves.toBeUndefined();
    });
  });
});
