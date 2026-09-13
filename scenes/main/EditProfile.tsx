import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { nanoid } from '@reduxjs/toolkit';
import { useTheme } from '@/hooks';
import { useAuthSlice } from '@/slices';
import { authApi } from '@/services/authApi';
import { useGetMyProfileQuery, useUpdateMyProfileMutation } from '@/services/profilesApi';
import { uploadPickedImage } from '@/services/mediaUpload';
import { editProfileSchema, EditProfileValues, editProfileCities } from '@/utils/profileSchemas';
import {
  EditProfileMediaKeys,
  toEditProfileDefaults,
  toUpdateMyProfileRequest,
} from '@/utils/profileMappers';
import { handleConflictMessage } from '@/utils/profileErrors';
import { applyApiError } from '@/utils/authFormErrors';
import { GENDER_OPTIONS, PickedImageAsset, PortfolioEntry } from '@/utils/onboardingSchemas';
import { BD_DIVISIONS, LOCKED_COUNTRY } from '@/data/locations';
import {
  CONTENT_CATEGORY_OPTIONS,
  OTHERS_CATEGORY_VALUE,
  getSubcategories,
} from '@/data/contentCategories';
import { LANGUAGE_OPTIONS, DELIVERABLE_OPTIONS } from '@/data/onboardingOptions';
import { detectPlatform } from '@/data/portfolioPlatforms';
import { layoutStyle, editProfileStyle, buttonStyle, profileStepStyle, TAG_COLORS } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import ProfileHero, { PROFILE_HERO_TOP } from '@/components/elements/ProfileHero';
import IconSectionHeader from '@/components/elements/IconSectionHeader';
import CircleAvatar from '@/components/elements/CircleAvatar';
import TextField from '@/components/elements/TextField';
import ControlledTextField from '@/components/elements/ControlledTextField';
import ImageUploader from '@/components/elements/ImageUploader';
import CustomSelectField from '@/components/elements/CustomSelectField';
import OptionSheet from '@/components/elements/OptionSheet';
import DateField from '@/components/elements/DateField';
import CalendarPicker from '@/components/elements/CalendarPicker';
import CategoryChip from '@/components/elements/CategoryChip';
import Divider from '@/components/elements/Divider';
import Toggle from '@/components/elements/Toggle';
import AddItemButton from '@/components/elements/AddItemButton';
import PortfolioEntryCard from '@/components/elements/PortfolioEntryCard';
import Button from '@/components/elements/Button';
import SuccessSheet from '@/components/elements/SuccessSheet';

const defaultAvatar = require('@/assets/images/account/avatar.png');

const EMPTY_DEFAULTS: EditProfileValues = {
  name: '',
  handle: '',
  categories: [],
  subcategories: [],
  languages: [],
  deliverables: [],
  portfolio: [],
  isDiscoverable: true,
};

// Fields the backend's VALIDATION_FAILED `errors` map can name — passed to
// `applyApiError` so a field-level message lands on the right input instead
// of the form-level `root` slot.
const EDIT_PROFILE_FIELD_NAMES = [
  'name',
  'bio',
  'dateOfBirth',
  'gender',
  'country',
  'state',
  'city',
  'postalCode',
  'address',
  'contactEmail',
  'contactPhone',
  'websiteUrl',
] as const;

/** Uploads every locally-picked image on the edit form (avatar, cover, each
 * portfolio thumbnail) in parallel. An `avatarPhoto`/`coverPhoto`/thumbnail
 * that already points at an existing server URL passes through unchanged
 * (see `uploadPickedImage`'s own guard), so re-saving without touching a
 * photo never re-uploads it. */
async function uploadEditProfileMedia(values: EditProfileValues): Promise<EditProfileMediaKeys> {
  const [avatarUrl, coverUrl, thumbnailEntries] = await Promise.all([
    values.avatarPhoto ? uploadPickedImage(values.avatarPhoto, 'avatar.jpg') : undefined,
    values.coverPhoto ? uploadPickedImage(values.coverPhoto, 'cover.jpg') : undefined,
    Promise.all(
      values.portfolio
        .filter(entry => entry.thumbnail)
        .map(async entry => {
          const key = await uploadPickedImage(
            entry.thumbnail as PickedImageAsset,
            `portfolio-${entry.id}.jpg`,
          );
          return [entry.id, key] as const;
        }),
    ),
  ]);

  return {
    avatarUrl,
    coverUrl,
    portfolioThumbnails: Object.fromEntries(thumbnailEntries),
  };
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter(v => v !== value) : [...values, value];
}

