import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks';
import { useAppSlice, useProfileVerificationSlice } from '@/slices';
import { layoutStyle, editProfileStyle } from '@/styles';
import { countryFlags } from '@/data/country-flags';
import { phoneCountries, findPhoneCountry } from '@/data/dial-codes';
import ScreenHeader from '@/components/elements/ScreenHeader';
import CircleAvatar from '@/components/elements/CircleAvatar';
import UnderlineField from '@/components/elements/UnderlineField';
import OptionSheet from '@/components/elements/OptionSheet';
import CountryCodeSheet from '@/components/elements/CountryCodeSheet';
import CalendarPicker from '@/components/elements/CalendarPicker';
import Image from '@/components/elements/Image';

const defaultAvatar = require('@/assets/images/account/avatar.png');
const chevronDownIcon = require('@/assets/images/account/chevron-down.png');
const calendarIcon = require('@/assets/images/account/calendar.png');

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

// Every country from `@/data/country-flags`, alphabetical, keyed by its ISO
// code so the sheet row shows the flag next to the name.
const COUNTRY_OPTIONS = Object.values(countryFlags)
  .map(({ code, country, flag }) => ({ label: country, value: code, icon: { uri: flag } }))
  .sort((a, b) => a.label.localeCompare(b.label));

// Figma pairs a UK flag with a US-formatted `+1 111...` number - see
// docs/screen/profile/edit-profile.md. The number wins now that the prefix
// is a real picker, and `us` also matches the Country field's own default.
const DEFAULT_PHONE_COUNTRY = 'us';

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
}

function genderLabel(value?: string): string | undefined {
  return GENDER_OPTIONS.find(option => option.value === value)?.label;
}

function countryLabel(value?: string): string | undefined {
  return value ? countryFlags[value]?.country : undefined;
}

