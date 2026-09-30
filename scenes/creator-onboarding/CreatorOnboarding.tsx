import { ComponentType } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { useCreatorOnboardingSlice } from '@/slices';
import BasicInformationStep from './components/BasicInformationStep';
import BioStep from './components/BioStep';
import LocationStep from './components/LocationStep';
import ContentCategoriesStep from './components/ContentCategoriesStep';
import SubcategoriesStep from './components/SubcategoriesStep';
import LanguagesStep from './components/LanguagesStep';
import DeliverablesStep from './components/DeliverablesStep';
import PhotosStep from './components/PhotosStep';
import PortfolioStep from './components/PortfolioStep';
import UsernameStep from './components/UsernameStep';
import PlaceholderStep from './components/PlaceholderStep';
import OnboardingComplete from './OnboardingComplete';
import { useGetMyProfileQuery } from '@/services';

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
  const { data } = useGetMyProfileQuery();

  function renderStep() {
    if (currentStep === 1) {
      return <BasicInformationStep name={data?.profile.name} />;
    }

    const StepComponent = STEP_COMPONENTS[currentStep] ?? PlaceholderStep;
    return <StepComponent />;
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      {completed ? <OnboardingComplete /> : renderStep()}
    </SafeAreaView>
  );
}
