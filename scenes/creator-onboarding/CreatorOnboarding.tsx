import { ComponentType } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import BasicInformationStep from './steps/BasicInformationStep';
import LocationStep from './steps/LocationStep';
import PlaceholderStep from './steps/PlaceholderStep';

// The private, post-registration creator onboarding wizard - one screen, the
// active step chosen by `currentStep` in the `creatorOnboarding` slice.
// Steps 3-8 are placeholders until 20c-20g fill them in; each real step
// owns its own header, form, and CTA row (the shell only owns the
// themed background).
const STEP_COMPONENTS: Record<number, ComponentType> = {
  1: BasicInformationStep,
  2: LocationStep,
};

export default function CreatorOnboarding() {
  const { colors } = useTheme();
  const { currentStep } = useCreatorOnboardingSlice();
  const StepComponent = STEP_COMPONENTS[currentStep] ?? PlaceholderStep;

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <StepComponent />
    </SafeAreaView>
  );
}
