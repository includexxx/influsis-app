import { useState } from 'react';
import { useAuthSlice, usePushSlice } from '@/slices';
import { askPushPermission } from '@/services/push/pushThunks';
import PushPermissionSheet, {
  PushPermissionSheetStatus,
} from '@/components/elements/PushPermissionSheet';

// Shows the push explainer when services/push/pushPrompt.ts asks for it,
// mounted once in app/_layout.tsx. "Turn on" asks the OS and, when granted,
// registers the device (NT7). If push turns out to be unavailable, or the
// creator says no in the OS prompt, the sheet stays open to say so until
// they close it.
export default function PushPromptHost() {
  const { status } = useAuthSlice();
  const { promptVisible, dispatch, promptClosed } = usePushSlice();
  const [busy, setBusy] = useState(false);
  const [sheetStatus, setSheetStatus] = useState<PushPermissionSheetStatus>(null);

  if (!promptVisible || status !== 'authenticated') return null;

  const close = () => {
    setSheetStatus(null);
    dispatch(promptClosed());
  };

  const onTurnOn = async () => {
    setBusy(true);
    try {
      const { permission, result } = await dispatch(askPushPermission()).unwrap();
      if (permission === 'denied' || permission === 'blocked') setSheetStatus('settings');
      else if (result === 'unavailable') setSheetStatus('unavailable');
      else if (permission === 'granted' || permission === 'provisional') close();
    } catch {
      setSheetStatus('unavailable');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PushPermissionSheet status={sheetStatus} busy={busy} onTurnOn={onTurnOn} onNotNow={close} />
  );
}
