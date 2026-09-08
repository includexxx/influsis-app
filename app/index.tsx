import { Redirect } from 'expo-router';
import { useAuthSlice } from '@/slices';

export default function Index() {
  const { status } = useAuthSlice();

  if (status === 'restoring') return null;

  return <Redirect href={status === 'authenticated' ? '/home' : '/onboarding'} />;
}
