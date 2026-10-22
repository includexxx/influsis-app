import { useDispatch, useSelector } from 'react-redux';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { State, Dispatch } from '@/utils/store';
import { NotificationItem } from '@/types';
import {
  EMPTY_READ_STATE,
  ReadState,
  withAllRead,
  withoutRead,
  withRead,
} from '@/scenes/notifications/utils/readState';

// What the realtime socket (38b) has told us since the feed was loaded:
// notifications that arrived live, read state from other devices, the
// high-urgency banner, and whether the socket is up. The notifications screen
// layers this over its NT1 pages; REST stays the source of truth (events are
// not replayed), so a resync just bumps `resyncCount` for the screen to
// refetch page 1.

export const LIVE_INCOMING_CAP = 50;

export interface NotificationsLiveState {
  /** Newest first, deduped by id, capped at LIVE_INCOMING_CAP. */
  incoming: NotificationItem[];
  read: ReadState;
  resyncCount: number;
  /** The high-urgency notification the in-app banner shows. */
  banner: NotificationItem | null;
  /** Ids whose banner already showed (socket or foreground push), newest last. */
  bannerShownIds: string[];
  connected: boolean;
}

const initialState: NotificationsLiveState = {
  incoming: [],
  read: EMPTY_READ_STATE,
  resyncCount: 0,
  banner: null,
  bannerShownIds: [],
  connected: false,
};

/** Remembers that `id`'s banner showed, so its second arrival (socket or push) doesn't. */
function markBannerShown(state: NotificationsLiveState, id: string) {
  if (state.bannerShownIds.includes(id)) return;
  state.bannerShownIds = [...state.bannerShownIds, id].slice(-LIVE_INCOMING_CAP);
}

export interface ReadEventPayload {
  ids?: string[];
  all?: boolean;
  before?: string;
}

// The receipt time rides on the action (a prepare callback), so the reducers
// stay pure.
const withReceivedAt = <P>(payload: P) => ({
  payload: { ...payload, receivedAt: new Date().toISOString() },
});

const slice = createSlice({
  name: 'notificationsLive',
  initialState,
  reducers: {
    notificationReceived: (state, { payload }: PayloadAction<NotificationItem>) => {
      if (state.incoming.some(item => item.id === payload.id)) return;
      state.incoming = [payload, ...state.incoming].slice(0, LIVE_INCOMING_CAP);
      if (payload.urgency === 'high' && !state.bannerShownIds.includes(payload.id)) {
        state.banner = payload;
        markBannerShown(state, payload.id);
      }
    },
    /** A foreground push showed this banner (38e2): a later socket copy shows none. */
    pushBannerShown: (state, { payload }: PayloadAction<string>) => {
      markBannerShown(state, payload);
    },
    notificationsReadReceived: {
      reducer: (state, { payload }: PayloadAction<ReadEventPayload & { receivedAt: string }>) => {
        let read: ReadState = state.read;
        for (const id of payload.ids ?? []) read = withRead(read, id, payload.receivedAt);
        if (payload.all && payload.before) {
          read = withAllRead(read, payload.before, payload.receivedAt);
        }
        state.read = read;
      },
      prepare: (payload: ReadEventPayload) => withReceivedAt(payload),
    },
    markedReadLocally: {
      reducer: (state, { payload }: PayloadAction<{ id: string; receivedAt: string }>) => {
        state.read = withRead(state.read, payload.id, payload.receivedAt);
      },
      prepare: (id: string) => withReceivedAt({ id }),
    },
    markReadReverted: (state, { payload }: PayloadAction<string>) => {
      state.read = withoutRead(state.read, payload);
    },
    resyncRequested: state => {
      state.resyncCount += 1;
    },
    showBanner: (state, { payload }: PayloadAction<NotificationItem>) => {
      state.banner = payload;
    },
    bannerDismissed: state => {
      state.banner = null;
    },
    connectionChanged: (state, { payload }: PayloadAction<boolean>) => {
      state.connected = payload;
    },
    reset: () => initialState,
  },
});

export const {
  notificationReceived,
  notificationsReadReceived,
  markedReadLocally,
  markReadReverted,
  resyncRequested,
  pushBannerShown,
  showBanner,
  bannerDismissed,
  connectionChanged,
  reset,
} = slice.actions;

export function useNotificationsLiveSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector(({ notificationsLive }: State) => notificationsLive);
  return { dispatch, ...state, ...slice.actions };
}

export default slice.reducer;
