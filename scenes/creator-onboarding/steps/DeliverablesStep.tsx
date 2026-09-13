import { View, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import { deliverablesSchema, MultiSelectValues } from '@/utils/onboardingSchemas';
import { DELIVERABLE_OPTIONS } from '@/data/onboardingOptions';
import OnboardingStepScreen from '@/components/elements/OnboardingStepScreen';
import SelectableRow from '@/components/elements/SelectableRow';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

// Step 7 of the creator onboarding wizard - Deliverables (requirements §3
// Screen 5; step 7 after build-plan 20h split Categories/Subcategories and 21
// added the Bio step). Multi-select from six content types, minimum one. Same control as
// the Languages step, no "Others". `Next` stays greyed until the schema passes.
export default function DeliverablesStep() {
  const { colors } = useTheme();
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
    <OnboardingStepScreen
      step={7}
      totalSteps={totalSteps}
      title="What can you deliver?"
      description="Choose the content types you offer for campaigns"
      onBack={back}
      onNext={handleSubmit(onSubmit)}
      nextDisabled={!isValid}>
      <View style={profileStepStyle.fields}>
        <Text style={[profileStepStyle.sectionLabel, { color: colors.text.primary }]}>
          Deliverables
        </Text>
        <View style={profileStepStyle.fields}>
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
      </View>
    </OnboardingStepScreen>
  );
}
