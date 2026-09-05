import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks';
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

  function handleResend() {
    setCode('');
  }

  const isComplete = code.length === OTP_LENGTH;

  function handleVerify() {
    if (!isComplete) return;

    if (isResetFlow) {
      router.replace({ pathname: '/auth/reset-password', params: { email } });
      return;
    }

    setIsSuccessOpen(true);
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

        <OtpInput length={OTP_LENGTH} value={code} onChange={setCode} />

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
          onPress={handleVerify}
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
