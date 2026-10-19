import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { configureStore, UnknownAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataPersistKeys } from '@/hooks/useDataPersist';
import authReducer, { sessionEstablished } from '@/slices/auth.slice';
import notificationsLive, { notificationReceived } from '@/slices/notificationsLive.slice';
import push, { permissionChanged } from '@/slices/push.slice';
import { AuthAccount, NotificationItem } from '@/types';
import { readPushPermission } from './registration';
import pushPrompt from './pushPrompt';

let mockMessaging: object | null = {};

jest.mock('./deps', () => ({
  pushDeps: () => ({ messaging: () => mockMessaging }),
}));

jest.mock('./registration', () => ({
  readPushPermission: jest.fn(async () => 'unknown'),
}));

const readPermission = readPushPermission as unknown as jest.Mock<() => Promise<string>>;

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer, notificationsLive, push },
    middleware: gDM => gDM({ serializableCheck: false }).prepend(pushPrompt.middleware),
  });
}

// A fulfilled RTK Query mutation, as campaignFeedApi's matchers see it.
function fulfilled(endpointName: string): UnknownAction {
  return {
    type: 'campaignFeedApi/executeMutation/fulfilled',
    payload: {},
    meta: { arg: { endpointName }, requestId: 'r-1', requestStatus: 'fulfilled' },
  } as UnknownAction;
}

function live(eventType: string): UnknownAction {
  return notificationReceived({
    id: `n-${eventType}`,
    eventType,
    urgency: 'normal',
    readAt: null,
    createdAt: '2026-10-17T09:00:00.000Z',
  } as NotificationItem);
}

async function settle() {
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
}

let store: ReturnType<typeof makeStore>;

beforeEach(async () => {
  await AsyncStorage.clear();
  mockMessaging = {};
  readPermission.mockResolvedValue('unknown');
  store = makeStore();
  store.dispatch(sessionEstablished({ id: 'u-1' } as AuthAccount));
});

describe('pushPrompt', () => {
  test.each([
    ['a join request', () => fulfilled('applyToCampaign')],
    ['accepting an offer', () => fulfilled('acceptOffer')],
    ['accepting an invitation', () => fulfilled('acceptMyEngagement')],
    ['a live invitation', () => live('engagement.invited')],
    ['a live acceptance', () => live('engagement.accepted')],
  ])('%s opens the explainer once and remembers it', async (_name, action) => {
    store.dispatch(action());
    await settle();

    expect(store.getState().push.promptVisible).toBe(true);
    expect(await AsyncStorage.getItem(DataPersistKeys.PUSH_PROMPT_SHOWN)).toBe('true');
  });

  test('other moments do nothing', async () => {
    store.dispatch(fulfilled('sendCounterOffer'));
    store.dispatch(live('offer.countered'));
    await settle();
    expect(store.getState().push.promptVisible).toBe(false);
  });

  test('never twice on the same device', async () => {
    await AsyncStorage.setItem(DataPersistKeys.PUSH_PROMPT_SHOWN, 'true');
    store.dispatch(fulfilled('applyToCampaign'));
    await settle();
    expect(store.getState().push.promptVisible).toBe(false);
  });

  test.each(['granted', 'provisional', 'denied'])(
    'not when the OS permission is already %s',
    async permission => {
      readPermission.mockResolvedValue(permission);
      store.dispatch(fulfilled('applyToCampaign'));
      await settle();
      expect(store.getState().push.promptVisible).toBe(false);
    },
  );

  test('not after an Android refusal recorded earlier', async () => {
    store.dispatch(permissionChanged('blocked'));
    store.dispatch(fulfilled('applyToCampaign'));
    await settle();
    expect(store.getState().push.promptVisible).toBe(false);
  });

  test('not where push is unavailable', async () => {
    mockMessaging = null;
    store.dispatch(fulfilled('applyToCampaign'));
    await settle();
    expect(store.getState().push.promptVisible).toBe(false);
  });

  test('not while signed out', async () => {
    const signedOut = makeStore();
    signedOut.dispatch(fulfilled('applyToCampaign'));
    await settle();
    expect(signedOut.getState().push.promptVisible).toBe(false);
  });
});
