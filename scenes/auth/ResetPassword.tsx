import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError, useResetPasswordMutation } from '@/services';
import { resetPasswordSchema, ResetPasswordValues } from '@/utils/authSchemas';
import { applyApiError } from '@/utils/authFormErrors';
import { clearPendingResetToken, getPendingResetToken } from '@/utils/resetToken';
import SuccessSheet from '@/components/elements/SuccessSheet';
import {
  AuthScaffold,
  AuthSubmitButton,
  AuthSwitchLink,
  AuthTextField,
  FormAlert,
  PasswordStrengthMeter,
  ResetSteps,
} from './components';

const EXPIRED_LINK = 'This reset link has expired. Start the reset again.';

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  submit: {
    marginTop: 4,
  },
});

function startOver() {
  router.replace('/auth/forgot-password');
}

// Step 3 of the password reset: the new password (with a strength meter) and
// its confirmation, sent with the single-use reset token the OTP screen held
// in memory (POST /auth/reset-password). Without a token - a cold restart, or
// one the backend reports expired - the form is disabled and the banner
// offers to start over. Success opens a sheet that leads to sign-in.
export default function ResetPassword() {
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [resetToken] = useState(getPendingResetToken);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const tokenMissing = !resetToken;

  const {
    control,
    handleSubmit,
    setError,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });
  const newPassword = useWatch({ control, name: 'newPassword' });

  async function onSubmit(values: ResetPasswordValues) {
    if (!resetToken) return;
    clearErrors('root');
    try {
      await resetPassword({ resetToken, newPassword: values.newPassword }).unwrap();
      clearPendingResetToken();
      setIsSuccessOpen(true);
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'NOT_FOUND' || !!err.errors?.resetToken)) {
        setError('root', { message: EXPIRED_LINK });
        return;
      }
      applyApiError(err, setError, ['newPassword']);
    }
  }

  const submit = handleSubmit(onSubmit);
  const formError = tokenMissing ? EXPIRED_LINK : errors.root?.message;

  return (
    <>
      <AuthScaffold
        title="Set a new password"
        subtitle="Choose a strong password that's different from the one you used before."
        onBack={() => router.back()}
        footer={
          <AuthSwitchLink
            prompt="Remembered it?"
            action="Back to sign in"
            onPress={() => router.replace('/auth/sign-in')}
            testID="reset-password-go-sign-in"
          />
        }
        testID="reset-password-screen">
        <View style={styles.form}>
          <ResetSteps current={3} />
          <AuthTextField
            control={control}
            name="newPassword"
            label="New password"
            icon="lock"
            placeholder="At least 8 characters"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => setFocus('confirmPassword')}
            editable={!tokenMissing}
            testID="reset-password-new">
            <PasswordStrengthMeter password={newPassword} />
          </AuthTextField>
          <AuthTextField
            control={control}
            name="confirmPassword"
            label="Confirm new password"
            icon="shield"
            placeholder="Re-enter your new password"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={submit}
            editable={!tokenMissing}
            testID="reset-password-confirm"
          />

          <FormAlert
            message={formError}
            action={
              formError === EXPIRED_LINK ? { label: 'Start over', onPress: startOver } : undefined
            }
          />

          <View style={styles.submit}>
            <AuthSubmitButton
              title="Reset password"
              isLoading={isLoading || isSubmitting}
              disabled={tokenMissing}
              onPress={submit}
              testID="reset-password-submit"
            />
          </View>
        </View>
      </AuthScaffold>

      {isSuccessOpen && (
        <SuccessSheet
          title="Password reset"
          description="Your password has been updated. Sign in with your new password to get started."
          buttonLabel="Sign in"
          onButtonPress={() => router.replace('/auth/sign-in')}
          onClose={() => setIsSuccessOpen(false)}
        />
      )}
    </>
  );
}
