import { Redirect, Stack } from 'expo-router';
import { useAuthSlice } from '@/slices';
import { authGate } from '@/utils/authGate';

export default function DetailsLayout() {
  const { status } = useAuthSlice();
  const gate = authGate(status, '(details)');

  if (gate.type === 'wait') return null;
  if (gate.type === 'redirect') return <Redirect href={gate.href} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
