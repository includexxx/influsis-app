import { useDispatch, useSelector } from 'react-redux';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { State, Dispatch } from '@/utils/store';

// "Extra profile info beyond the core User type" that the Edit Profile screen
// (scenes/main/EditProfile.tsx) reads and writes. Split out of the retired
// profile-verification wizard's slice (build-plan 20a) once the creator
// onboarding wizard took over the fields it used to own (categories,
// languages, bio, etc.); what stays here is only what Edit Profile needs.
export interface ProfileState {
  phoneNumber?: string;
  // Lowercase ISO-3166 code of the phone number's *dial-code* country
  // (`@/data/dial-codes`), kept apart from `phoneNumber` so the input holds
  // only local digits - and distinct from `country` below, the user's
  // residence country, which moves independently.
  phoneCountry?: string;
  gender?: string;
  country?: string;
  dateOfBirth?: string;
}

const initialState: ProfileState = {
  phoneNumber: undefined,
  phoneCountry: undefined,
  gender: undefined,
  country: undefined,
  dateOfBirth: undefined,
};

const slice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setPhoneNumber: (state: ProfileState, { payload }: PayloadAction<string>) => {
      state.phoneNumber = payload;
    },
    setPhoneCountry: (state: ProfileState, { payload }: PayloadAction<string>) => {
      state.phoneCountry = payload;
    },
    setGender: (state: ProfileState, { payload }: PayloadAction<string>) => {
      state.gender = payload;
    },
    setCountry: (state: ProfileState, { payload }: PayloadAction<string>) => {
      state.country = payload;
    },
    setDateOfBirth: (state: ProfileState, { payload }: PayloadAction<string>) => {
      state.dateOfBirth = payload;
    },
    reset: () => initialState,
  },
});

export function useProfileSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector(({ profile }: State) => profile);
  return { dispatch, ...state, ...slice.actions };
}

export default slice.reducer;
