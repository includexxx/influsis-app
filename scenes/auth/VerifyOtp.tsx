import { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks';
import { useAuthSlice } from '@/slices';
import { useVerifyOtpMutation, useRequestOtpMutation, setTokens } from '@/services';
import { SessionTokenPair } from '@/types';
import { otpVerifyErrorMessage, otpRequestErrorMessage } from '@/utils/otpErrors';
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
  message: {
    fontSize: 14,
    fontWeight: '600',
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

  const { dispatch, sessionEstablished } = useAuthSlice();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [requestOtp, { isLoading: isRequesting }] = useRequestOtpMutation();

  const [code, setCode] = useState('');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const sessionRef = useRef<SessionTokenPair | null>(null);

  const missingEmail = !isResetFlow && !email;
  const displayError = missingEmail ? 'Something went wrong. Start sign-up again.' : error;
  const isComplete = code.length === OTP_LENGTH;

  function handleCodeChange(next: string) {
    setCode(next);
    if (error) setError(undefined);
    if (notice) setNotice(undefined);
  }

  async function proceedToProfileSetup() {
    const pair = sessionRef.current;
    if (!pair) return;
    await setTokens({
      token: pair.token,
      refreshToken: pair.refreshToken,
      tokenExpires: pair.tokenExpires,
    });
    dispatch(sessionEstablished(pair.user));
    router.replace('/profile-verification/date-of-birth');
  }

  async function handleVerify() {
    if (!isComplete || isVerifying) return;

    if (isResetFlow) {
      router.replace({ pathname: '/auth/reset-password', params: { email } });
      return;
    }

    if (!email) {
      setError('Something went wrong. Start sign-up again.');
      return;
    }

    setError(undefined);
    setNotice(undefined);
    try {
      const res = await verifyOtp({ destination: email, purpose: 'registration', code }).unwrap();
      if (!('token' in res)) {
        setError('Something went wrong. Please try again.');
        return;
      }
      sessionRef.current = res;
      setIsSuccessOpen(true);
    } catch (err) {
      setError(otpVerifyErrorMessage(err));
    }
  }

  async function handleResend() {
    if (isResetFlow) {
      setCode('');
      return;
    }
    if (!email || isRequesting) return;

    setError(undefined);
    try {
      await requestOtp({ destination: email, channel: 'email', purpose: 'registration' }).unwrap();
      setCode('');
      setNotice('A new code is on its way.');
    } catch (err) {
      setError(otpRequestErrorMessage(err));
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

        <OtpInput
          length={OTP_LENGTH}
          value={code}
          onChange={handleCodeChange}
          error={!!displayError}
        />

        {displayError ? (
          <Text style={[styles.message, { color: colors.error }]}>{displayError}</Text>
        ) : notice ? (
          <Text style={[styles.message, { color: palette.primary[400] }]}>{notice}</Text>
        ) : null}

        <Text style={[styles.resend, { color: palette.gray[200] }]}>
          Don&apos;t receive the verification code?{' '}
          <Text style={[styles.resendLink, { color: palette.primary[400] }]} onPress={handleResend}>
            Resend Code
          </Text>
        </Text>

        <Button
          title="Verify"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          isLoading={isVerifying}
          onPress={handleVerify}
          disabled={!isComplete || isVerifying || missingEmail}
        />
      </View>

      {isSuccessOpen && (
        <SuccessSheet
          title="Account Created Successfully"
          description="Enjoy your Experience"
          buttonLabel="Next"
          onButtonPress={proceedToProfileSetup}
          onClose={proceedToProfileSetup}
        />
      )}
    </SafeAreaView>
  );
}
