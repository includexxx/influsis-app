import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRequestOtpMutation } from '@/services';
import { forgotPasswordSchema, ForgotPasswordValues } from '@/utils/authSchemas';
import { otpRequestErrorMessage } from '@/utils/otpErrors';
import {
  AuthScaffold,
  AuthSubmitButton,
  AuthSwitchLink,
  AuthTextField,
  FormAlert,
  ResetSteps,
} from './components';

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  submit: {
    marginTop: 4,
  },
});

// Step 1 of the password reset: the creator enters their account email and
// gets a reset code (POST /auth/otp/request, purpose `password_reset`), then
// continues on /auth/verify-otp to enter it. A failed send shows in the
// banner above the button.
export default function ForgotPassword() {
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

  const submit = handleSubmit(onSubmit);

  return (
    <AuthScaffold
      title="Forgot password?"
      subtitle="No worries. Enter the email on your account and we'll send you a code to reset it."
      onBack={() => router.back()}
      footer={
        <AuthSwitchLink
          prompt="Remembered it?"
          action="Back to sign in"
          onPress={() => router.replace('/auth/sign-in')}
          testID="forgot-password-go-sign-in"
        />
      }
      testID="forgot-password-screen">
      <View style={styles.form}>
        <ResetSteps current={1} />
        <AuthTextField
          control={control}
          name="email"
          label="Email"
          icon="mail"
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          returnKeyType="send"
          onSubmitEditing={submit}
          testID="forgot-password-email"
        />

        <FormAlert message={errors.root?.message} />

        <View style={styles.submit}>
          <AuthSubmitButton
            title="Send reset code"
            isLoading={isLoading || isSubmitting}
            onPress={submit}
            testID="forgot-password-submit"
          />
        </View>
      </View>
    </AuthScaffold>
  );
}
