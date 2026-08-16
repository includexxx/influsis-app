import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton, textStyle as sharedText } from '@/styles';
import { phoneCountries, findPhoneCountry } from '@/data/dial-codes';
import Button from '@/components/elements/Button';
import TextField from '@/components/elements/TextField';
import AuthHeader from '@/components/elements/AuthHeader';
import CountryCodeSheet from '@/components/elements/CountryCodeSheet';
import Divider from '@/components/elements/Divider';
import Image from '@/components/elements/Image';

const chevronDownIcon = require('@/assets/images/account/chevron-down.png');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// Matches the `+880` this screen's phone field was already seeded with.
const DEFAULT_PHONE_COUNTRY = 'bd';

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
  },
  // Sits inside TextField's existing bordered row via `leftAdornment`, sized
  // to that row's own 14px type so the field's shape is unchanged.
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
  },
  phoneFlag: {
    width: 20,
    height: 14,
  },
  phoneDialCode: {
    fontSize: 14,
  },
  phoneChevron: {
    width: 14,
    height: 14,
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
  // Local digits only - the dial code lives in `phoneCountry` and is shown
  // by the field's own prefix, the same split Edit Profile uses.
  const [phone, setPhone] = useState('1521000000');
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const [isPhoneCountryPickerOpen, setIsPhoneCountryPickerOpen] = useState(false);
  const [password, setPassword] = useState('pass1234');
  const [confirmPassword, setConfirmPassword] = useState('pass1234');

  const [fullNameError, setFullNameError] = useState<string>();
  const [emailError, setEmailError] = useState<string>();
  const [phoneError, setPhoneError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>();

  const selectedPhoneCountry = findPhoneCountry(phoneCountry);

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
            placeholder="1521702480"
            value={phone}
            onChangeText={text => {
              setPhone(text);
              if (phoneError) setPhoneError(undefined);
            }}
            error={phoneError}
            keyboardType="phone-pad"
            leftAdornment={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select country code"
                hitSlop={8}
                style={styles.phonePrefix}
                onPress={() => setIsPhoneCountryPickerOpen(true)}
                testID="sign-up-phone-country">
                {!!selectedPhoneCountry && (
                  <>
                    <Image
                      source={{ uri: selectedPhoneCountry.flag }}
                      style={styles.phoneFlag}
                      contentFit="contain"
                    />
                    <Text style={[styles.phoneDialCode, { color: colors.text.primary }]}>
                      {selectedPhoneCountry.dialCode}
                    </Text>
                  </>
                )}
                <Image source={chevronDownIcon} style={styles.phoneChevron} contentFit="contain" />
              </Pressable>
            }
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

      {isPhoneCountryPickerOpen && (
        <CountryCodeSheet
          options={phoneCountries}
          value={phoneCountry}
          onSelect={code => {
            setPhoneCountry(code);
            setIsPhoneCountryPickerOpen(false);
          }}
          onClose={() => setIsPhoneCountryPickerOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}
