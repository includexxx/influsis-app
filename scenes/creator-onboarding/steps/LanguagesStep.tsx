import { View, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { layoutStyle, buttonStyle as sharedButton, profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import {
  languagesSchema,
  MultiSelectValues,
  OTHERS_TEXT_MAX_LENGTH,
} from '@/utils/onboardingSchemas';
import { LANGUAGE_OPTIONS, OTHER_OPTION_VALUE } from '@/data/onboardingOptions';
import Button from '@/components/elements/Button';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import SelectableRow from '@/components/elements/SelectableRow';
import ControlledTextField from '@/components/elements/ControlledTextField';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

// Step 6 of the creator onboarding wizard - Languages (requirements §3 Screen
// 4; step 6 after build-plan 20h split Categories/Subcategories and 21 added
// the Bio step). Multi-select from six presets, minimum one. Selecting "Others" reveals a
// free-text row; its trimmed value is stored alongside the presets. `Next`
// stays greyed until the schema passes.
export default function LanguagesStep() {
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
    <>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ProfileStepHeader
          step={6}
          totalSteps={totalSteps}
          title="What languages are you fluent in?"
          description="Businesses match creators by the languages they speak"
          onBack={back}
          style={profileStepStyle.header}
        />

        <View style={profileStepStyle.optionList}>
          {LANGUAGE_OPTIONS.map(option => (
            <View key={option.value}>
              <SelectableRow
                label={option.label}
                selected={selected.includes(option.value)}
                onPress={() => toggle(option.value)}
                testID={`onboarding-language-${option.value}`}
              />
              {option.value === OTHER_OPTION_VALUE && selected.includes(OTHER_OPTION_VALUE) ? (
                <ControlledTextField
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