// The Edit Profile screen (Figma "Profile", node 6001:39044 base state +
// 6399:5469/6398:8469's Gender bottom sheet + 6398:5429's Date of Birth
// calendar) - opened from the Account screen's "Profile" row. Every field
// commits to Redux immediately as it's edited (Full Name/Email to the
// `app` slice's `user`, Phone/Gender/Date of Birth/Country to the
// `profileVerification` slice) rather than needing an explicit Save step,
// since Figma's own navbar shows no save/checkmark icon anywhere across all
// 3 captured states (only hidden variants) - see docs/screen/profile/
// edit-profile.md "Scope notes".
export default function EditProfile() {
  const { colors } = useTheme();
  const { user, dispatch: dispatchApp, setUser } = useAppSlice();
  const {
    phoneNumber,
    phoneCountry,
    gender,
    country,
    dateOfBirth,
    dispatch: dispatchProfile,
    setPhoneNumber,
    setPhoneCountry,
    setGender,
    setCountry,
    setDateOfBirth,
  } = useProfileVerificationSlice();

  const [avatarUri, setAvatarUri] = useState<string>();
  const [isGenderPickerOpen, setIsGenderPickerOpen] = useState(false);
  const [isPhoneCountryPickerOpen, setIsPhoneCountryPickerOpen] = useState(false);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const selectedDate = dateOfBirth ? new Date(dateOfBirth) : undefined;
  const selectedPhoneCountry = findPhoneCountry(phoneCountry ?? DEFAULT_PHONE_COUNTRY);

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    setAvatarUri(result.assets[0].uri);
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Profile"
          onBack={() => router.back()}
          style={editProfileStyle.headerGap}
        />

        <View style={editProfileStyle.avatarRow}>
          <CircleAvatar
            source={avatarUri ? { uri: avatarUri } : defaultAvatar}
            size={120}
            onEditPress={handlePickAvatar}
            testID="edit-profile-avatar"
          />
        </View>

        <UnderlineField
          label="Full Name"
          value={user?.name ?? ''}
          onChangeText={text => dispatchApp(setUser({ name: text, email: user?.email ?? '' }))}
          testID="edit-profile-full-name"
        />
        <UnderlineField
          label="Email"
          value={user?.email ?? ''}
          onChangeText={text => dispatchApp(setUser({ name: user?.name ?? '', email: text }))}
          keyboardType="email-address"
          autoCapitalize="none"
          testID="edit-profile-email"
        />
        <UnderlineField
          label="Phone Number"
          value={phoneNumber ?? '111 467 378 399'}
          onChangeText={text => dispatchProfile(setPhoneNumber(text))}
          keyboardType="phone-pad"
          leadingAdornment={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select country code"
              style={editProfileStyle.phoneLeading}
              onPress={() => setIsPhoneCountryPickerOpen(true)}
              testID="edit-profile-phone-country">
              {!!selectedPhoneCountry && (
                <>
                  <Image
                    source={{ uri: selectedPhoneCountry.flag }}
                    style={editProfileStyle.phoneFlag}
                    contentFit="contain"
                  />
                  <Text style={[editProfileStyle.phoneDialCode, { color: colors.text.primary }]}>
                    {selectedPhoneCountry.dialCode}
                  </Text>
                </>
              )}
              <Image
                source={chevronDownIcon}
                style={editProfileStyle.phoneChevron}
                contentFit="contain"
              />
            </Pressable>
          }
          testID="edit-profile-phone"
        />
        <UnderlineField
          label="Gender"
          value={genderLabel(gender) ?? 'Male'}
          editable={false}
          onPress={() => setIsGenderPickerOpen(true)}
          trailingAdornment={
            <Image
              source={chevronDownIcon}
              style={editProfileStyle.trailingIcon}
              contentFit="contain"
            />
          }
          testID="edit-profile-gender"
        />
        <UnderlineField
          label="Date of Birth"
          value={selectedDate ? formatDate(selectedDate) : '12/27/1995'}
          editable={false}
          onPress={() => setIsDatePickerOpen(true)}
          trailingAdornment={
            <Image
              source={calendarIcon}
              style={editProfileStyle.trailingIcon}
              contentFit="contain"
            />
          }
          testID="edit-profile-date-of-birth"
        />
        <UnderlineField
          label="Country"
          value={countryLabel(country) ?? 'United States'}
          editable={false}
          onPress={() => setIsCountryPickerOpen(true)}
          trailingAdornment={
            <Image
              source={chevronDownIcon}
              style={editProfileStyle.trailingIcon}
              contentFit="contain"
            />
          }
          testID="edit-profile-country"
        />
      </ScrollView>

      {isGenderPickerOpen && (
        <OptionSheet
          options={GENDER_OPTIONS}
          value={gender}
          onSelect={value => {
            dispatchProfile(setGender(value));
            setIsGenderPickerOpen(false);
          }}
          onClose={() => setIsGenderPickerOpen(false)}
        />
      )}

      {isPhoneCountryPickerOpen && (
        <CountryCodeSheet
          options={phoneCountries}
          value={phoneCountry ?? DEFAULT_PHONE_COUNTRY}
          onSelect={code => {
            dispatchProfile(setPhoneCountry(code));
            setIsPhoneCountryPickerOpen(false);
          }}
          onClose={() => setIsPhoneCountryPickerOpen(false)}
        />
      )}

      {isCountryPickerOpen && (
        <OptionSheet
          options={COUNTRY_OPTIONS}
          value={country}
          onSelect={value => {
            dispatchProfile(setCountry(value));
            setIsCountryPickerOpen(false);
          }}
          onClose={() => setIsCountryPickerOpen(false)}
        />
      )}

      {isDatePickerOpen && (
        <CalendarPicker
          value={selectedDate}
          maxDate={new Date()}
          onSelect={date => {
            dispatchProfile(setDateOfBirth(date.toISOString()));
            setIsDatePickerOpen(false);
          }}
          onClose={() => setIsDatePickerOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}
