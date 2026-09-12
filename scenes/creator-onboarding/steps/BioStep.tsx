import { View, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import { bioStepSchema, BioStepValues, BIO_MAX_LENGTH } from '@/utils/onboardingSchemas';
import OnboardingStepScreen from '@/components/elements/OnboardingStepScreen';
import OnboardingTextField from '@/components/elements/OnboardingTextField';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

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
    <OnboardingStepScreen
      step={2}
      totalSteps={totalSteps}
      title="Tell businesses about you"
      description="A short intro shown on your public profile and discovery card"
      onBack={back}
      onNext={handleSubmit(onSubmit)}
      nextDisabled={!isValid}>
      <View>
        <OnboardingTextField
          control={control}
          name="bio"
          label="Your bio"
          placeholder="What do you create, who is it for, and what makes you different?"
          multiline
          maxLength={BIO_MAX_LENGTH}
          inputStyle={profileStepStyle.bioInput}
          autoCapitalize="sentences"
          testID="onboarding-bio"
        />
        <Text
          style={[profileStepStyle.counter, { color: palette.gray[300] }]}
          testID="onboarding-bio-counter">
          {charactersLeft} characters left
        </Text>
      </View>
    </OnboardingStepScreen>
  );
}
