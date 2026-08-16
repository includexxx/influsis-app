import { useDispatch, useSelector } from 'react-redux';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { State, Dispatch } from '@/utils/store';

export interface ProfileVerificationState {
  dateOfBirth?: string;
  categories: string[];
  socialPlatforms: string[];
  languages: string[];
  bio: string;
  username: string;
  // Edit Profile screen fields (scenes/main/EditProfile.tsx) - live here
  // rather than a new slice since this is already this project's "extra
  // profile info beyond the core User type" slice (dateOfBirth is edited
  // by both the onboarding wizard and this screen, a single canonical
  // value either way).
  phoneNumber?: string;
  gender?: string;
  country?: string;
}

const initialState: ProfileVerificationState = {
  dateOfBirth: undefined,
  categories: [],
  socialPlatforms: [],
  languages: [],
  bio: '',
  username: '',
  phoneNumber: undefined,
  gender: undefined,
  country: undefined,
};

function toggleItem(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter(item => item !== id) : [...list, id];
}

const slice = createSlice({
  name: 'profileVerification',
  initialState,
  reducers: {
    setDateOfBirth: (state: ProfileVerificationState, { payload }: PayloadAction<string>) => {
      state.dateOfBirth = payload;
    },
    toggleCategory: (state: ProfileVerificationState, { payload }: PayloadAction<string>) => {
      state.categories = toggleItem(state.categories, payload);
    },
    toggleSocialPlatform: (state: ProfileVerificationState, { payload }: PayloadAction<string>) => {
      state.socialPlatforms = toggleItem(state.socialPlatforms, payload);
    },
    toggleLanguage: (state: ProfileVerificationState, { payload }: PayloadAction<string>) => {
      state.languages = toggleItem(state.languages, payload);
    },
    setBio: (state: ProfileVerificationState, { payload }: PayloadAction<string>) => {
      state.bio = payload;
    },
    setUsername: (state: ProfileVerificationState, { payload }: PayloadAction<string>) => {
      state.username = payload;
    },
    setPhoneNumber: (state: ProfileVerificationState, { payload }: PayloadAction<string>) => {
      state.phoneNumber = payload;
    },
    setGender: (state: ProfileVerificationState, { payload }: PayloadAction<string>) => {
      state.gender = payload;
    },
    setCountry: (state: ProfileVerificationState, { payload }: PayloadAction<string>) => {
      state.country = payload;
    },
    reset: () => initialState,
  },
});

export function useProfileVerificationSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector(({ profileVerification }: State) => profileVerification);
  return { dispatch, ...state, ...slice.actions };
}

export default slice.reducer;
