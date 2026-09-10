import { View, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { layoutStyle, buttonStyle as sharedButton, profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import { deliverablesSchema, MultiSelectValues } from '@/utils/onboardingSchemas';
import { DELIVERABLE_OPTIONS } from '@/data/onboardingOptions';
import Button from '@/components/elements/Button';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import SelectableRow from '@/components/elements/SelectableRow';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

// Step 5 of the creator onboarding wizard - Deliverables (requirements §3
// Screen 5). Multi-select from six content types, minimum one. Same control as
// the Languages step, no "Others". `Next` stays greyed until the schema passes.
export default function DeliverablesStep() {
  const { deliverables, dispatch, saveDeliverables } = useCreatorOnboardingSlice();
  const { totalSteps, saveAndContinue, back } = useCreatorOnboardingStep();

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<MultiSelectValues>({
    resolver: zodResolver(deliverablesSchema),
    mode: 'onChange',
    defaultValues: deliverables ?? { selected: [], othersText: '' },
  });

  const selected = watch('selected') ?? [];

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    setValue('selected', next, { shouldValidate: true });
  }

  function onSubmit(values: MultiSelectValues) {
    dispatch(saveDeliverables(values));
    saveAndContinue();
  }

  return (
    <>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ProfileStepHeader
          step={5}
          totalSteps={totalSteps}
          title="What can you deliver?"
          description="Choose the content types you offer for campaigns"
          onBack={back}
          style={profileStepStyle.header}
        />

        <View style={profileStepStyle.optionList}>
          {DELIVERABLE_OPTIONS.map(option => (
            <SelectableRow
              key={option.value}
              label={option.label}
              selected={selected.includes(option.value)}
              onPress={() => toggle(option.value)}
              testID={`onboarding-deliverable-${option.value}`}
            />
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
