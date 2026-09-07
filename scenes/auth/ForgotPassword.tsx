import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { ApiError } from '@/services/http';
import { requestOtp } from '@/services/auth.service';
import { authErrorMessage } from '@/utils/authError';
import { layoutStyle, buttonStyle } from '@/styles';
import Button from '@/components/elements/Button';
import TextField from '@/components/elements/TextField';
import AuthHeader from '@/components/elements/AuthHeader';
import AuthTitleBlock from '@/components/elements/AuthTitleBlock';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  formError: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default function ForgotPassword() {
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;

    const destination = email.trim();
    const isEmailValid = EMAIL_REGEX.test(destination);
    setFormError(undefined);
    setEmailError(isEmailValid ? undefined : 'Invalid email');
    if (!isEmailValid) return;

    setSubmitting(true);
    try {
      await requestOtp({ destination, channel: 'email', purpose: 'password_reset' });
      router.push({ pathname: '/auth/verify-otp', params: { email: destination, flow: 'reset' } });
    } catch (err) {
      setFormError(
        err instanceof ApiError ? authErrorMessage(err) : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={layoutStyle.scrollContent}>
        <AuthHeader onBack={() => router.back()} style={styles.header} />
        <AuthTitleBlock
          title="Forget Password"
          description="Enter your email account to reset your password."
        />
        <View style={layoutStyle.fieldGroup}>
          {!!formError && (
            <Text style={[styles.formError, { color: colors.error }]}>{formError}</Text>
          )}
          <TextField
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (emailError) setEmailError(undefined);
              if (formError) setFormError(undefined);
            }}
            error={emailError}
            autoCapitalize="none"
            keyboardType="email-address"
            testID="forgot-password-email"
          />
          <Button
            title="Send"
            titleStyle={buttonStyle.primaryTitle}
            style={buttonStyle.primary}
            isLoading={submitting}
            onPress={handleSubmit}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
