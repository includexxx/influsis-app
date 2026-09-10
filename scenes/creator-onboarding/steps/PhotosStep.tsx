import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton, profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import { photosSchema, PhotosValues } from '@/utils/onboardingSchemas';
import Button from '@/components/elements/Button';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import ImageUploader from '@/components/elements/ImageUploader';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  remove: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  removeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// Step 6 of the creator onboarding wizard - Profile + cover photo
// (requirements §3 Screens 6-7, one screen). Both images are optional, so
// `Next` is always enabled; each drives the discovery card and adds
// verification credibility. Picked images are stored as
// `{ uri, mimeType, fileName }` descriptors for the 20g FormData assembly.
export default function PhotosStep() {
  const { palette } = useTheme();
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
    <>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ProfileStepHeader
          step={6}
          totalSteps={totalSteps}
          title="Add your photos"
          description="Your profile and cover photo power your discovery card and build trust with businesses"
          onBack={back}
          style={profileStepStyle.header}
        />

        <View style={profileStepStyle.optionList}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: palette.gray[900] }]}>Profile photo</Text>
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
                <Text style={[styles.removeText, { color: palette.primary[500] }]}>
                  Remove photo
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: palette.gray[900] }]}>Cover photo</Text>
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
                <Text style={[styles.removeText, { color: palette.primary[500] }]}>
                  Remove photo
                </Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={[styles.removeText, { color: palette.gray[300], fontWeight: '400' }]}>
            Both are recommended but optional - you can add or change them anytime.
          </Text>
        </View>
      </ScrollView>

      <View style={layoutStyle.scrollContent}>
        <Button
          title="Next"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={handleSubmit(onSubmit)}
          disabled={false}
          testID="onboarding-next"
        />
      </View>
    </>
  );
}
