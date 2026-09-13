import { View, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import {
  languagesSchema,
  MultiSelectValues,
  OTHERS_TEXT_MAX_LENGTH,
} from '@/utils/onboardingSchemas';
import { LANGUAGE_OPTIONS, OTHER_OPTION_VALUE } from '@/data/onboardingOptions';
import OnboardingStepScreen from '@/components/elements/OnboardingStepScreen';
import SelectableRow from '@/components/elements/SelectableRow';
import OnboardingTextField from '@/components/elements/OnboardingTextField';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

// Step 6 of the creator onboarding wizard - Languages (requirements §3 Screen
// 4; step 6 after build-plan 20h split Categories/Subcategories and 21 added
// the Bio step). Multi-select from six presets, minimum one. Selecting "Others" reveals a
// free-text row; its trimmed value is stored alongside the presets. `Next`
// stays greyed until the schema passes.
export default function LanguagesStep() {
  const { colors } = useTheme();
  const { languages, dispatch, saveLanguages } = useCreatorOnboardingSlice();
  const { totalSteps, saveAndContinue, back } = useCreatorOnboardingStep();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<MultiSelectValues>({
    resolver: zodResolver(languagesSchema),
    mode: 'onChange',
    defaultValues: languages ?? { selected: [], othersText: '' },
  });

  const selected = watch('selected') ?? [];

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    setValue('selected', next, { shouldValidate: true });
    if (value === OTHER_OPTION_VALUE && !next.includes(OTHER_OPTION_VALUE)) {
      setValue('othersText', '', { shouldValidate: true });
    }
  }

  function onSubmit(values: MultiSelectValues) {
    dispatch(saveLanguages(values));
    saveAndContinue();
  }

  return (
    <OnboardingStepScreen
      step={6}
      totalSteps={totalSteps}
      title="What languages are you fluent in?"
      description="Businesses match creators by the languages they speak"
      onBack={back}
      onNext={handleSubmit(onSubmit)}
      nextDisabled={!isValid}>
      <View style={profileStepStyle.fields}>
        <Text style={[profileStepStyle.sectionLabel, { color: colors.text.primary }]}>
          Languages
        </Text>
        <View style={profileStepStyle.fields}>
          {LANGUAGE_OPTIONS.map(option => (
            <View key={option.value}>
              <SelectableRow
                label={option.label}
                selected={selected.includes(option.value)}
                onPress={() => toggle(option.value)}
                testID={`onboarding-language-${option.value}`}
              />
              {option.value === OTHER_OPTION_VALUE && selected.includes(OTHER_OPTION_VALUE) ? (
                <OnboardingTextField
                  control={control}
                  name="othersText"
                  placeholder="Add a language"
                  maxLength={OTHERS_TEXT_MAX_LENGTH}
                  autoCapitalize="words"
                  containerStyle={profileStepStyle.otherInput}
                  testID="onboarding-language-other-text"
                />
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </OnboardingStepScreen>
  );
}
