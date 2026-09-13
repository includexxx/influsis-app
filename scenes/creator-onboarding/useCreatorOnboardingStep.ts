import { useCreatorOnboardingSlice, ONBOARDING_TOTAL_STEPS } from '@/slices';

/**
 * Navigation API for the onboarding wizard's step machine. A step component
 * dispatches its own typed save action (e.g. `saveBasics`) and then calls
 * `saveAndContinue()`; an optional step calls `skip()` instead. Both mark the
 * current step complete and advance, so a later forward jump isn't blocked -
 * `skip` will also drop the step's draft once optional steps (20e/20f) exist.
 */
export function useCreatorOnboardingStep() {
  const { currentStep, completedSteps, dispatch, goToStep, markStepComplete } =
    useCreatorOnboardingSlice();

  const isFirstStep = currentStep <= 1;
  const isLastStep = currentStep >= ONBOARDING_TOTAL_STEPS;

  function completeAndAdvance() {
    dispatch(markStepComplete(currentStep));
    if (!isLastStep) dispatch(goToStep(currentStep + 1));
  }

  return {
    currentStep,
    totalSteps: ONBOARDING_TOTAL_STEPS,
    completedSteps,
    isFirstStep,
    isLastStep,
    saveAndContinue: completeAndAdvance,
    skip: completeAndAdvance,
    back() {
      if (!isFirstStep) dispatch(goToStep(currentStep - 1));
    },
  };
}
