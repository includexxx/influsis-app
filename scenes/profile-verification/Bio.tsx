import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton, profileStepStyle } from '@/styles';
import { useProfileVerificationSlice } from '@/slices';
import Button from '@/components/elements/Button';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import TextField from '@/components/elements/TextField';

const TOTAL_STEPS = 5;
const MAX_WORDS = 250;

const styles = StyleSheet.create({
  helper: {
    fontSize: 13,
    lineHeight: 15,
    textAlign: 'right',
    marginTop: 8,
  },
});

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export default function Bio() {
  const { colors, palette } = useTheme();
  const { bio, setBio, dispatch } = useProfileVerificationSlice();
  const [error, setError] = useState<string>();

  function handleChange(text: string) {
    dispatch(setBio(text));
    if (error) setError(undefined);
  }

  function handleNext() {
    if (countWords(bio) > MAX_WORDS) {
      setError(`Please keep it under ${MAX_WORDS} words`);
      return;
    }
    router.push('/profile-verification/username');
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
          title="Write something about passion"
          description="Businesses seek creators within age ranges for campaign"
          style={profileStepStyle.header}
        />
        <TextField
          placeholder="Tell businesses about your passion..."
          value={bio}
          onChangeText={handleChange}
          multiline
          numberOfLines={8}
          inputStyle={profileStepStyle.bioInput}
          error={error}
          testID="bio-field"
        />
        <Text style={[styles.helper, { color: palette.gray[300] }]}>
          Write max {MAX_WORDS} words
        </Text>
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
