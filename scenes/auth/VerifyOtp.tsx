import { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme, useCountdown } from '@/hooks';
import { useAuthSlice } from '@/slices';
import { useVerifyOtpMutation, useRequestOtpMutation, setTokens } from '@/services';
import { OtpChannel, SessionTokenPair } from '@/types';
import { otpVerifyErrorMessage, otpRequestErrorMessage } from '@/utils/otpErrors';
import { formatCountdown, parseEpochParam } from '@/utils/countdown';
import { setPendingResetToken } from '@/utils/resetToken';
import { layoutStyle, buttonStyle as sharedButton } from '@/styles';
import Button from '@/components/elements/Button';
import AuthHeader from '@/components/elements/AuthHeader';
import AuthTitleBlock from '@/components/elements/AuthTitleBlock';
import OtpInput from '@/components/elements/OtpInput';
import SuccessSheet from '@/components/elements/SuccessSheet';

const OTP_LENGTH = 4;
/** How long "Resend Code" stays disabled after any send. */
const RESEND_COOLDOWN_MS = 30_000;
/** Backend `OTP_EXPIRES_IN_MINUTES` default, for a resend with no better hint. */
const DEFAULT_EXPIRES_MINUTES = 5;

type VerifyOtpFlow = 'signup' | 'reset';

/**
 * expo-router serializes every param to a string. `email` is the legacy name
 * still sent by the reset flow; sign-up sends `destination` + `channel` and
 * the epoch-ms timestamps the countdowns run against.
 */
type VerifyOtpParams = {
  flow?: VerifyOtpFlow;
  email?: string;
  destination?: string;
  channel?: OtpChannel;
  sentAt?: string;
  expiresAt?: string;
  expiresInMinutes?: string;
};

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
  expiry: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  expiryTime: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
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
  const params = useLocalSearchParams<VerifyOtpParams>();
  const { flow } = params;
  const isResetFlow = flow === 'reset';
  const target = params.destination ?? params.email;
  const channel: OtpChannel = params.channel === 'sms' ? 'sms' : 'email';

  const { dispatch, sessionEstablished } = useAuthSlice();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [requestOtp, { isLoading: isRequesting }] = useRequestOtpMutation();

  const [code, setCode] = useState('');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const sessionRef = useRef<SessionTokenPair | null>(null);

  // Absolute timestamps: a backgrounded app resumes on the right second, and
  // a resend simply moves them forward. The reset flow passes none, so its
  // screen shows no expiry line and no initial cooldown.
  const [expiresAt, setExpiresAt] = useState(() => parseEpochParam(params.expiresAt));
  const [sentAt, setSentAt] = useState(() => parseEpochParam(params.sentAt));
  const remaining = useCountdown(expiresAt);
  const cooldown = useCountdown(sentAt === null ? null : sentAt + RESEND_COOLDOWN_MS);
  const isExpired = expiresAt !== null && remaining === 0;

  const missingDestination = !target;
  const missingDestinationMessage = isResetFlow
    ? 'Something went wrong. Start the password reset again.'
    : 'Something went wrong. Start sign-up again.';
  const displayError = missingDestination ? missingDestinationMessage : error;
  const isComplete = code.length === OTP_LENGTH;

  function handleCodeChange(next: string) {
    setCode(next);
    if (error) setError(undefined);
    if (notice) setNotice(undefined);
  }

  async function proceedToOnboarding() {
    const pair = sessionRef.current;
    if (!pair) return;
    await setTokens({
      token: pair.token,
      refreshToken: pair.refreshToken,
      tokenExpires: pair.tokenExpires,
    });
    dispatch(sessionEstablished(pair.user));
    router.replace('/creator-onboarding');
  }

  async function handleVerify() {
    if (!isComplete || isVerifying || isExpired) return;

    if (!target) {
      setError(missingDestinationMessage);
      return;
    }

    setError(undefined);
    setNotice(undefined);

    if (isResetFlow) {
      try {
        const res = await verifyOtp({
          destination: target,
          purpose: 'password_reset',
          code,
        }).unwrap();
        if (!('resetToken' in res)) {
          setError('Something went wrong. Please try again.');
          return;
        }
        setPendingResetToken(res.resetToken);
        router.replace({ pathname: '/auth/reset-password', params: { email: target } });
      } catch (err) {
        setError(otpVerifyErrorMessage(err));
      }
      return;
    }

    try {
      const res = await verifyOtp({ destination: target, purpose: 'registration', code }).unwrap();
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
    if (!target || isRequesting || cooldown > 0) return;

    const purpose = isResetFlow ? 'password_reset' : 'registration';
    setError(undefined);
    try {
      await requestOtp({ destination: target, channel, purpose }).unwrap();
      // `POST /auth/otp/request` does not echo the expiry; a fresh code lasts
      // as long as the one register reported.
      const now = Date.now();
      const minutes = Number(params.expiresInMinutes) || DEFAULT_EXPIRES_MINUTES;
      const nextExpiresAt = now + minutes * 60_000;
      setSentAt(now);
      setExpiresAt(nextExpiresAt);
      router.setParams({ sentAt: String(now), expiresAt: String(nextExpiresAt) });
      setCode('');
      setNotice('A new code is on its way.');
    } catch (err) {
      setError(otpRequestErrorMessage(err));
    }
  }

  const title = isResetFlow ? 'OTP Verification' : 'Verification Code';
  const description = isResetFlow
    ? 'Please check your email to reset your password'
    : channel === 'sms'
      ? `We sent a ${OTP_LENGTH}-digit code by SMS to ${target}. Enter it below to finish creating your account.`
      : target
        ? `Check your mail (${target}) to get your verification code. If you don't get it, let us know.`
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

        {expiresAt !== null ? (
          isExpired ? (
            <Text style={[styles.expiry, { color: colors.error }]} testID="otp-expiry">
              Your code has expired. Request a new one.
            </Text>
          ) : (
            <Text style={[styles.expiry, { color: palette.gray[300] }]} testID="otp-expiry">
              Code expires in{' '}
              <Text style={[styles.expiryTime, { color: colors.text.primary }]}>
                {formatCountdown(remaining)}
              </Text>
            </Text>
          )
        ) : null}

        <Text style={[styles.resend, { color: palette.gray[200] }]}>
          Don&apos;t receive the verification code?{' '}
          {cooldown > 0 ? (
            <Text
              style={[styles.resendLink, { color: palette.gray[300] }]}
              testID="otp-resend-cooldown">
              Resend Code in {formatCountdown(cooldown)}
            </Text>
          ) : (
            <Text
              style={[styles.resendLink, { color: palette.primary[400] }]}
              onPress={handleResend}
              testID="otp-resend">
              {isRequesting ? 'Sending…' : 'Resend Code'}
            </Text>
          )}
        </Text>

        <Button
          title="Verify"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          isLoading={isVerifying}
          onPress={handleVerify}
          disabled={!isComplete || isVerifying || missingDestination || isExpired}
        />
      </View>

      {isSuccessOpen && (
        <SuccessSheet
          title="Account Created Successfully"
          description="Enjoy your Experience"
          buttonLabel="Next"
          onButtonPress={proceedToOnboarding}
          onClose={proceedToOnboarding}
        />
      )}
    </SafeAreaView>
  );
}
