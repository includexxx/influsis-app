import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks';
import { ApiError } from '@/services/http';
import { resetPassword } from '@/services/auth.service';
import { otpErrorMessage } from '@/utils/authError';
import { layoutStyle, buttonStyle as sharedButton } from '@/styles';
import Button from '@/components/elements/Button';
import TextField from '@/components/elements/TextField';
import AuthHeader from '@/components/elements/AuthHeader';
import AuthTitleBlock from '@/components/elements/AuthTitleBlock';
import SuccessSheet from '@/components/elements/SuccessSheet';

// Client pre-check only; the backend owns the real rule (min 8) and its error
// is always surfaced too.
const MIN_PASSWORD_LENGTH = 8;

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  formError: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default function ResetPassword() {
  const { colors } = useTheme();
  const { resetToken } = useLocalSearchParams<{ resetToken?: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string | undefined>(
    resetToken ? undefined : 'Start the reset from the Forgot Password screen.',
  );
  const [submitting, setSubmitting] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  async function handleSubmit() {
    if (submitting || !resetToken) return;

    const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;
    const doPasswordsMatch = password === confirmPassword;

    setFormError(undefined);
    setPasswordError(
      isPasswordValid ? undefined : `Must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
    setConfirmPasswordError(doPasswordsMatch ? undefined : 'Passwords do not match');
    if (!isPasswordValid || !doPasswordsMatch) return;

    setSubmitting(true);
    try {
      await resetPassword({ resetToken, newPassword: password });
      setIsSuccessOpen(true);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? otpErrorMessage(err) : 'Something went wrong. Please try again.',
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
          title="Create New Password"
          description="Your new password must be different from your previously used password."
        />
        <View style={layoutStyle.fieldGroup}>
          {!!formError && (
            <Text style={[styles.formError, { color: colors.error }]}>{formError}</Text>
          )}
          <TextField
            label="New Password"
            placeholder="Enter new password"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (passwordError) setPasswordError(undefined);
              if (formError) setFormError(undefined);
            }}
            error={passwordError}
            secureTextEntry
            testID="reset-password-new"
          />
          <TextField
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              if (confirmPasswordError) setConfirmPasswordError(undefined);
              if (formError) setFormError(undefined);
            }}
            error={confirmPasswordError}
            secureTextEntry
            testID="reset-password-confirm"
          />
          <Button
            title="Reset Password"
            titleStyle={sharedButton.primaryTitle}
            style={sharedButton.primary}
            isLoading={submitting}
            disabled={!resetToken}
            onPress={handleSubmit}
          />
        </View>
      </View>

      {isSuccessOpen && (
        <SuccessSheet
          title="Reset Succesfully"
          description="Please re-login to get started"
          buttonLabel="Log in"
          onButtonPress={() => router.replace('/auth/sign-in')}
          onClose={() => setIsSuccessOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}
