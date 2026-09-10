import { describe, expect, test } from '@jest/globals';
import reducer, {
  ONBOARDING_TOTAL_STEPS,
  saveBasics,
  saveLocation,
  goToStep,
  markStepComplete,
  reset,
  CreatorOnboardingState,
} from './creatorOnboarding.slice';
import { BasicInformationValues, LocationValues } from '@/utils/onboardingSchemas';

const initial = reducer(undefined, { type: '@@INIT' });

const basics: BasicInformationValues = {
  name: 'Ayesha Rahman',
  gender: 'female',
  dateOfBirth: '2001-04-12T00:00:00.000Z',
};

const location: LocationValues = {
  country: 'bangladesh',
  division: 'dhaka',
  city: 'Dhaka',
  zip: '1207',
};

describe('creatorOnboarding slice', () => {
  test('starts on step 1 with nothing completed or drafted', () => {
    const expected: CreatorOnboardingState = {
      currentStep: 1,
      completedSteps: [],
      basics: undefined,
      location: undefined,
    };
    expect(initial).toEqual(expected);
  });

  test('saveBasics stores the Step 1 values', () => {
    expect(reducer(initial, saveBasics(basics)).basics).toEqual(basics);
  });

  test('saveLocation stores the Step 2 values', () => {
    expect(reducer(initial, saveLocation(location)).location).toEqual(location);
  });

  test('goToStep clamps below 1 and above the last step', () => {
    expect(reducer(initial, goToStep(0)).currentStep).toBe(1);
    expect(reducer(initial, goToStep(-3)).currentStep).toBe(1);
    expect(reducer(initial, goToStep(99)).currentStep).toBe(ONBOARDING_TOTAL_STEPS);
    expect(reducer(initial, goToStep(3)).currentStep).toBe(3);
  });

  test('markStepComplete records a step once', () => {
    const once = reducer(initial, markStepComplete(1));
    const twice = reducer(once, markStepComplete(1));
    expect(twice.completedSteps).toEqual([1]);
    expect(reducer(twice, markStepComplete(2)).completedSteps).toEqual([1, 2]);
  });

  test('reset returns the initial state', () => {
    const dirty = reducer(
      reducer(reducer(reducer(initial, saveBasics(basics)), saveLocation(location)), goToStep(4)),
      markStepComplete(1),
    );
    expect(reducer(dirty, reset())).toEqual(initial);
  });
});
