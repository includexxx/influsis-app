import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks';
import Button from '@/components/elements/Button';
import AuthHeader from '@/components/elements/AuthHeader';
import OtpInput from '@/components/elements/OtpInput';

const OTP_LENGTH = 4;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 32,
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
  submitButton: {
    height: 54,
    borderRadius: 12,
  },
  submitButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default function VerifyOtp() {
  const { colors, palette } = useTheme();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [code, setCode] = useState('');

  function handleResend() {
    setCode('');
  }

  function handleVerify() {
    if (code.length < OTP_LENGTH) return;

    router.replace('/welcome');
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <AuthHeader onBack={() => router.back()} style={styles.header} />
        <Text style={[styles.description, { color: colors.text.secondary }]}>
          <Text style={{ color: colors.text.primary, fontWeight: '700', fontSize: 20 }}>
            Verification Code{'\n'}
          </Text>
          {email
            ? `Check your mail (${email}) to get your verification code. If you don't get it, let us know.`
            : "Check your mail to get your verification code. If you don't get it, let us know."}
        </Text>

        <OtpInput length={OTP_LENGTH} value={code} onChange={setCode} />

        <Text style={[styles.resend, { color: palette.gray[200] }]}>
          Don&apos;t receive the verification code?{' '}
          <Text style={[styles.resendLink, { color: palette.primary[400] }]} onPress={handleResend}>
            Resend Code
          </Text>
        </Text>

        <Button
          title="Verify"
          titleStyle={styles.submitButtonTitle}
          style={[styles.submitButton, { backgroundColor: palette.primary[400] }]}
          onPress={handleVerify}
        />
      </View>
    </SafeAreaView>
  );
}
