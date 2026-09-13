import { useDispatch, useSelector } from 'react-redux';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { State, Dispatch } from '@/utils/store';
import {
  BasicInformationValues,
  CategoriesStepValues,
  ContentCategoriesDraft,
  LocationValues,
  MultiSelectValues,
  PhotosValues,
  PickedImageAsset,
  PortfolioEntry,
  SubcategoriesStepValues,
} from '@/utils/onboardingSchemas';

// The creator onboarding wizard is one screen, ten steps (build-plan 20h split
// Content Categories into Categories + Subcategories; build-plan 21 added the
// Bio step at position 2). Unlike the retired profile-verification wizard and
// the Create Gig wizard - both a route per step - the step here is just
// `currentStep` in this slice, so Back/forward restores each step's saved
// answer for free.
export const ONBOARDING_TOTAL_STEPS = 10;

export interface CreatorOnboardingState {
  /** 1..ONBOARDING_TOTAL_STEPS. */
  currentStep: number;
  /** Steps whose form has been saved; unique, unordered. */
  completedSteps: number[];
  /** Set once Finish has assembled and logged the submission payload. */
  completed: boolean;
  // Per-step drafts.
  basics?: BasicInformationValues;
  bio?: string;
  location?: LocationValues;
  contentCategories?: ContentCategoriesDraft;
  languages?: MultiSelectValues;
  deliverables?: MultiSelectValues;
  profilePhoto?: PickedImageAsset;
  coverPhoto?: PickedImageAsset;
  portfolio?: PortfolioEntry[];
  handle?: string;
}

const initialState: CreatorOnboardingState = {
  currentStep: 1,
  completedSteps: [],
  completed: false,
  basics: undefined,
  bio: undefined,
  location: undefined,
  contentCategories: undefined,
  languages: undefined,
  deliverables: undefined,
  profilePhoto: undefined,
  coverPhoto: undefined,
  portfolio: undefined,
  handle: undefined,
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
    // Step 2 - the creator's trimmed public bio (build-plan 21).
    saveBio: (state: CreatorOnboardingState, { payload }: PayloadAction<string>) => {
      state.bio = payload;
    },
    saveLocation: (state: CreatorOnboardingState, { payload }: PayloadAction<LocationValues>) => {
      state.location = payload;
    },
    // Step 3 - stores the picked categories (each new entry with an empty
    // `subcategories`) and the custom category name. An entry that survives a
    // Back-and-resubmit keeps the subcategories it was given on step 4,
    // because the step 3 form seeds `categories` straight from this draft.
    saveCategories: (
      state: CreatorOnboardingState,
      { payload }: PayloadAction<CategoriesStepValues>,
    ) => {
      state.contentCategories = {
        categories: payload.categories,
        categoryOthersText: payload.categoryOthersText,
        subcategoryOthersText: state.contentCategories?.subcategoryOthersText,
      };
    },
    // Step 4 - stores the per-category subcategory picks and the custom
    // subcategory name, preserving the step 3 category name.
    saveSubcategories: (
      state: CreatorOnboardingState,
      { payload }: PayloadAction<SubcategoriesStepValues>,
    ) => {
      state.contentCategories = {
        categories: payload.categories,
        categoryOthersText: state.contentCategories?.categoryOthersText,
        subcategoryOthersText: payload.subcategoryOthersText,
      };
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
    saveHandle: (state: CreatorOnboardingState, { payload }: PayloadAction<string>) => {
      state.handle = payload;
    },
    completeOnboarding: (state: CreatorOnboardingState) => {
      state.completed = true;
      if (!state.completedSteps.includes(ONBOARDING_TOTAL_STEPS)) {
        state.completedSteps.push(ONBOARDING_TOTAL_STEPS);
      }
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
  saveBio,
  saveLocation,
  saveCategories,
  saveSubcategories,
  saveLanguages,
  saveDeliverables,
  savePhotos,
  savePortfolio,
  saveHandle,
  completeOnboarding,
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