// The Edit Profile screen — rewritten onto react-hook-form + zod, seeded from
// `GET /profiles/me` and saved via a dirty-fields-only `PATCH /profiles/me`
// (see utils/profileMappers.ts). The previous version had no form library,
// no validation, and a Save button with no `onPress` at all; every field
// silently went nowhere.
//
// Semantic trap, worth restating here: "Contact Email" (-> `contactEmail`)
// is a public address shown on the creator profile. It is NOT the account's
// login email — that lives on `GET /auth/me` / `useAuthSlice().account` and
// only changes through the OTP-verified auth flow. The two must never be
// conflated; the login email is rendered here as a read-only row.
//
// Phone is kept to the single `contactPhone` string the backend actually
// stores — no dial-code prefix picker (that would need re-deriving a
// country from an opaque stored string, which the previous screen's
// `CountryCodeSheet` never had to do because nothing was ever saved).
export default function EditProfile() {
  const { colors } = useTheme();
  const { account, dispatch } = useAuthSlice();
  const { data, isLoading: isLoadingProfile } = useGetMyProfileQuery();
  const [updateMyProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const [openSheet, setOpenSheet] = useState<'gender' | 'division' | 'city' | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { isDirty, dirtyFields, errors },
  } = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    mode: 'onChange',
    defaultValues: EMPTY_DEFAULTS,
  });

  useEffect(() => {
    if (data) reset(toEditProfileDefaults(data));
  }, [data, reset]);

  const {
    fields: portfolioFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: 'portfolio',
    keyName: '_rhfId',
  });

  const avatarPhoto = watch('avatarPhoto');
  const coverPhoto = watch('coverPhoto');
  const gender = watch('gender');
  const dateOfBirth = watch('dateOfBirth');
  const division = watch('state');
  const city = watch('city');
  const categories = watch('categories');
  const subcategories = watch('subcategories');
  const languages = watch('languages');
  const deliverables = watch('deliverables');
  const isDiscoverable = watch('isDiscoverable');
  const portfolioEntries = watch('portfolio');

  const cityOptions = editProfileCities(division);
  const availableSubcategoryOptions = categories
    .filter(value => value !== OTHERS_CATEGORY_VALUE)
    .flatMap(value => getSubcategories(value));

  const isBusy = isSaving || isUploadingMedia;

  function toggleCategory(value: string) {
    const next = toggleValue(categories, value);
    setValue('categories', next, { shouldDirty: true });
    // Drop any selected subcategory that no longer belongs to a selected category.
    const stillValid = new Set(
      next
        .filter(v => v !== OTHERS_CATEGORY_VALUE)
        .flatMap(v => getSubcategories(v).map(o => o.value)),
    );
    setValue(
      'subcategories',
      subcategories.filter(value_ => stillValid.has(value_)),
      { shouldDirty: true },
    );
  }

  async function onSubmit(values: EditProfileValues) {
    clearErrors('root');
    try {
      setIsUploadingMedia(true);
      const media = await uploadEditProfileMedia(values);
      setIsUploadingMedia(false);

      const body = toUpdateMyProfileRequest(values, dirtyFields, media);
      if (Object.keys(body).length === 0) {
        router.back();
        return;
      }

      const res = await updateMyProfile(body).unwrap();
      if (body.handle || body.name || body.avatarUrl !== undefined) {
        dispatch(authApi.util.invalidateTags(['Me']));
      }
      reset(toEditProfileDefaults(res));
      setIsSuccessOpen(true);
    } catch (err) {
      setIsUploadingMedia(false);
      const conflict = handleConflictMessage(err);
      if (conflict) {
        setError('handle', { message: conflict });
        return;
      }
      applyApiError(err, setError, [...EDIT_PROFILE_FIELD_NAMES]);
    }
  }

  if (isLoadingProfile && !data) {
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title="Edit profile"
          onBack={() => router.back()}
          style={editProfileStyle.headerGap}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[layoutStyle.screen, { backgroundColor: PROFILE_HERO_TOP }]}
      edges={['top', 'left', 'right']}>
      <ScrollView
        style={[layoutStyle.screen, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}>
        <View style={editProfileStyle.heroWrap}>
          <ProfileHero
            title="Edit profile"
            onBack={() => router.back()}
            coverUri={coverPhoto?.uri}
          />
          <View style={editProfileStyle.avatarRing}>
            <CircleAvatar
              source={avatarPhoto?.uri ? { uri: avatarPhoto.uri } : defaultAvatar}
              size={84}
              onEditPress={undefined}
              testID="edit-profile-avatar"
            />
          </View>
        </View>

        <View style={editProfileStyle.body}>
          {/* Photos */}
          <IconSectionHeader icon="camera" label="Profile photo" />
          <Controller
            control={control}
            name="avatarPhoto"
            render={({ field }) => (
              <ImageUploader
                imageUri={field.value?.uri}
                aspect={[1, 1]}
                onChange={(uri, asset) => field.onChange(asset ?? { uri })}
                style={editProfileStyle.photoUploader}
                testID="edit-profile-avatar-upload"
              />
            )}
          />
          <IconSectionHeader icon="image" label="Cover photo" style={{ marginTop: 24 }} />
          <Controller
            control={control}
            name="coverPhoto"
            render={({ field }) => (
              <ImageUploader
                imageUri={field.value?.uri}
                aspect={[16, 9]}
                onChange={(uri, asset) => field.onChange(asset ?? { uri })}
                style={editProfileStyle.photoUploader}
                testID="edit-profile-cover-upload"
              />
            )}
          />

          {/* Identity */}
          <IconSectionHeader icon="user" label="Identity" style={{ marginTop: 24 }} />
          <View style={[layoutStyle.fieldGroup, { marginTop: 12 }]}>
            <ControlledTextField
              control={control}
              name="name"
              label="Full Name"
              testID="edit-profile-full-name"
            />
            <ControlledTextField
              control={control}
              name="handle"
              label="Username"
              autoCapitalize="none"
              leftAdornment={<Text style={{ color: colors.text.primary }}>@</Text>}
              testID="edit-profile-handle"
            />
            <CustomSelectField
              label="Gender"
              placeholder="Select gender"
              value={gender || undefined}
              options={GENDER_OPTIONS}
              onPress={() => setOpenSheet('gender')}
              testID="edit-profile-gender"
            />
            <DateField
              label="Date of Birth"
              value={dateOfBirth ? new Date(dateOfBirth).toLocaleDateString() : undefined}
              onPress={() => setIsDatePickerOpen(true)}
              error={errors.dateOfBirth?.message}
              testID="edit-profile-date-of-birth"
            />
          </View>

          {/* About */}
          <IconSectionHeader icon="align-left" label="About" style={{ marginTop: 24 }} />
          <View style={[layoutStyle.fieldGroup, { marginTop: 12 }]}>
            <ControlledTextField
              control={control}
              name="bio"
              label="Bio"
              multiline
              maxLength={300}
              testID="edit-profile-bio"
            />
          </View>

          {/* Location */}
          <IconSectionHeader icon="map-pin" label="Location" style={{ marginTop: 24 }} />
          <View style={[layoutStyle.fieldGroup, { marginTop: 12 }]}>
            <CustomSelectField
              label="Country"
              placeholder="Bangladesh"
              value={LOCKED_COUNTRY.value}
              options={[LOCKED_COUNTRY]}
              onPress={() => {}}
              disabled
              testID="edit-profile-country"
            />
            <CustomSelectField
              label="Division"
              placeholder="Select division"
              value={division || undefined}
              options={BD_DIVISIONS}
              onPress={() => setOpenSheet('division')}
              testID="edit-profile-division"
            />
            <CustomSelectField
              label="City"
              placeholder="Select city"
              value={city || undefined}
              options={cityOptions}
              onPress={() => setOpenSheet('city')}
              disabled={!division}
              testID="edit-profile-city"
            />
            <ControlledTextField
              control={control}
              name="postalCode"
              label="Postal Code"
              keyboardType="number-pad"
              testID="edit-profile-postal-code"
            />
            <ControlledTextField
              control={control}
              name="address"
              label="Address"
              testID="edit-profile-address"
            />
          </View>

          {/* Contact */}
          <IconSectionHeader icon="mail" label="Contact" style={{ marginTop: 24 }} />
          <View style={[layoutStyle.fieldGroup, { marginTop: 12 }]}>
            <TextField
              label="Login email"
              value={account?.email ?? '—'}
              editable={false}
              testID="edit-profile-login-email"
            />
            <ControlledTextField
              control={control}
              name="contactEmail"
              label="Contact Email"
              keyboardType="email-address"
              autoCapitalize="none"
              testID="edit-profile-contact-email"
            />
            <Text style={[profileStepStyle.helperText, { color: colors.text.secondary }]}>
              Shown on your profile. This is not your login email.
            </Text>
            <ControlledTextField
              control={control}
              name="contactPhone"
              label="Contact Phone"
              keyboardType="phone-pad"
              testID="edit-profile-contact-phone"
            />
            <ControlledTextField
              control={control}
              name="websiteUrl"
              label="Website"
              autoCapitalize="none"
              keyboardType="url"
              testID="edit-profile-website"
            />
          </View>

          {/* Audience — per-type tag colors matching the read-only My
              Profile screen's Category/Subcategories/Languages/Deliverables
              sections (see styles/myProfile.ts's `TAG_COLORS`). */}
          <IconSectionHeader icon="grid" label="Category" style={{ marginTop: 24 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {CONTENT_CATEGORY_OPTIONS.map(option => (
              <CategoryChip
                key={option.value}
                label={option.label}
                selected={categories.includes(option.value)}
                onPress={() => toggleCategory(option.value)}
                selectedColor={TAG_COLORS.category.light.bg}
                selectedTextColor={TAG_COLORS.category.light.text}
                testID={`edit-profile-category-${option.value}`}
              />
            ))}
          </View>

          {availableSubcategoryOptions.length > 0 ? (
            <>
              <IconSectionHeader icon="layers" label="Subcategories" style={{ marginTop: 24 }} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {availableSubcategoryOptions.map(option => (
                  <CategoryChip
                    key={option.value}
                    label={option.label}
                    selected={subcategories.includes(option.value)}
                    onPress={() =>
                      setValue('subcategories', toggleValue(subcategories, option.value), {
                        shouldDirty: true,
                      })
                    }
                    selectedColor={TAG_COLORS.subcategory.light.bg}
                    selectedTextColor={TAG_COLORS.subcategory.light.text}
                    testID={`edit-profile-subcategory-${option.value}`}
                  />
                ))}
              </View>
            </>
          ) : null}

          <IconSectionHeader icon="globe" label="Languages" style={{ marginTop: 24 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {LANGUAGE_OPTIONS.map(option => (
              <CategoryChip
                key={option.value}
                label={option.label}
                selected={languages.includes(option.value)}
                onPress={() =>
                  setValue('languages', toggleValue(languages, option.value), { shouldDirty: true })
                }
                selectedColor={TAG_COLORS.language.light.bg}
                selectedTextColor={TAG_COLORS.language.light.text}
                testID={`edit-profile-language-${option.value}`}
              />
            ))}
          </View>

          <IconSectionHeader icon="package" label="Deliverables" style={{ marginTop: 24 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {DELIVERABLE_OPTIONS.map(option => (
              <CategoryChip
                key={option.value}
                label={option.label}
                selected={deliverables.includes(option.value)}
                onPress={() =>
                  setValue('deliverables', toggleValue(deliverables, option.value), {
                    shouldDirty: true,
                  })
                }
                selectedColor={TAG_COLORS.deliverable.light.bg}
                selectedTextColor={TAG_COLORS.deliverable.light.text}
                testID={`edit-profile-deliverable-${option.value}`}
              />
            ))}
          </View>

          {/* Portfolio */}
          <IconSectionHeader icon="image" label="Portfolio" style={{ marginTop: 24 }} />
          <View style={[layoutStyle.fieldGroup, { marginTop: 12 }]}>
            {portfolioFields.map((field, index) => (
              <PortfolioEntryCard
                key={field._rhfId}
                // `PortfolioEntryCard` types `platform` against the onboarding
                // wizard's closed enum; the edit schema stores it as free text
                // (matching the backend's relaxed domain), but this screen only
                // ever writes one of those four values via `detectPlatform`/the
                // card's own chip row, so the cast is safe.
                entry={(portfolioEntries[index] ?? field) as unknown as PortfolioEntry}
                index={index}
                onChangeUrl={url => {
                  setValue(`portfolio.${index}.url`, url, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setValue(`portfolio.${index}.platform`, detectPlatform(url), {
                    shouldDirty: true,
                  });
                }}
                onChangePlatform={platform =>
                  setValue(`portfolio.${index}.platform`, platform, { shouldDirty: true })
                }
                onChangeThumbnail={asset =>
                  setValue(`portfolio.${index}.thumbnail`, asset, { shouldDirty: true })
                }
                onDelete={() => remove(index)}
                urlError={errors.portfolio?.[index]?.url?.message}
                testID={`edit-profile-portfolio-${index}`}
              />
            ))}
            <AddItemButton
              label={portfolioFields.length === 0 ? 'Add Portfolio' : 'Add Another'}
              onPress={() => append({ id: nanoid(), url: '', platform: 'others' })}
              testID="edit-profile-portfolio-add"
            />
          </View>

          {/* Visibility */}
          <IconSectionHeader icon="eye" label="Visibility" style={{ marginTop: 24 }} />
          <View
            style={[
              layoutStyle.fieldGroup,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 12,
              },
            ]}>
            <Text style={{ color: colors.text.primary }}>
              Show my profile in the creator directory
            </Text>
            <Toggle
              value={isDiscoverable}
              onPress={() => setValue('isDiscoverable', !isDiscoverable, { shouldDirty: true })}
              testID="edit-profile-discoverable"
            />
          </View>

          {errors.root?.message ? (
            <Text style={[profileStepStyle.helperText, { color: colors.error, marginTop: 16 }]}>
              {errors.root.message}
            </Text>
          ) : null}

          <View style={{ marginTop: 24 }}>
            <Button
              style={buttonStyle.primary}
              titleStyle={buttonStyle.primaryTitle}
              title="Save"
              isLoading={isBusy}
              disabled={!isDirty || isBusy}
              onPress={handleSubmit(onSubmit)}
              testID="edit-profile-save"
            />
          </View>
          <Divider label=" " />
        </View>
      </ScrollView>

      {openSheet === 'gender' && (
        <OptionSheet
          options={GENDER_OPTIONS}
          value={gender}
          onSelect={value => {
            setValue('gender', value as EditProfileValues['gender'], { shouldDirty: true });
            setOpenSheet(null);
          }}
          onClose={() => setOpenSheet(null)}
        />
      )}

      {openSheet === 'division' && (
        <OptionSheet
          options={BD_DIVISIONS}
          value={division}
          onSelect={value => {
            if (value !== division) setValue('city', '', { shouldDirty: true });
            setValue('state', value as EditProfileValues['state'], { shouldDirty: true });
            setOpenSheet(null);
          }}
          onClose={() => setOpenSheet(null)}
        />
      )}

      {openSheet === 'city' && (
        <OptionSheet
          options={cityOptions}
          value={city}
          onSelect={value => {
            setValue('city', value, { shouldDirty: true });
            setOpenSheet(null);
          }}
          onClose={() => setOpenSheet(null)}
        />
      )}

      {isDatePickerOpen && (
        <CalendarPicker
          value={dateOfBirth ? new Date(dateOfBirth) : undefined}
          maxDate={new Date()}
          onSelect={date => {
            setValue('dateOfBirth', date.toISOString(), {
              shouldDirty: true,
              shouldValidate: true,
            });
            setIsDatePickerOpen(false);
          }}
          onClose={() => setIsDatePickerOpen(false)}
        />
      )}

      {isSuccessOpen && (
        <SuccessSheet
          title="Profile updated"
          description="Your changes are live."
          buttonLabel="Done"
          onButtonPress={() => {
            setIsSuccessOpen(false);
            router.back();
          }}
          onClose={() => setIsSuccessOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}
