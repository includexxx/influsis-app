import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { useAppSlice, signIn } from '@/slices';
import { layoutStyle, buttonStyle } from '@/styles';
import Button from '@/components/elements/Button';
import TextField from '@/components/elements/TextField';
import AuthHeader from '@/components/elements/AuthHeader';

// Light client pre-check only - the backend owns password rules and the real
// credential check, and its error is always surfaced too.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
  },
  formError: {
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
});

export default function SignIn() {
  const { colors, palette } = useTheme();
  const { dispatch } = useAppSlice();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  function clearErrors() {
    setEmailError(undefined);
    setPasswordError(undefined);
    setFormError(undefined);
  }

  async function handleSubmit() {
    if (submitting) return;

    const identifier = email.trim();
    const isEmailValid = EMAIL_REGEX.test(identifier);
    const isPasswordPresent = password.length > 0;

    setFormError(undefined);
    setEmailError(isEmailValid ? undefined : 'Enter a valid email address');
    setPasswordError(isPasswordPresent ? undefined : 'Enter your password');

    if (!isEmailValid || !isPasswordPresent) return;

    setSubmitting(true);
    const result = await dispatch(signIn({ identifier, password }));
    setSubmitting(false);

    if (result.status === 'ok') {
      router.replace('/home');
      return;
    }

    if (result.status === 'mfa-unsupported') {
      setFormError(
        'This account needs two-factor authentication, which the app does not support yet.',
      );
      return;
    }

    setFormError(result.message);
    setEmailError(result.fieldErrors.email);
    setPasswordError(result.fieldErrors.password);
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <AuthHeader title="Sign In" onBack={() => router.back()} style={styles.header} />
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
              if (emailError || formError) clearErrors();
            }}
            error={emailError}
            autoCapitalize="none"
            keyboardType="email-address"
            testID="sign-in-email"
          />
          <View>
            <TextField
              label="Password"
              placeholder="Password"
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (passwordError || formError) clearErrors();
              }}
              error={passwordError}
              secureTextEntry
              testID="sign-in-password"
            />
            <Text
              style={[styles.forgotPassword, { color: palette.gray[300] }]}
              onPress={() => router.push('/auth/forgot-password')}>
              Forgot password?
            </Text>
          </View>
          <Button
            title="Sign in"
            titleStyle={buttonStyle.primaryTitle}
            style={buttonStyle.primary}
            isLoading={submitting}
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
