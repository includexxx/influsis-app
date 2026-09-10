import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { layoutStyle, buttonStyle as sharedButton, profileStepStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import {
  basicInformationSchema,
  BasicInformationValues,
  GENDER_OPTIONS,
} from '@/utils/onboardingSchemas';
import Button from '@/components/elements/Button';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import ControlledTextField from '@/components/elements/ControlledTextField';
import TextField from '@/components/elements/TextField';
import DateField from '@/components/elements/DateField';
import CalendarPicker from '@/components/elements/CalendarPicker';
import OptionSheet from '@/components/elements/OptionSheet';
import Image from '@/components/elements/Image';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

const chevronDownIcon = require('@/assets/images/account/chevron-down.png');

const styles = StyleSheet.create({
  chevron: {
    width: 20,
    height: 20,
  },
});

function formatDate(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
}

function genderLabel(value?: string): string {
  return GENDER_OPTIONS.find(option => option.value === value)?.label ?? '';
}

// Step 1 of the creator onboarding wizard - Basic Information (name, gender,
// date of birth; requirements §3 Screen 1). `Next` stays greyed until the
// schema passes, including the minimum-age check on date of birth.
export default function BasicInformationStep() {
  const { basics, dispatch, saveBasics } = useCreatorOnboardingSlice();
  const { totalSteps, saveAndContinue } = useCreatorOnboardingStep();

  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<BasicInformationValues>({
    resolver: zodResolver(basicInformationSchema),
    mode: 'onChange',
    defaultValues: basics ?? { name: '', gender: undefined, dateOfBirth: '' },
  });

  function onSubmit(values: BasicInformationValues) {
    dispatch(saveBasics(values));
    saveAndContinue();
  }

  return (
    <>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ProfileStepHeader
          step={1}
          totalSteps={totalSteps}
          title="Tell us about yourself"
          description="Businesses match creators by age range for their campaigns"
          style={profileStepStyle.header}
        />

        <View style={layoutStyle.fieldGroup}>
          <ControlledTextField
            control={control}
            name="name"
            label="Name"
            placeholder="Your full name"
            autoCapitalize="words"
            testID="onboarding-name"
          />

          <Controller
            control={control}
            name="gender"
            render={({ field, fieldState }) => (
              <View>
                <TextField
                  label="Gender"
                  value={genderLabel(field.value)}
                  placeholder="Select your gender"
                  editable={false}
                  onBlur={field.onBlur}
                  onPress={() => setIsGenderOpen(true)}
                  error={fieldState.error?.message}
                  rightAdornment={
                    <Image source={chevronDownIcon} style={styles.chevron} contentFit="contain" />
                  }
                  testID="onboarding-gender"
                />
                {isGenderOpen && (
                  <OptionSheet
                    options={GENDER_OPTIONS}
                    value={field.value}
                    onSelect={value => {
                      field.onChange(value);
                      setIsGenderOpen(false);
                    }}
                    onClose={() => setIsGenderOpen(false)}
                  />
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field, fieldState }) => (
              <>
                <DateField
                  label="Date of birth"
                  value={field.value ? formatDate(field.value) : undefined}
                  helperText="MM/DD/YYYY"
                  error={fieldState.error?.message}
                  onPress={() => setIsCalendarOpen(true)}
                  testID="onboarding-dob"
                />
                {isCalendarOpen && (
                  <CalendarPicker
                    value={field.value ? new Date(field.value) : undefined}
                    maxDate={new Date()}
                    onSelect={date => {
                      field.onChange(date.toISOString());
                      setIsCalendarOpen(false);
                    }}
                    onClose={() => setIsCalendarOpen(false)}
                  />
                )}
              </>
            )}
          />
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
