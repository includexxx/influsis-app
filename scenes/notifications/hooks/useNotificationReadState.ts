import { useCallback, useRef, useState } from 'react';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/services/notificationsApi';
import { NotificationItem } from '@/types';
import {
  EMPTY_READ_STATE,
  ReadState,
  withAllRead,
  withoutAllRead,
  withoutRead,
  withRead,
} from '../utils/readState';

export const MARK_ALL_ERROR = "Couldn't mark everything as read. Try again.";

export interface UseNotificationReadStateResult {
  readState: ReadState;
  /** Optimistic NT3. Reverts on any failure without telling the creator. */
  markRead: (item: NotificationItem) => void;
  /** Optimistic NT4 with `before`. Reverts and sets `markAllError` on failure. */
  markAllRead: (before: string) => Promise<void>;
  isMarkingAll: boolean;
  markAllError: string | null;
}

// The notifications screen's optimistic read state, shared by both tabs.
// NT3 failures (a 404 for a deleted or another account's notification
// included) only revert: the creator has already moved on to the target.
export function useNotificationReadState(): UseNotificationReadStateResult {
  const [markOne] = useMarkNotificationReadMutation();
  const [markAll, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();
  // The ref is the source of truth so a revert sees the latest state, not
  // the one captured when the request started.
  const stateRef = useRef<ReadState>(EMPTY_READ_STATE);
  const [readState, setReadState] = useState<ReadState>(EMPTY_READ_STATE);
  const [markAllError, setMarkAllError] = useState<string | null>(null);

  const update = useCallback((fn: (state: ReadState) => ReadState) => {
    stateRef.current = fn(stateRef.current);
    setReadState(stateRef.current);
  }, []);

  const markRead = useCallback(
    (item: NotificationItem) => {
      if (item.readAt !== null || item.id in stateRef.current.readIds) return;
      update(state => withRead(state, item.id, new Date().toISOString()));
      markOne({ id: item.id })
        .unwrap()
        .catch(() => update(state => withoutRead(state, item.id)));
    },
    [markOne, update],
  );

  const markAllRead = useCallback(
    async (before: string) => {
      const { allBefore, allReadAt } = stateRef.current;
      setMarkAllError(null);
      update(state => withAllRead(state, before, new Date().toISOString()));
      try {
        await markAll({ before }).unwrap();
      } catch {
        update(state => withoutAllRead(state, before, { allBefore, allReadAt }));
        setMarkAllError(MARK_ALL_ERROR);
      }
    },
    [markAll, update],
  );

  return { readState, markRead, markAllRead, isMarkingAll, markAllError };
}
