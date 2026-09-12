import { useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import { locationSchema, LocationValues } from '@/utils/onboardingSchemas';
import { getCities, getDivisions, LOCKED_COUNTRY } from '@/data/locations';
import OnboardingStepScreen from '@/components/elements/OnboardingStepScreen';
import CustomSelectField from '@/components/elements/CustomSelectField';
import OnboardingTextField from '@/components/elements/OnboardingTextField';
import OptionSheet from '@/components/elements/OptionSheet';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

// Step 3 of the creator onboarding wizard - Location (requirements §3 Screen
// 2; step 3 since build-plan 21 added the Bio step at position 2). Country is
// locked to Bangladesh for V1; City is a hard filter in Search
// & Discovery so it is always a picked value from the chosen Division's
// district list. `Next` stays greyed until the schema passes.
export default function LocationStep() {
  const { location, dispatch, saveLocation } = useCreatorOnboardingSlice();
  const { totalSteps, saveAndContinue, back } = useCreatorOnboardingStep();

  const [isDivisionOpen, setIsDivisionOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<LocationValues>({
    resolver: zodResolver(locationSchema),
    mode: 'onChange',
    defaultValues: location ?? {
      country: 'bangladesh',
      division: undefined,
      city: '',
      zip: '',
    },
  });

  // The Division / City option sheets render as siblings of the ScrollView
  // (not descendants), driven through watch + setValue - @gorhom/bottom-sheet
  // positions against its parent and there is no portal provider here.
  const division = watch('division');
  const city = watch('city');

  const divisionOptions = getDivisions(LOCKED_COUNTRY.value);
  const cityOptions = getCities(LOCKED_COUNTRY.value, division);

  function onSubmit(values: LocationValues) {
    dispatch(saveLocation(values));
    saveAndContinue();
  }

  return (
    <>
      <OnboardingStepScreen
        step={3}
        totalSteps={totalSteps}
        title="Where are you based?"
        description="Your city is used to match you with campaigns near you"
        onBack={back}
        onNext={handleSubmit(onSubmit)}
        nextDisabled={!isValid}>
        <View style={profileStepStyle.fields}>
          <CustomSelectField
            label="Country"
            placeholder="Bangladesh"
            value={LOCKED_COUNTRY.value}
            options={[LOCKED_COUNTRY]}
            onPress={() => {}}
            disabled
            testID="onboarding-country"
          />

          <Controller
            control={control}
            name="division"
            render={({ fieldState }) => (
              <CustomSelectField
                label="State/Division"
                placeholder="Select your division"
                value={division}
                options={divisionOptions}
                onPress={() => setIsDivisionOpen(true)}
                error={fieldState.error?.message}
                testID="onboarding-division"
              />
            )}
          />

          <Controller
            control={control}
            name="city"
            render={({ fieldState }) => (
              <CustomSelectField
                label="City"
                placeholder="Select your city"
                value={city || undefined}
                options={cityOptions}
                onPress={() => setIsCityOpen(true)}
                disabled={!division}
                error={fieldState.error?.message}
                testID="onboarding-city"
              />
            )}
          />

          <OnboardingTextField
            control={control}
            name="zip"
            label="Zip / Postal code (optional)"
            placeholder="e.g. 1207"
            keyboardType="number-pad"
            maxLength={10}
            testID="onboarding-zip"
          />
        </View>
      </OnboardingStepScreen>

      {isDivisionOpen && (
        <OptionSheet
          options={divisionOptions}
          value={division}
          onSelect={value => {
            if (value !== division) setValue('city', '', { shouldValidate: true });
            setValue('division', value as LocationValues['division'], { shouldValidate: true });
            setIsDivisionOpen(false);
          }}
          onClose={() => setIsDivisionOpen(false)}
        />
      )}

      {isCityOpen && (
        <OptionSheet
          options={cityOptions}
          value={city}
          onSelect={value => {
            setValue('city', value, { shouldValidate: true });
            setIsCityOpen(false);
          }}
          onClose={() => setIsCityOpen(false)}
        />
      )}
    </>
  );
}
