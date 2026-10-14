import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { useAuthSlice } from '@/slices';
import { useLoginMutation, useRequestOtpMutation, setTokens } from '@/services';
import { OtpChannel } from '@/types';
import { Env } from '@/types/env';
import config from '@/utils/config';
import { signInSchema, SignInValues } from '@/utils/authSchemas';
import { applyApiError } from '@/utils/authFormErrors';
import { normalizeIdentifier } from '@/utils/phone';
import { setPendingPreAuthToken } from '@/utils/preAuthToken';
import {
  AuthScaffold,
  AuthSubmitButton,
  AuthSwitchLink,
  AuthTextField,
  FormAlert,
} from './components';

/** Backend `OTP_EXPIRES_IN_MINUTES` default - `POST /auth/otp/request` does not report it. */
const OTP_EXPIRES_MINUTES = 5;

// Dev builds start pre-filled with the seeded test creator for quick sign-in.
const DEFAULT_VALUES: SignInValues =
  config.env === Env.dev
    ? { identifier: 'creator1@test.com', password: 'pass1234' }
    : { identifier: '', password: '' };

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgot: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  submit: {
    marginTop: 4,
  },
});

// Email / phone sign-in (POST /auth/login). On success it stores the token
// pair and opens Home, or onboarding when the creator never finished it. Two
// detours: an account with 2FA continues on /auth/verify-2fa, and one that
// registered but never verified gets a fresh code and resumes on the OTP
// screen. Errors land on their field, or in the banner above the button.
export default function SignIn() {
  const { palette, isDark } = useTheme();
  const { dispatch, sessionEstablished } = useAuthSlice();
  const [login, { isLoading }] = useLoginMutation();
  const [requestOtp] = useRequestOtpMutation();

  const {
    control,
    handleSubmit,
    setError,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: DEFAULT_VALUES,
  });

  async function onSubmit(values: SignInValues) {
    clearErrors('root');
    try {
      const res = await login({
        // A phone typed as `017...` is looked up as an email unless it is E.164.
        identifier: normalizeIdentifier(values.identifier),
        password: values.password,
      }).unwrap();

      if ('mfaRequired' in res) {
        setPendingPreAuthToken(res.preAuthToken);
        router.push('/auth/verify-2fa');
        return;
      }

      // Registered but never entered the code (closed the app mid sign-up):
      // send a fresh one and resume on the OTP screen. No tokens are stored
      // here - the `(auth)` gate would bounce an authenticated user to /home.
      if (res.user.status === 'unverified') {
        const destination = res.user.phone ?? res.user.email;
        if (destination) {
          const channel: OtpChannel = res.user.phone ? 'sms' : 'email';
          try {
            await requestOtp({ destination, channel, purpose: 'registration' }).unwrap();
          } catch {
            // The OTP screen offers a resend; a failed send here is not fatal.
          }
          const sentAt = Date.now();
          router.push({
            pathname: '/auth/verify-otp',
            params: {
              destination,
              channel,
              sentAt: String(sentAt),
              expiresAt: String(sentAt + OTP_EXPIRES_MINUTES * 60_000),
              expiresInMinutes: String(OTP_EXPIRES_MINUTES),
            },
          });
          return;
        }
      }

      await setTokens({
        token: res.token,
        refreshToken: res.refreshToken,
        tokenExpires: res.tokenExpires,
      });
      dispatch(sessionEstablished(res.user));

      if (!res?.user?.isOnboardingComplete) {
        router.replace('/creator-onboarding');
      } else {
        router.replace('/home');
      }
    } catch (err) {
      applyApiError(err, setError, ['identifier', 'password']);
    }
  }

  const submit = handleSubmit(onSubmit);

  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="Sign in to manage your campaigns, offers and payouts."
      onBack={() => router.push('/auth')}
      footer={
        <AuthSwitchLink
          prompt="New to Influsis?"
          action="Create an account"
          onPress={() => router.push('/auth/sign-up')}
          testID="sign-in-go-sign-up"
        />
      }
      testID="sign-in-screen">
      <View style={styles.form}>
        <AuthTextField
          control={control}
          name="identifier"
          label="Email or phone"
          icon="user"
          placeholder="you@example.com or 01XXXXXXXXX"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => setFocus('password')}
          testID="sign-in-email"
        />
        <AuthTextField
          control={control}
          name="password"
          label="Password"
          icon="lock"
          placeholder="Enter your password"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          testID="sign-in-password"
        />
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => router.push('/auth/forgot-password')}
          style={styles.forgotRow}
          testID="sign-in-forgot-password">
          <Text
            style={[
              styles.forgot,
              { color: isDark ? palette.primary[300] : palette.primary[500] },
            ]}>
            Forgot password?
          </Text>
        </Pressable>

        <FormAlert message={errors.root?.message} />

        <View style={styles.submit}>
          <AuthSubmitButton
            title="Sign in"
            isLoading={isLoading || isSubmitting}
            onPress={submit}
            testID="sign-in-submit"
          />
        </View>
      </View>
    </AuthScaffold>
  );
}
