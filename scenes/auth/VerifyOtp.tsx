import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks';
import { ApiError } from '@/services/http';
import { requestOtp, verifyOtp } from '@/services/auth.service';
import { otpErrorMessage } from '@/utils/authError';
import { layoutStyle, buttonStyle as sharedButton } from '@/styles';
import Button from '@/components/elements/Button';
import AuthHeader from '@/components/elements/AuthHeader';
import AuthTitleBlock from '@/components/elements/AuthTitleBlock';
import OtpInput from '@/components/elements/OtpInput';
import SuccessSheet from '@/components/elements/SuccessSheet';

const OTP_LENGTH = 4;

type VerifyOtpFlow = 'signup' | 'reset';

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  error: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
  },
  resend: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  resendLink: {
    fontWeight: '600',
  },
});

export default function VerifyOtp() {
  const { colors, palette } = useTheme();
  const { email, flow } = useLocalSearchParams<{ email?: string; flow?: VerifyOtpFlow }>();
  const isResetFlow = flow === 'reset';

  const [code, setCode] = useState('');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const isComplete = code.length === OTP_LENGTH;

  async function handleResend() {
    setError(undefined);
    if (!isResetFlow) {
      // 19f: the signup branch has no real resend until registration is OTP-gated.
      setCode('');
      return;
    }
    if (resending || !email) return;

    setResending(true);
    try {
      await requestOtp({ destination: email, channel: 'email', purpose: 'password_reset' });
      setCode('');
    } catch (err) {
      setError(
        err instanceof ApiError ? otpErrorMessage(err) : 'Something went wrong. Please try again.',
      );
    } finally {
      setResending(false);
    }
  }

  async function handleVerify() {
    if (!isComplete || submitting) return;

    // 19f: the signup branch below is a stub until registration is OTP-gated -
    // it is unreachable today (SignUp goes straight to profile-verification).
    if (!isResetFlow) {
      setIsSuccessOpen(true);
      return;
    }

    setError(undefined);
    if (!email) {
      setError('Start the reset from the Forgot Password screen.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await verifyOtp({ destination: email, purpose: 'password_reset', code });
      if (result.kind === 'reset') {
        router.replace({
          pathname: '/auth/reset-password',
          params: { resetToken: result.resetToken },
        });
        return;
      }
      setError('Something went wrong. Please try again.');
    } catch (err) {
      setError(
        err instanceof ApiError ? otpErrorMessage(err) : 'Something went wrong. Please try again.',
      );
      setCode('');
    } finally {
      setSubmitting(false);
    }
  }

  const title = isResetFlow ? 'OTP Verification' : 'Verification Code';
  const description = isResetFlow
    ? 'Please check your email to reset your password'
    : email
      ? `Check your mail (${email}) to get your verification code. If you don't get it, let us know.`
      : "Check your mail to get your verification code. If you don't get it, let us know.";

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={[layoutStyle.scrollContent, styles.content]}>
        <AuthHeader onBack={() => router.back()} style={styles.header} />
        <AuthTitleBlock title={title} description={description} />

        <OtpInput length={OTP_LENGTH} value={code} onChange={setCode} error={!!error} />

        {!!error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}

        <Text style={[styles.resend, { color: palette.gray[200] }]}>
          Don&apos;t receive the verification code?{' '}
          <Text
            style={[styles.resendLink, { color: palette.primary[400] }]}
            onPress={resending ? undefined : handleResend}>
            Resend Code
          </Text>
        </Text>

        <Button
          title="Verify"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={handleVerify}
          isLoading={submitting}
          disabled={!isComplete}
        />
      </View>

      {isSuccessOpen && (
        <SuccessSheet
          title="Account Created Successfully"
          description="Enjoy your Experience"
          buttonLabel="Next"
          onButtonPress={() => router.replace('/profile-verification/date-of-birth')}
          onClose={() => setIsSuccessOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}
