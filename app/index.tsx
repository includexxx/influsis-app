import { Redirect } from 'expo-router';
import { useAppSlice } from '@/slices';

export default function Index() {
  const { checked } = useAppSlice();

  if (!checked) return null;

  return <Redirect href="/onboarding" />;
}
