import { Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import { layoutStyle, profileStepStyle } from '@/styles';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import { useCreatorOnboardingStep } from '../useCreatorOnboardingStep';

// Provisional heading for the not-yet-built final step (requirements §2).
// 20g replaces this with its own component and finalises its own copy.
const STEP_META: Record<number, { title: string; description: string }> = {
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
