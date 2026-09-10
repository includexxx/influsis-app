import { describe, expect, test } from '@jest/globals';
import reducer, {
  ONBOARDING_TOTAL_STEPS,
  saveBasics,
  saveLocation,
  saveContentCategories,
  saveLanguages,
  saveDeliverables,
  savePhotos,
  savePortfolio,
  saveHandle,
  completeOnboarding,
  goToStep,
  markStepComplete,
  reset,
  CreatorOnboardingState,
} from './creatorOnboarding.slice';
import {
  BasicInformationValues,
  ContentCategoriesValues,
  LocationValues,
  MultiSelectValues,
  PhotosValues,
  PortfolioEntry,
} from '@/utils/onboardingSchemas';

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

const contentCategories: ContentCategoriesValues = {
  categories: [{ value: 'music', subcategories: ['singing', 'covers'] }],
  othersText: '',
};

const languages: MultiSelectValues = { selected: ['english', 'others'], othersText: 'Bengali' };

const deliverables: MultiSelectValues = { selected: ['reel', 'story'], othersText: '' };

const photos: PhotosValues = {
  profilePhoto: { uri: 'file:///profile.jpg', mimeType: 'image/jpeg', fileName: 'profile.jpg' },
  coverPhoto: { uri: 'file:///cover.jpg', mimeType: 'image/jpeg', fileName: 'cover.jpg' },
};

const portfolio: PortfolioEntry[] = [
  { id: 'a', url: 'instagram.com/p/abc', platform: 'instagram' },
  { id: 'b', url: 'https://youtu.be/xyz', platform: 'youtube' },
];

describe('creatorOnboarding slice', () => {
  test('starts on step 1 with nothing completed or drafted', () => {
    const expected: CreatorOnboardingState = {
      currentStep: 1,
      completedSteps: [],
      completed: false,
      basics: undefined,
      location: undefined,
      contentCategories: undefined,
      languages: undefined,
      deliverables: undefined,
      profilePhoto: undefined,
      coverPhoto: undefined,
      portfolio: undefined,
      handle: undefined,
    };
    expect(initial).toEqual(expected);
    expect(initial.handle).toBeUndefined();
    expect(initial.completed).toBe(false);
  });

  test('saveBasics stores the Step 1 values', () => {
    expect(reducer(initial, saveBasics(basics)).basics).toEqual(basics);
  });

  test('saveLocation stores the Step 2 values', () => {
    expect(reducer(initial, saveLocation(location)).location).toEqual(location);
  });

  test('saveContentCategories stores the Step 3 values', () => {
    expect(reducer(initial, saveContentCategories(contentCategories)).contentCategories).toEqual(
      contentCategories,
    );
  });

  test('saveLanguages and saveDeliverables store the Step 4 / 5 values', () => {
    expect(reducer(initial, saveLanguages(languages)).languages).toEqual(languages);
    expect(reducer(initial, saveDeliverables(deliverables)).deliverables).toEqual(deliverables);
  });

  test('savePhotos stores both descriptors and savePhotos({}) clears them', () => {
    const withPhotos = reducer(initial, savePhotos(photos));
    expect(withPhotos.profilePhoto).toEqual(photos.profilePhoto);
    expect(withPhotos.coverPhoto).toEqual(photos.coverPhoto);

    const cleared = reducer(withPhotos, savePhotos({}));
    expect(cleared.profilePhoto).toBeUndefined();
    expect(cleared.coverPhoto).toBeUndefined();
  });

  test('savePortfolio stores the entry list and savePortfolio([]) clears it', () => {
    expect(reducer(initial, savePortfolio(portfolio)).portfolio).toEqual(portfolio);
    const cleared = reducer(reducer(initial, savePortfolio(portfolio)), savePortfolio([]));
    expect(cleared.portfolio).toEqual([]);
  });

  test('saveHandle stores the Step 8 handle', () => {
    expect(reducer(initial, saveHandle('ayesha_rahman')).handle).toBe('ayesha_rahman');
  });

  test('completeOnboarding sets completed and marks step 8 done', () => {
    const done = reducer(initial, completeOnboarding());
    expect(done.completed).toBe(true);
    expect(done.completedSteps).toContain(ONBOARDING_TOTAL_STEPS);
    // Idempotent - the step is not pushed twice.
    expect(reducer(done, completeOnboarding()).completedSteps).toEqual([ONBOARDING_TOTAL_STEPS]);
  });

  test('reset clears the handle and the completed flag', () => {
    const dirty = [saveHandle('ayesha_rahman'), completeOnboarding()].reduce(reducer, initial);
    const cleared = reducer(dirty, reset());
    expect(cleared.handle).toBeUndefined();
    expect(cleared.completed).toBe(false);
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
    const actions = [
      saveBasics(basics),
      saveLocation(location),
      saveContentCategories(contentCategories),
      saveLanguages(languages),
      saveDeliverables(deliverables),
      savePhotos(photos),
      savePortfolio(portfolio),
      goToStep(4),
      markStepComplete(1),
    ];
    const dirty = actions.reduce(reducer, initial);
    expect(reducer(dirty, reset())).toEqual(initial);
  });
});
