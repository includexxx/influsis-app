import { NotificationItem } from '@/types';

// The screen's optimistic read state, layered over the feed. It lives outside
// the RTK Query cache because earlier feed pages are local state in
// useNotificationsFeed, not live cache entries. 38b feeds the socket's
// `notification:read` into the same overlay.
export interface ReadState {
  /** Ids marked read here (NT3), with the local time they were marked. */
  readIds: Readonly<Record<string, string>>;
  /** "Mark all as read" (NT4): everything created at or before this is read. */
  allBefore: string | null;
  /** When the mark-all happened, used as those items' `readAt`. */
  allReadAt: string | null;
}

export const EMPTY_READ_STATE: ReadState = { readIds: {}, allBefore: null, allReadAt: null };

const time = (iso: string) => Date.parse(iso);

/** Items with `readAt` filled wherever the overlay says they are read. */
export function applyReadState(items: NotificationItem[], state: ReadState): NotificationItem[] {
  const allBefore = state.allBefore ? time(state.allBefore) : null;
  return items.map(item => {
    if (item.readAt !== null) return item;
    const readAt = state.readIds[item.id];
    if (readAt) return { ...item, readAt };
    if (allBefore !== null && state.allReadAt && time(item.createdAt) <= allBefore) {
      return { ...item, readAt: state.allReadAt };
    }
    return item;
  });
}

export function withRead(state: ReadState, id: string, at: string): ReadState {
  return { ...state, readIds: { ...state.readIds, [id]: at } };
}

export function withoutRead(state: ReadState, id: string): ReadState {
  if (!(id in state.readIds)) return state;
  const readIds = { ...state.readIds };
  delete readIds[id];
  return { ...state, readIds };
}

/** Marks everything up to `before` read; an older `before` never shrinks it. */
export function withAllRead(state: ReadState, before: string, at: string): ReadState {
  if (state.allBefore && time(state.allBefore) >= time(before)) return state;
  return { ...state, allBefore: before, allReadAt: at };
}

/** Undoes a failed mark-all, unless a later one already replaced it. */
export function withoutAllRead(
  state: ReadState,
  before: string,
  previous: Pick<ReadState, 'allBefore' | 'allReadAt'>,
): ReadState {
  if (state.allBefore !== before) return state;
  return { ...state, allBefore: previous.allBefore, allReadAt: previous.allReadAt };
}

/** The newest `createdAt` in `items` (the NT1 anchor and the NT4 `before`). */
export function newestCreatedAt(items: NotificationItem[]): string | undefined {
  let newest: string | undefined;
  for (const item of items) {
    if (!newest || time(item.createdAt) > time(newest)) newest = item.createdAt;
  }
  return newest;
}
