import { describe, expect, test } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { NotificationItem } from '@/types';
import { applyReadState } from '@/scenes/notifications/utils/readState';
import authReducer, { clearSessionState, sessionEstablished } from './auth.slice';
import reducer, {
  bannerDismissed,
  connectionChanged,
  LIVE_INCOMING_CAP,
  markedReadLocally,
  markReadReverted,
  notificationReceived,
  notificationsReadReceived,
  resyncRequested,
  showBanner,
} from './notificationsLive.slice';

function item(id: string, overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id,
    eventType: 'engagement.invited',
    category: 'engagement',
    urgency: 'normal',
    title: id,
    body: '',
    target: { type: 'engagement', id: 'e-1', params: {} },
    readAt: null,
    resolvedAt: null,
    createdAt: '2026-10-17T09:00:00.000Z',
    ...overrides,
  };
}

const initial = reducer(undefined, { type: '@@init' });

describe('notificationsLive slice', () => {
  test('a new notification is prepended; a duplicate id is ignored', () => {
    let state = reducer(initial, notificationReceived(item('a')));
    state = reducer(state, notificationReceived(item('b')));
    state = reducer(state, notificationReceived(item('a', { title: 'again' })));

    expect(state.incoming.map(i => i.id)).toEqual(['b', 'a']);
    expect(state.incoming[1].title).toBe('a');
  });

  test('only a high-urgency notification becomes the banner, and a duplicate never re-shows it', () => {
    let state = reducer(initial, notificationReceived(item('n', { urgency: 'normal' })));
    expect(state.banner).toBeNull();

    state = reducer(state, notificationReceived(item('h', { urgency: 'high' })));
    expect(state.banner?.id).toBe('h');

    state = reducer(state, bannerDismissed());
    state = reducer(state, notificationReceived(item('h', { urgency: 'high' })));
    expect(state.banner).toBeNull();
  });

  test('keeps at most the newest LIVE_INCOMING_CAP items', () => {
    let state = initial;
    for (let i = 0; i < LIVE_INCOMING_CAP + 5; i++) {
      state = reducer(state, notificationReceived(item(`n-${i}`)));
    }
    expect(state.incoming).toHaveLength(LIVE_INCOMING_CAP);
    expect(state.incoming[0].id).toBe(`n-${LIVE_INCOMING_CAP + 4}`);
  });

  test('read events by id mark those items; unknown ids change nothing visible', () => {
    const state = reducer(initial, notificationsReadReceived({ ids: ['a', 'ghost'] }));
    const [a, b] = applyReadState([item('a'), item('b')], state.read);

    expect(a.readAt).not.toBeNull();
    expect(b.readAt).toBeNull();
  });

  test('an all/before read event marks everything up to before', () => {
    const state = reducer(
      initial,
      notificationsReadReceived({ all: true, before: '2026-10-17T09:30:00.000Z' }),
    );
    const [old, fresh] = applyReadState(
      [item('old'), item('fresh', { createdAt: '2026-10-17T10:00:00.000Z' })],
      state.read,
    );

    expect(old.readAt).not.toBeNull();
    expect(fresh.readAt).toBeNull();
  });

  test('a local mark-read can be reverted', () => {
    let state = reducer(initial, markedReadLocally('a'));
    expect(applyReadState([item('a')], state.read)[0].readAt).not.toBeNull();

    state = reducer(state, markReadReverted('a'));
    expect(applyReadState([item('a')], state.read)[0].readAt).toBeNull();
  });

  test('resync increments the counter; banner and connection can be set', () => {
    let state = reducer(initial, resyncRequested());
    state = reducer(state, resyncRequested());
    state = reducer(state, showBanner(item('p', { urgency: 'high' })));
    state = reducer(state, connectionChanged(true));

    expect(state.resyncCount).toBe(2);
    expect(state.banner?.id).toBe('p');
    expect(state.connected).toBe(true);
  });

  test('clearSessionState resets it', () => {
    const store = configureStore({
      reducer: { auth: authReducer, notificationsLive: reducer },
      middleware: gDM => gDM({ serializableCheck: false }),
    });
    store.dispatch(sessionEstablished({ id: 'u-1' } as never));
    store.dispatch(notificationReceived(item('h', { urgency: 'high' })));
    store.dispatch(connectionChanged(true));

    clearSessionState(store.dispatch);

    expect(store.getState().notificationsLive).toEqual(initial);
  });
});
