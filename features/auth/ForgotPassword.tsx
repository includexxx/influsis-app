import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
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
});

export default function ForgotPassword() {
  const { colors } = useTheme();

  const [email, setEmail] = useState('test@example.com');
  const [emailError, setEmailError] = useState<string>();

  function handleSubmit() {
    const isEmailValid = EMAIL_REGEX.test(email.trim());
    setEmailError(isEmailValid ? undefined : 'Invalid email');
    if (!isEmailValid) return;

    router.push({ pathname: '/auth/verify-otp', params: { email: email.trim(), flow: 'reset' } });
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
          <TextField
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (emailError) setEmailError(undefined);
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
            onPress={handleSubmit}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
