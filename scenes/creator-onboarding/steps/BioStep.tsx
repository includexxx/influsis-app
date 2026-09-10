import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton, profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import { bioStepSchema, BioStepValues, BIO_MAX_LENGTH } from '@/utils/onboardingSchemas';
import Button from '@/components/elements/Button';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import ControlledTextField from '@/components/elements/ControlledTextField';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

const styles = StyleSheet.create({
  counter: {
    marginTop: 8,
    alignSelf: 'flex-end',
    fontSize: 13,
    lineHeight: 18,
  },
});

// Step 2 of the creator onboarding wizard - Bio (build-plan 21). One required
// multi-line field for the creator's public bio (20-300 characters after
// trimming), with a live "N characters left" counter under the input.
export default function BioStep() {
  const { palette } = useTheme();
  const { bio, dispatch, saveBio } = useCreatorOnboardingSlice();
  const { totalSteps, saveAndContinue, back } = useCreatorOnboardingStep();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm<BioStepValues>({
    resolver: zodResolver(bioStepSchema),
    mode: 'onChange',
    defaultValues: { bio: bio ?? '' },
  });

  // Raw (untrimmed) length so the counter matches what the user sees typing.
  const charactersLeft = BIO_MAX_LENGTH - (watch('bio')?.length ?? 0);

  function onSubmit(values: BioStepValues) {
    // `values.bio` is already trimmed by the zod resolver.
    dispatch(saveBio(values.bio));
    saveAndContinue();
  }

  return (
    <>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ProfileStepHeader
          step={2}
          totalSteps={totalSteps}
          title="Tell businesses about you"
          description="A short intro shown on your public profile and discovery card"
          onBack={back}
          style={profileStepStyle.header}
        />

        <ControlledTextField
          control={control}
          name="bio"
          placeholder="What do you create, who is it for, and what makes you different?"
          multiline
          maxLength={BIO_MAX_LENGTH}
          inputStyle={profileStepStyle.bioInput}
          autoCapitalize="sentences"
          testID="onboarding-bio"
        />
        <Text
          style={[styles.counter, { color: palette.gray[300] }]}
          testID="onboarding-bio-counter">
          {charactersLeft} characters left
        </Text>
      </ScrollView>

      <View style={layoutStyle.scrollContent}>
        <Button
          title="Next"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid}
          testID="onboarding-next"
        />
      </View>
    </>
  );
}
