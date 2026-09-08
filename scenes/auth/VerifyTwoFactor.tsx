import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { useAuthSlice } from '@/slices';
import { ApiError, useVerifyLogin2faMutation, setTokens } from '@/services';
import { twoFactorSchema, TwoFactorValues } from '@/utils/authSchemas';
import { twoFactorVerifyErrorMessage } from '@/utils/twoFactorErrors';
import { clearPendingPreAuthToken, getPendingPreAuthToken } from '@/utils/preAuthToken';
import { layoutStyle, buttonStyle as sharedButton } from '@/styles';
import Button from '@/components/elements/Button';
import ControlledTextField from '@/components/elements/ControlledTextField';
import AuthHeader from '@/components/elements/AuthHeader';
import AuthTitleBlock from '@/components/elements/AuthTitleBlock';

const SESSION_EXPIRED = 'Your sign-in session expired. Go back and sign in again.';

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  formError: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default function VerifyTwoFactor() {
  const { colors } = useTheme();
  const { dispatch, sessionEstablished } = useAuthSlice();
  const [verifyLogin2fa, { isLoading }] = useVerifyLogin2faMutation();
  const [preAuthToken] = useState(getPendingPreAuthToken);
  const tokenMissing = !preAuthToken;

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<TwoFactorValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: '' },
  });

  async function onSubmit(values: TwoFactorValues) {
    if (!preAuthToken) return;
    clearErrors('root');
    try {
      const res = await verifyLogin2fa({ preAuthToken, code: values.code.trim() }).unwrap();
      await setTokens({
        token: res.token,
        refreshToken: res.refreshToken,
        tokenExpires: res.tokenExpires,
      });
      dispatch(sessionEstablished(res.user));
      clearPendingPreAuthToken();
      router.replace('/home');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'AUTH_MFA_INVALID_CODE') {
        setError('code', { message: 'That code is incorrect.' });
        return;
      }
      setError('root', { message: twoFactorVerifyErrorMessage(err) });
    }
  }

  const formError = tokenMissing ? SESSION_EXPIRED : errors.root?.message;

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={layoutStyle.scrollContent}>
        <AuthHeader onBack={() => router.back()} style={styles.header} />
        <AuthTitleBlock
          title="Two-Factor Verification"
          description="Enter the 6-digit code from your authenticator app."
        />
        <View style={layoutStyle.fieldGroup}>
          <ControlledTextField
            control={control}
            name="code"
            label="Authentication code"
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            testID="verify-2fa-code"
          />
          {formError ? (
            <Text style={[styles.formError, { color: colors.error }]}>{formError}</Text>
          ) : null}
          <Button
            title="Verify"
            titleStyle={sharedButton.primaryTitle}
            style={sharedButton.primary}
            isLoading={isLoading || isSubmitting}
            disabled={tokenMissing}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
