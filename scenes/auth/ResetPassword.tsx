import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { ApiError, useResetPasswordMutation } from '@/services';
import { resetPasswordSchema, ResetPasswordValues } from '@/utils/authSchemas';
import { applyApiError } from '@/utils/authFormErrors';
import { clearPendingResetToken, getPendingResetToken } from '@/utils/resetToken';
import { layoutStyle, buttonStyle as sharedButton } from '@/styles';
import Button from '@/components/elements/Button';
import ControlledTextField from '@/components/elements/ControlledTextField';
import AuthHeader from '@/components/elements/AuthHeader';
import AuthTitleBlock from '@/components/elements/AuthTitleBlock';
import SuccessSheet from '@/components/elements/SuccessSheet';

const EXPIRED_LINK = 'This reset link has expired. Start the reset again.';

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  formError: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default function ResetPassword() {
  const { colors } = useTheme();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [resetToken] = useState(getPendingResetToken);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const tokenMissing = !resetToken;

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

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

  const formError = tokenMissing ? EXPIRED_LINK : errors.root?.message;

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={layoutStyle.scrollContent}>
        <AuthHeader onBack={() => router.back()} style={styles.header} />
        <AuthTitleBlock
          title="Create New Password"
          description="Your new password must be different from your previously used password."
        />
        <View style={layoutStyle.fieldGroup}>
          <ControlledTextField
            control={control}
            name="newPassword"
            label="New Password"
            placeholder="Enter new password"
            secureTextEntry
            testID="reset-password-new"
          />
          <ControlledTextField
            control={control}
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm new password"
            secureTextEntry
            testID="reset-password-confirm"
          />
          {formError ? (
            <Text style={[styles.formError, { color: colors.error }]}>{formError}</Text>
          ) : null}
          <Button
            title="Reset Password"
            titleStyle={sharedButton.primaryTitle}
            style={sharedButton.primary}
            isLoading={isLoading || isSubmitting}
            disabled={tokenMissing}
            onPress={handleSubmit(onSubmit)}
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
