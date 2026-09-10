import { useDispatch, useSelector } from 'react-redux';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { State, Dispatch } from '@/utils/store';
import {
  BasicInformationValues,
  ContentCategoriesValues,
  LocationValues,
  MultiSelectValues,
  PhotosValues,
  PickedImageAsset,
  PortfolioEntry,
} from '@/utils/onboardingSchemas';

// The creator onboarding wizard is one screen, eight steps
// (creator-onboarding-requirements.md §2). Unlike the retired
// profile-verification wizard and the Create Gig wizard - both a route per
// step - the step here is just `currentStep` in this slice, so Back/forward
// restores each step's saved answer for free.
export const ONBOARDING_TOTAL_STEPS = 8;

export interface CreatorOnboardingState {
  /** 1..ONBOARDING_TOTAL_STEPS. */
  currentStep: number;
  /** Steps whose form has been saved; unique, unordered. */
  completedSteps: number[];
  // Per-step drafts. 20g adds `handle`.
  basics?: BasicInformationValues;
  location?: LocationValues;
  contentCategories?: ContentCategoriesValues;
  languages?: MultiSelectValues;
  deliverables?: MultiSelectValues;
  profilePhoto?: PickedImageAsset;
  coverPhoto?: PickedImageAsset;
  portfolio?: PortfolioEntry[];
}

const initialState: CreatorOnboardingState = {
  currentStep: 1,
  completedSteps: [],
  basics: undefined,
  location: undefined,
  contentCategories: undefined,
  languages: undefined,
  deliverables: undefined,
  profilePhoto: undefined,
  coverPhoto: undefined,
  portfolio: undefined,
};

function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 1;
  return Math.min(Math.max(Math.round(step), 1), ONBOARDING_TOTAL_STEPS);
}

const slice = createSlice({
  name: 'creatorOnboarding',
  initialState,
  reducers: {
    saveBasics: (
      state: CreatorOnboardingState,
      { payload }: PayloadAction<BasicInformationValues>,
    ) => {
      state.basics = payload;
    },
    saveLocation: (state: CreatorOnboardingState, { payload }: PayloadAction<LocationValues>) => {
      state.location = payload;
    },
    saveContentCategories: (
      state: CreatorOnboardingState,
      { payload }: PayloadAction<ContentCategoriesValues>,
    ) => {
      state.contentCategories = payload;
    },
    saveLanguages: (
      state: CreatorOnboardingState,
      { payload }: PayloadAction<MultiSelectValues>,
    ) => {
      state.languages = payload;
    },
    saveDeliverables: (
      state: CreatorOnboardingState,
      { payload }: PayloadAction<MultiSelectValues>,
    ) => {
      state.deliverables = payload;
    },
    savePhotos: (state: CreatorOnboardingState, { payload }: PayloadAction<PhotosValues>) => {
      state.profilePhoto = payload.profilePhoto;
      state.coverPhoto = payload.coverPhoto;
    },
    savePortfolio: (
      state: CreatorOnboardingState,
      { payload }: PayloadAction<PortfolioEntry[]>,
    ) => {
      state.portfolio = payload;
    },
    goToStep: (state: CreatorOnboardingState, { payload }: PayloadAction<number>) => {
      state.currentStep = clampStep(payload);
    },
    markStepComplete: (state: CreatorOnboardingState, { payload }: PayloadAction<number>) => {
      const step = clampStep(payload);
      if (!state.completedSteps.includes(step)) state.completedSteps.push(step);
    },
    reset: () => initialState,
  },
});

export const {
  saveBasics,
  saveLocation,
  saveContentCategories,
  saveLanguages,
  saveDeliverables,
  savePhotos,
  savePortfolio,
  goToStep,
  markStepComplete,
  reset,
} = slice.actions;

export function useCreatorOnboardingSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector(({ creatorOnboarding }: State) => creatorOnboarding);
  return { dispatch, ...state, ...slice.actions };
}

export default slice.reducer;
