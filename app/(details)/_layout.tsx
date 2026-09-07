import { Redirect, Stack } from 'expo-router';
import { useAppSlice } from '@/slices';
import { authRedirect } from '@/utils/authGate';

// The stacked detail / sub-flow screens. Gated behind a live session; screen
// options mirror the root layout so nothing here grows a header.
export default function DetailsLayout() {
  const { checked, loggedIn } = useAppSlice();

  if (!checked) return null;
  const to = authRedirect('details', { loggedIn });
  if (to) return <Redirect href={to} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
