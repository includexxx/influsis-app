import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import { photosSchema, PhotosValues } from '@/utils/onboardingSchemas';
import OnboardingStepScreen from '@/components/elements/OnboardingStepScreen';
import ImageUploader from '@/components/elements/ImageUploader';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  remove: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
});

// Step 8 of the creator onboarding wizard - Profile + cover photo
// (requirements §3 Screens 6-7, one screen; step 8 after build-plan 20h split
// Categories/Subcategories and 21 added the Bio step). Both images are optional, so
// `Next` is always enabled; each drives the discovery card and adds
// verification credibility. Picked images are stored as
// `{ uri, mimeType, fileName }` descriptors for the 20g FormData assembly.
export default function PhotosStep() {
  const { colors, palette } = useTheme();
  const { profilePhoto, coverPhoto, dispatch, savePhotos } = useCreatorOnboardingSlice();
  const { totalSteps, saveAndContinue, back } = useCreatorOnboardingStep();

  const { handleSubmit, setValue, watch } = useForm<PhotosValues>({
    resolver: zodResolver(photosSchema),
    mode: 'onChange',
    defaultValues: { profilePhoto, coverPhoto },
  });

  const currentProfile = watch('profilePhoto');
  const currentCover = watch('coverPhoto');

  function onSubmit(values: PhotosValues) {
    dispatch(savePhotos(values));
    saveAndContinue();
  }

  return (
    <OnboardingStepScreen
      step={8}
      totalSteps={totalSteps}
      title="Add your photos"
      description="Your profile and cover photo power your discovery card and build trust with businesses"
      onBack={back}
      onNext={handleSubmit(onSubmit)}
      nextDisabled={false}>
      <View style={profileStepStyle.fields}>
        <View style={styles.field}>
          <Text style={[profileStepStyle.sectionLabel, { color: colors.text.primary }]}>
            Profile photo
          </Text>
          <ImageUploader
            imageUri={currentProfile?.uri}
            aspect={[1, 1]}
            onChange={(_uri, asset) => setValue('profilePhoto', asset, { shouldValidate: true })}
            testID="onboarding-profile-photo"
          />
          {currentProfile ? (
            <Pressable
              accessibilityRole="button"
              style={styles.remove}
              onPress={() => setValue('profilePhoto', undefined, { shouldValidate: true })}
              testID="onboarding-profile-photo-remove">
              <Text style={[profileStepStyle.helperText, { color: palette.primary[500] }]}>
                Remove photo
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={[profileStepStyle.sectionLabel, { color: colors.text.primary }]}>
            Cover photo
          </Text>
          <ImageUploader
            imageUri={currentCover?.uri}
            aspect={[16, 9]}
            onChange={(_uri, asset) => setValue('coverPhoto', asset, { shouldValidate: true })}
            testID="onboarding-cover-photo"
          />
          {currentCover ? (
            <Pressable
              accessibilityRole="button"
              style={styles.remove}
              onPress={() => setValue('coverPhoto', undefined, { shouldValidate: true })}
              testID="onboarding-cover-photo-remove">
              <Text style={[profileStepStyle.helperText, { color: palette.primary[500] }]}>
                Remove photo
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={[profileStepStyle.helperText, { color: palette.gray[300] }]}>
          Both are recommended but optional - you can add or change them anytime.
        </Text>
      </View>
    </OnboardingStepScreen>
  );
}
