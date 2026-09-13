import { createApi } from '@reduxjs/toolkit/query/react';
import { MyProfileResponse, OnboardCreatorProfileRequest, UpdateMyProfileRequest } from '@/types';
import { axiosBaseQuery } from './baseQuery';

// No `skipAuth` on any endpoint here — all three routes require the caller to
// be signed in, and every screen that calls them is already auth-gated.
export const profilesApi = createApi({
  reducerPath: 'profilesApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['MyProfile'],
  endpoints: builder => ({
    onboardCreator: builder.mutation<MyProfileResponse, OnboardCreatorProfileRequest>({
      query: body => ({ url: '/profiles/onboarding-creator', method: 'POST', data: body }),
      invalidatesTags: ['MyProfile'],
    }),
    getMyProfile: builder.query<MyProfileResponse, void>({
      query: () => ({ url: '/profiles/me', method: 'GET' }),
      providesTags: ['MyProfile'],
    }),
    updateMyProfile: builder.mutation<MyProfileResponse, UpdateMyProfileRequest>({
      query: body => ({ url: '/profiles/me', method: 'PATCH', data: body }),
      invalidatesTags: ['MyProfile'],
    }),
  }),
});

export const {
  useOnboardCreatorMutation,
  useGetMyProfileQuery,
  useLazyGetMyProfileQuery,
  useUpdateMyProfileMutation,
} = profilesApi;
