import { Redirect } from 'expo-router';
import { useAppSlice } from '@/slices';
import { authRedirect } from '@/utils/authGate';

export default function Index() {
  const { checked, loggedIn } = useAppSlice();

  if (!checked) return null;

  return <Redirect href={authRedirect('root', { loggedIn })} />;
}
