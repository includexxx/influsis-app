import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from '@/services/notificationsApi';
import {
  channelMap,
  ChannelToggle,
  channelToggles,
  diffChannel,
  PreferenceChannel,
} from '../utils/channelPreferences';

export const saveErrorFor = (channel: PreferenceChannel) =>
  `Couldn't save your ${channel} settings. Try again.`;

export interface UseChannelPreferencesResult {
  /** NT5's categories with the on-screen (optimistic) values. */
  toggles: ChannelToggle[];
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
  isSaving: boolean;
  saveError: string | null;
  toggle: (category: string) => void;
}

// One channel's per-category toggles (NT5 / NT6): email (build-plan 38c) or
// push (38e3). A toggle shows at once; saving is serialized: one NT6 at a
// time, and when it settles the hook sends whatever still differs between
// the screen and the server, so rapid taps end on the last state and
// overlapping requests can never land out of order. A failure puts the screen
// back on the server's values. NT6 is partial per channel, so an email and a
// push instance saving at the same time never undo each other.
export function useChannelPreferences({
  channel,
  skip,
}: {
  channel: PreferenceChannel;
  skip: boolean;
}): UseChannelPreferencesResult {
  const { data, isLoading, isError, refetch } = useGetNotificationPreferencesQuery(undefined, {
    skip,
  });
  const [update] = useUpdateNotificationPreferencesMutation();

  // Refs are the source of truth while saving; `desired` state mirrors the
  // ref for rendering.
  const confirmedRef = useRef<Record<string, boolean>>({});
  const desiredRef = useRef<Record<string, boolean>>({});
  const inFlight = useRef(false);
  const [desired, setDesired] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const setDesiredBoth = useCallback((next: Record<string, boolean>) => {
    desiredRef.current = next;
    setDesired(next);
  }, []);

  // A (re)load from the server, outside a save, is the new baseline.
  useEffect(() => {
    if (!data || inFlight.current) return;
    confirmedRef.current = channelMap(data, channel);
    setDesiredBoth(channelMap(data, channel));
  }, [data, channel, setDesiredBoth]);

  const flush = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsSaving(true);
    try {
      for (;;) {
        const diff = diffChannel(desiredRef.current, confirmedRef.current);
        if (!diff) break;
        try {
          confirmedRef.current = channelMap(await update({ [channel]: diff }).unwrap(), channel);
        } catch (err) {
          setDesiredBoth({ ...confirmedRef.current });
          const e = err as { statusCode?: number; message?: string };
          setSaveError(e?.statusCode === 422 && e.message ? e.message : saveErrorFor(channel));
          break;
        }
      }
    } finally {
      inFlight.current = false;
      setIsSaving(false);
    }
  }, [update, channel, setDesiredBoth]);

  const toggle = useCallback(
    (category: string) => {
      if (!(category in desiredRef.current)) return;
      setSaveError(null);
      setDesiredBoth({ ...desiredRef.current, [category]: !desiredRef.current[category] });
      void flush();
    },
    [flush, setDesiredBoth],
  );

  const toggles = useMemo(
    () =>
      data
        ? channelToggles(data, channel).map(t => ({
            ...t,
            enabled: desired[t.category] ?? t.enabled,
          }))
        : [],
    [data, desired, channel],
  );

  return {
    toggles,
    isLoading,
    isError,
    retry: refetch,
    isSaving,
    saveError,
    toggle,
  };
}
