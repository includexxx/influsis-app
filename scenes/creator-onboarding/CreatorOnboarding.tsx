import { ComponentType } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import BasicInformationStep from './steps/BasicInformationStep';
import BioStep from './steps/BioStep';
import LocationStep from './steps/LocationStep';
import ContentCategoriesStep from './steps/ContentCategoriesStep';
import SubcategoriesStep from './steps/SubcategoriesStep';
import LanguagesStep from './steps/LanguagesStep';
import DeliverablesStep from './steps/DeliverablesStep';
import PhotosStep from './steps/PhotosStep';
import PortfolioStep from './steps/PortfolioStep';
import UsernameStep from './steps/UsernameStep';
import PlaceholderStep from './steps/PlaceholderStep';
import OnboardingComplete from './OnboardingComplete';

// The private, post-registration creator onboarding wizard - one screen, the
// active step chosen by `currentStep` in the `creatorOnboarding` slice. Every
// step 1-10 is now real; `PlaceholderStep` stays only as the unreachable
// `?? PlaceholderStep` fallback. Each real step owns its own header, form,
// and CTA row (the shell only owns the themed background). Once Finish sets
// `completed`, the shell swaps the whole wizard for the completion screen.
const STEP_COMPONENTS: Record<number, ComponentType> = {
  1: BasicInformationStep,
  2: BioStep,
  3: LocationStep,
  4: ContentCategoriesStep,
  5: SubcategoriesStep,
  6: LanguagesStep,
  7: DeliverablesStep,
  8: PhotosStep,
  9: PortfolioStep,
  10: UsernameStep,
};

export default function CreatorOnboarding() {
  const { colors } = useTheme();
  const { currentStep, completed } = useCreatorOnboardingSlice();
  const StepComponent = STEP_COMPONENTS[currentStep] ?? PlaceholderStep;

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      {completed ? <OnboardingComplete /> : <StepComponent />}
    </SafeAreaView>
  );
}
