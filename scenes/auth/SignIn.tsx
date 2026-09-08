import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { useAuthSlice } from '@/slices';
import { useLoginMutation, setTokens } from '@/services';
import { signInSchema, SignInValues } from '@/utils/authSchemas';
import { applyApiError } from '@/utils/authFormErrors';
import { setPendingPreAuthToken } from '@/utils/preAuthToken';
import { layoutStyle, buttonStyle } from '@/styles';
import Button from '@/components/elements/Button';
import ControlledTextField from '@/components/elements/ControlledTextField';
import AuthHeader from '@/components/elements/AuthHeader';

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  formError: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default function SignIn() {
  const { colors, palette } = useTheme();
  const { dispatch, sessionEstablished } = useAuthSlice();
  const [login, { isLoading }] = useLoginMutation();

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '' },
  });

  async function onSubmit(values: SignInValues) {
    clearErrors('root');
    try {
      const res = await login({
        identifier: values.identifier.trim(),
        password: values.password,
      }).unwrap();

      if ('mfaRequired' in res) {
        setPendingPreAuthToken(res.preAuthToken);
        router.push('/auth/verify-2fa');
        return;
      }

      await setTokens({
        token: res.token,
        refreshToken: res.refreshToken,
        tokenExpires: res.tokenExpires,
      });
      dispatch(sessionEstablished(res.user));
      router.replace('/home');
    } catch (err) {
      applyApiError(err, setError, ['identifier', 'password']);
    }
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <AuthHeader title="Sign In" onBack={() => router.back()} style={styles.header} />
        <View style={layoutStyle.fieldGroup}>
          <ControlledTextField
            control={control}
            name="identifier"
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            testID="sign-in-email"
          />
          <View>
            <ControlledTextField
              control={control}
              name="password"
              label="Password"
              placeholder="Password"
              secureTextEntry
              testID="sign-in-password"
            />
            <Text
              style={[styles.forgotPassword, { color: palette.gray[300] }]}
              onPress={() => router.push('/auth/forgot-password')}>
              Forgot password?
            </Text>
          </View>
          {errors.root?.message ? (
            <Text style={[styles.formError, { color: colors.error }]}>{errors.root.message}</Text>
          ) : null}
          <Button
            title="Sign in"
            titleStyle={buttonStyle.primaryTitle}
            style={buttonStyle.primary}
            isLoading={isLoading || isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
