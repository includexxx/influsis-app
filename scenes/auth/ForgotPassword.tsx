import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { useRequestOtpMutation } from '@/services';
import { forgotPasswordSchema, ForgotPasswordValues } from '@/utils/authSchemas';
import { otpRequestErrorMessage } from '@/utils/otpErrors';
import { layoutStyle, buttonStyle } from '@/styles';
import Button from '@/components/elements/Button';
import ControlledTextField from '@/components/elements/ControlledTextField';
import AuthHeader from '@/components/elements/AuthHeader';
import AuthTitleBlock from '@/components/elements/AuthTitleBlock';

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

export default function ForgotPassword() {
  const { colors } = useTheme();
  const [requestOtp, { isLoading }] = useRequestOtpMutation();

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    clearErrors('root');
    const email = values.email.trim();
    try {
      await requestOtp({
        destination: email,
        channel: 'email',
        purpose: 'password_reset',
      }).unwrap();
      router.push({ pathname: '/auth/verify-otp', params: { email, flow: 'reset' } });
    } catch (err) {
      setError('root', { message: otpRequestErrorMessage(err) });
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
          <ControlledTextField
            control={control}
            name="email"
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            testID="forgot-password-email"
          />
          {errors.root?.message ? (
            <Text style={[styles.formError, { color: colors.error }]}>{errors.root.message}</Text>
          ) : null}
          <Button
            title="Send"
            titleStyle={buttonStyle.primaryTitle}
            style={buttonStyle.primary}
            isLoading={isLoading || isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
