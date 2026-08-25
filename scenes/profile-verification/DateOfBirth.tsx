import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton, profileStepStyle } from '@/styles';
import { useProfileVerificationSlice } from '@/slices';
import Button from '@/components/elements/Button';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import DateField from '@/components/elements/DateField';
import CalendarPicker from '@/components/elements/CalendarPicker';

const TOTAL_STEPS = 5;

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
}

export default function DateOfBirth() {
  const { colors } = useTheme();
  const { dateOfBirth, setDateOfBirth, dispatch } = useProfileVerificationSlice();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [error, setError] = useState<string>();

  const selectedDate = dateOfBirth ? new Date(dateOfBirth) : undefined;

  function handleSelect(date: Date) {
    dispatch(setDateOfBirth(date.toISOString()));
    setError(undefined);
    setIsPickerOpen(false);
  }

  function handleNext() {
    if (!dateOfBirth) {
      setError('Please select your date of birth');
      return;
    }
    router.push('/profile-verification/categories');
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={[layoutStyle.scrollContent, layoutStyle.screen]}>
        <ProfileStepHeader
          step={1}
          totalSteps={TOTAL_STEPS}
          title="When were you born?"
          description="Businesses seek creators within age ranges for campaign"
          style={profileStepStyle.header}
        />
        <DateField
          label="Date"
          value={selectedDate ? formatDate(selectedDate) : undefined}
          helperText="MM/DD/YYYY"
          error={error}
          onPress={() => setIsPickerOpen(true)}
          testID="date-of-birth-field"
        />
      </View>
      <View style={layoutStyle.scrollContent}>
        <Button
          title="Next"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={handleNext}
        />
      </View>

      {isPickerOpen && (
        <CalendarPicker
          value={selectedDate}
          maxDate={new Date()}
          onSelect={handleSelect}
          onClose={() => setIsPickerOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}
