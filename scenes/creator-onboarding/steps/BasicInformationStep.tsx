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
    setValue,
    watch,
    formState: { isValid },
  } = useForm<BasicInformationValues>({
    resolver: zodResolver(basicInformationSchema),
    mode: 'onChange',
    defaultValues: basics ?? { name: '', gender: undefined, dateOfBirth: '' },
  });

  // The two bottom sheets read/write through the form via watch + setValue so
  // they can render as siblings of the ScrollView, not descendants of it -
  // @gorhom/bottom-sheet positions against its parent and this project has no
  // portal provider (see CustomSelectField's docblock; EditProfile does the
  // same).
  const gender = watch('gender');
  const dateOfBirth = watch('dateOfBirth');

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
            render={({ fieldState }) => (
              <TextField
                label="Gender"
                value={genderLabel(gender)}
                placeholder="Select your gender"
                editable={false}
                onPress={() => setIsGenderOpen(true)}
                error={fieldState.error?.message}
                rightAdornment={
                  <Image source={chevronDownIcon} style={styles.chevron} contentFit="contain" />
                }
                testID="onboarding-gender"
              />
            )}
          />

          <Controller
            control={control}
            name="dateOfBirth"
            render={({ fieldState }) => (
              <DateField
                label="Date of birth"
                value={dateOfBirth ? formatDate(dateOfBirth) : undefined}
                helperText="MM/DD/YYYY"
                error={fieldState.error?.message}
                onPress={() => setIsCalendarOpen(true)}
                style={{ marginTop: 16, padding: 0 }}
                testID="onboarding-dob"
              />
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

      {isGenderOpen && (
        <OptionSheet
          options={GENDER_OPTIONS}
          value={gender}
          onSelect={value => {
            setValue('gender', value as BasicInformationValues['gender'], {
              shouldValidate: true,
            });
            setIsGenderOpen(false);
          }}
          onClose={() => setIsGenderOpen(false)}
        />
      )}

      {isCalendarOpen && (
        <CalendarPicker
          value={dateOfBirth ? new Date(dateOfBirth) : undefined}
          maxDate={new Date()}
          onSelect={date => {
            setValue('dateOfBirth', date.toISOString(), { shouldValidate: true });
            setIsCalendarOpen(false);
          }}
          onClose={() => setIsCalendarOpen(false)}
        />
      )}
    </>
  );
}
