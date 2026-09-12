import { ReactNode } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import { spacing } from '@/theme';
import { layoutStyle, buttonStyle as sharedButton, profileStepStyle } from '@/styles';
import Button from '../Button';
import ProfileStepHeader from '../ProfileStepHeader';

export interface OnboardingStepScreenProps {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  /** Renders the header back chevron; omit on step 1. */
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  nextTestID?: string;
  /** Extra control shown in the pinned footer, above the primary CTA. */
  footerSlot?: ReactNode;
  children: ReactNode;
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
});

// The one layout every creator onboarding step renders through (build-plan
// 22): a scrollable body under the shared ProfileStepHeader, keyboard
// avoidance, and a pinned footer with a hairline top divider holding the
// primary CTA. Steps pass their own form fields as `children` and their real
// "can advance" condition as `nextDisabled`; the gating logic itself is not
// standardized here, only the frame. Bottom-sheet siblings stay outside this
// component (render `<><OnboardingStepScreen/>{sheets}</>`).
function OnboardingStepScreen({
  step,
  totalSteps,
  title,
  description,
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = 'Next',
  nextTestID = 'onboarding-next',
  footerSlot,
  children,
}: OnboardingStepScreenProps) {
  const { palette } = useTheme();

  return (
    <KeyboardAvoidingView
      style={layoutStyle.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ProfileStepHeader
          step={step}
          totalSteps={totalSteps}
          title={title}
          description={description}
          onBack={onBack}
          style={profileStepStyle.header}
        />
        {children}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: palette.gray[100] }]}>
        {footerSlot}
        <Button
          title={nextLabel}
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={onNext}
          disabled={nextDisabled}
          testID={nextTestID}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

export default OnboardingStepScreen;
