import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle } from '@/styles';
import Button from '@/components/elements/Button';
import TextField from '@/components/elements/TextField';
import AuthHeader from '@/components/elements/AuthHeader';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// No real auth backend exists yet (see docs/PRD.md Epic 2/3) - this is a
// deliberately simple client-side stand-in so the invalid-email and
// wrong-password states from Figma are still reachable and demonstrable.
const MIN_PASSWORD_LENGTH = 6;

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
});

export default function SignIn() {
  const { colors, palette } = useTheme();

  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('pass1234');
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();

  function handleSubmit() {
    const isEmailValid = EMAIL_REGEX.test(email.trim());
    const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;

    setEmailError(isEmailValid ? undefined : 'Invalid email');
    setPasswordError(isEmailValid && !isPasswordValid ? 'Wrong password' : undefined);

    if (!isEmailValid || !isPasswordValid) return;

    router.replace('/home');
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <AuthHeader title="Sign In" onBack={() => router.back()} style={styles.header} />
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
            testID="sign-in-email"
          />
          <View>
            <TextField
              label="Password"
              placeholder="Password"
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (passwordError) setPasswordError(undefined);
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
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
