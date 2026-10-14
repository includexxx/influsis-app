import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { useRegisterMutation } from '@/services';
import { signUpSchema, SignUpValues } from '@/utils/authSchemas';
import { applyApiError } from '@/utils/authFormErrors';
import { DEFAULT_DIAL_CODE, isE164, toE164 } from '@/utils/phone';
import { phoneCountries, findPhoneCountry } from '@/data/dial-codes';
import CountryCodeSheet from '@/components/elements/CountryCodeSheet';
import {
  AuthScaffold,
  AuthSubmitButton,
  AuthSwitchLink,
  AuthTextField,
  FormAlert,
  PasswordStrengthMeter,
  PhoneCountryPrefix,
} from './components';

// The phone field starts on Bangladesh (+880).
const DEFAULT_PHONE_COUNTRY = 'bd';

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  submit: {
    marginTop: 4,
  },
});

// Creator sign-up (POST /auth/register). Email, phone or both - at least one
// is required, and the backend sends the verification code by SMS when a
// phone is given. On success it continues on /auth/verify-otp with the
// destination the backend normalized. The password gets a live strength
// meter; errors land on their field, or in the banner above the button.
export default function SignUp() {
  const { colors, palette, isDark } = useTheme();
  const [registerCreator, { isLoading }] = useRegisterMutation();

  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const [isPhoneCountryPickerOpen, setIsPhoneCountryPickerOpen] = useState(false);
  const selectedPhoneCountry = findPhoneCountry(phoneCountry);

  const {
    control,
    handleSubmit,
    setError,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', phone: '', password: '', confirmPassword: '' },
  });
  const password = useWatch({ control, name: 'password' });

  async function onSubmit(values: SignUpValues) {
    clearErrors('root');
    const email = values.email.trim();
    // The schema only checks the national digits; E.164 needs the dial code.
    const phone = values.phone.trim()
      ? toE164(selectedPhoneCountry?.dialCode ?? DEFAULT_DIAL_CODE, values.phone)
      : '';
    if (phone && !isE164(phone)) {
      setError('phone', { message: 'Enter a valid phone number' });
      return;
    }

    try {
      const { verification } = await registerCreator({
        roleKey: 'creator',
        password: values.password,
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
      }).unwrap();

      // The backend picks the channel (SMS when a phone was given) and hands
      // back the normalized destination - use that, not our own, so the
      // verify call hits the same key. Timestamps ride along as params so the
      // OTP screen counts down to absolute times (see `useCountdown`).
      const sentAt = Date.now();
      router.push({
        pathname: '/auth/verify-otp',
        params: {
          destination: verification.destination,
          channel: verification.channel,
          sentAt: String(sentAt),
          expiresAt: String(sentAt + verification.expiresInMinutes * 60_000),
          expiresInMinutes: String(verification.expiresInMinutes),
        },
      });
    } catch (err) {
      applyApiError(err, setError, ['email', 'phone', 'password']);
    }
  }

  const submit = handleSubmit(onSubmit);
  const noteTint = isDark ? 'rgba(239, 239, 253, 0.08)' : palette.primaryNavy[50];

  return (
    <>
      <AuthScaffold
        title="Create your account"
        subtitle="Join Influsis and start landing paid brand collaborations."
        onBack={() => router.push('/auth')}
        footer={
          <AuthSwitchLink
            prompt="Already have an account?"
            action="Sign in"
            onPress={() => router.push('/auth/sign-in')}
            testID="sign-up-go-sign-in"
          />
        }
        testID="sign-up-screen">
        <View style={styles.form}>
          <View style={[styles.note, { backgroundColor: noteTint }]}>
            <Feather name="info" size={16} color={colors.text.secondary} />
            <Text style={[styles.noteText, { color: colors.text.secondary }]}>
              Add an email, a phone number, or both. We&apos;ll send a code to verify it - by SMS
              when you add a phone.
            </Text>
          </View>

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
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => setFocus('phone')}
            testID="sign-up-email"
          />
          <AuthTextField
            control={control}
            name="phone"
            label="Phone"
            placeholder="1XXXXXXXXX"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            leftAdornment={
              <PhoneCountryPrefix
                flag={selectedPhoneCountry?.flag}
                dialCode={selectedPhoneCountry?.dialCode}
                onPress={() => setIsPhoneCountryPickerOpen(true)}
                testID="sign-up-phone-country"
              />
            }
            testID="sign-up-phone"
          />
          <AuthTextField
            control={control}
            name="password"
            label="Password"
            icon="lock"
            placeholder="At least 8 characters"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => setFocus('confirmPassword')}
            testID="sign-up-password">
            <PasswordStrengthMeter password={password} />
          </AuthTextField>
          <AuthTextField
            control={control}
            name="confirmPassword"
            label="Confirm password"
            icon="shield"
            placeholder="Re-enter your password"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={submit}
            testID="sign-up-confirm-password"
          />

          <FormAlert message={errors.root?.message} />

          <View style={styles.submit}>
            <AuthSubmitButton
              title="Create account"
              isLoading={isLoading || isSubmitting}
              onPress={submit}
              testID="sign-up-submit"
            />
          </View>
        </View>
      </AuthScaffold>

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
    </>
  );
}
