import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton, textStyle as sharedText } from '@/styles';
import Button from '@/components/elements/Button';
import TextField from '@/components/elements/TextField';
import AuthHeader from '@/components/elements/AuthHeader';
import Divider from '@/components/elements/Divider';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
  },
  submitButton: {
    marginTop: 8,
  },
  divider: {
    marginTop: 32,
  },
  footer: {
    textAlign: 'center',
    marginTop: 16,
  },
});

export default function SignUp() {
  const { colors, palette } = useTheme();

  const [fullName, setFullName] = useState('Test User');
  const [email, setEmail] = useState('test@example.com');
  const [phone, setPhone] = useState('+8801521000000');
  const [password, setPassword] = useState('pass1234');
  const [confirmPassword, setConfirmPassword] = useState('pass1234');

  const [fullNameError, setFullNameError] = useState<string>();
  const [emailError, setEmailError] = useState<string>();
  const [phoneError, setPhoneError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>();

  function handleSubmit() {
    const isNameValid = fullName.trim().length > 0;
    const isEmailValid = EMAIL_REGEX.test(email.trim());
    const isPhoneValid = phone.trim().length > 0;
    const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;
    const doPasswordsMatch = password === confirmPassword;

    setFullNameError(isNameValid ? undefined : 'Full name is required');
    setEmailError(isEmailValid ? undefined : 'Invalid email');
    setPhoneError(isPhoneValid ? undefined : 'Phone number is required');
    setPasswordError(
      isPasswordValid ? undefined : `Must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
    setConfirmPasswordError(doPasswordsMatch ? undefined : 'Passwords do not match');

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isPasswordValid || !doPasswordsMatch)
      return;

    router.push({ pathname: '/auth/verify-otp', params: { email: email.trim() } });
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <AuthHeader title="Sign Up" onBack={() => router.back()} style={styles.header} />
        <View style={layoutStyle.fieldGroup}>
          <TextField
            label="Full Name"
            placeholder="Gazi Delowar"
            value={fullName}
            onChangeText={text => {
              setFullName(text);
              if (fullNameError) setFullNameError(undefined);
            }}
            error={fullNameError}
          />
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
          />
          <TextField
            label="Phone"
            placeholder="+8801521702480"
            value={phone}
            onChangeText={text => {
              setPhone(text);
              if (phoneError) setPhoneError(undefined);
            }}
            error={phoneError}
            keyboardType="phone-pad"
          />
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
          />
          <TextField
            label="Confirm Password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              if (confirmPasswordError) setConfirmPasswordError(undefined);
            }}
            error={confirmPasswordError}
            secureTextEntry
          />
          <Button
            title="Sign Up"
            titleStyle={sharedButton.primaryTitle}
            style={[sharedButton.primary, styles.submitButton]}
            onPress={handleSubmit}
          />
        </View>
        <Divider style={styles.divider} />
        <Text style={styles.footer}>
          <Text style={[sharedText.footerText, { color: colors.text.secondary }]}>
            Have an account?{' '}
          </Text>
          <Text
            style={[sharedText.footerLink, { color: palette.primary[400] }]}
            onPress={() => router.push('/auth/sign-in')}>
            Sign In
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
