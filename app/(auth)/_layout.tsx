import { Redirect, Stack, useSegments } from 'expo-router';
import { useAppSlice } from '@/slices';
import { authRedirect } from '@/utils/authGate';

// Pre-login screens (onboarding, sign-in/up, OTP, password reset) plus the
// post-signup profile-verification wizard. An authenticated visitor is sent to
// /home - except inside the wizard, where 19d's signUp leaves them
// authenticated on purpose.
export default function AuthLayout() {
  const { checked, loggedIn } = useAppSlice();
  const segments = useSegments();
  const inProfileVerification = segments.includes('profile-verification');

  if (!checked) return null;
  const to = authRedirect('auth', { loggedIn, inProfileVerification });
  if (to) return <Redirect href={to} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
