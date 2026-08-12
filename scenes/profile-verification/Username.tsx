import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton, profileStepStyle } from '@/styles';
import { useProfileVerificationSlice } from '@/slices';
import Button from '@/components/elements/Button';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import TextField from '@/components/elements/TextField';

const TOTAL_STEPS = 5;

// No real backend exists yet (docs/PRD.md Epic 2/3) - this stand-in list of
// already-taken names lets the "Name is Not available" error state from
// Figma be reached and demonstrated, same pattern as the auth scenes'
// client-side-only validation.
const TAKEN_USERNAMES = ['admin', 'influsis', 'salman'];

export default function Username() {
  const { colors, palette } = useTheme();
  const { username, setUsername, dispatch } = useProfileVerificationSlice();
  const [error, setError] = useState<string>();

  function handleChange(text: string) {
    dispatch(setUsername(text));
    if (error) setError(undefined);
  }

  function handleNext() {
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Username is required');
      return;
    }
    if (TAKEN_USERNAMES.includes(trimmed.toLowerCase())) {
      setError('Name is Not available');
      return;
    }
    router.push('/profile-verification/completed');
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ProfileStepHeader
          step={5}
          totalSteps={TOTAL_STEPS}
          title="Set your username"
          description="Your user name will be used in your profile URL"
          style={profileStepStyle.header}
        />
        <TextField
          value={username}
          onChangeText={handleChange}
          leftAdornment={
            <Text style={[profileStepStyle.usernamePrefix, { color: palette.gray[300] }]}>
              Influsis.com/
            </Text>
          }
          error={error}
          autoCapitalize="none"
          autoCorrect={false}
          testID="username-field"
        />
      </ScrollView>
      <View style={layoutStyle.scrollContent}>
        <Button
          title="Next"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
}
