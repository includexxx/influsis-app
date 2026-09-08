import { Redirect, Stack, useSegments } from 'expo-router';
import { useAuthSlice } from '@/slices';
import { authGate } from '@/utils/authGate';

export default function AuthLayout() {
  const { status } = useAuthSlice();
  const segments = useSegments() as string[];
  const gate = authGate(status, '(auth)', segments[1]);

  if (gate.type === 'wait') return null;
  if (gate.type === 'redirect') return <Redirect href={gate.href} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
