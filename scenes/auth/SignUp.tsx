import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { useRegisterMutation } from '@/services';
import { signUpSchema, SignUpValues } from '@/utils/authSchemas';
import { applyApiError } from '@/utils/authFormErrors';
import { layoutStyle, buttonStyle as sharedButton, textStyle as sharedText } from '@/styles';
import { phoneCountries, findPhoneCountry } from '@/data/dial-codes';
import Button from '@/components/elements/Button';
import ControlledTextField from '@/components/elements/ControlledTextField';
import AuthHeader from '@/components/elements/AuthHeader';
import CountryCodeSheet from '@/components/elements/CountryCodeSheet';
import Divider from '@/components/elements/Divider';
import Image from '@/components/elements/Image';

const chevronDownIcon = require('@/assets/images/account/chevron-down.png');

// Matches the `+880` this screen's phone field was already seeded with.
const DEFAULT_PHONE_COUNTRY = 'bd';

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
  },
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
  formError: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
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
  const [registerCreator, { isLoading }] = useRegisterMutation();

  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const [isPhoneCountryPickerOpen, setIsPhoneCountryPickerOpen] = useState(false);
  const selectedPhoneCountry = findPhoneCountry(phoneCountry);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', phone: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: SignUpValues) {
    clearErrors('root');
    const email = values.email.trim();
    try {
      await registerCreator({ roleKey: 'creator', email, password: values.password }).unwrap();
      router.push({ pathname: '/auth/verify-otp', params: { email } });
    } catch (err) {
      applyApiError(err, setError, ['email', 'password']);
    }
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <AuthHeader title="Sign Up" onBack={() => router.push('/auth')} style={styles.header} />
        <View style={layoutStyle.fieldGroup}>
          <ControlledTextField
            control={control}
            name="email"
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <ControlledTextField
            control={control}
            name="phone"
            label="Phone"
            placeholder="1521702480"
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
          <ControlledTextField
            control={control}
            name="password"
            label="Password"
            placeholder="Password"
            secureTextEntry
          />
          <ControlledTextField
            control={control}
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm password"
            secureTextEntry
          />
          {errors.root?.message ? (
            <Text style={[styles.formError, { color: colors.error }]}>{errors.root.message}</Text>
          ) : null}
          <Button
            title="Sign Up"
            titleStyle={sharedButton.primaryTitle}
            style={[sharedButton.primary, styles.submitButton]}
            isLoading={isLoading || isSubmitting}
            onPress={handleSubmit(onSubmit)}
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
