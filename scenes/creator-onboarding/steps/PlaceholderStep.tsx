import { Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import { layoutStyle, profileStepStyle } from '@/styles';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

// Provisional headings for the not-yet-built steps (requirements §2). Each
// real step (20d-20g) replaces this with its own component and finalises
// its own copy.
const STEP_META: Record<number, { title: string; description: string }> = {
  4: {
    title: 'What languages are you fluent in?',
    description: 'Businesses match creators by the languages they speak',
  },
  5: {
    title: 'What can you deliver?',
    description: 'Choose the content types you offer for campaigns',
  },
  6: {
    title: 'Add your photos',
    description: 'A profile and cover photo help businesses discover you',
  },
  7: {
    title: 'Show your best work',
    description: 'Add a few samples so businesses can see your style',
  },
  8: {
    title: 'Claim your username',
    description: 'Your handle is the last step before your profile goes live',
  },
};

const styles = StyleSheet.create({
  note: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export default function PlaceholderStep() {
  const { palette } = useTheme();
  const { currentStep, totalSteps, back } = useCreatorOnboardingStep();
  const meta = STEP_META[currentStep] ?? { title: 'Coming soon', description: '' };

  return (
    <ScrollView
      style={layoutStyle.screen}
      contentContainerStyle={layoutStyle.scrollContent}
      showsVerticalScrollIndicator={false}>
      <ProfileStepHeader
        step={currentStep}
        totalSteps={totalSteps}
        title={meta.title}
        description={meta.description}
        onBack={back}
        style={profileStepStyle.header}
      />
      <Text style={[styles.note, { color: palette.gray[300] }]}>This step is coming soon.</Text>
    </ScrollView>
  );
}
