import { createApi } from '@reduxjs/toolkit/query/react';
import {
  AuthAccount,
  Login2faVerifyRequest,
  LoginRequest,
  LoginResponse,
  OtpRequestRequest,
  OtpVerifyRequest,
  OtpVerifyResponse,
  RegisterRequest,
  ResetPasswordRequest,
  SessionTokenPair,
} from '@/types';
import { axiosBaseQuery } from './baseQuery';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Me'],
  endpoints: builder => ({
    register: builder.mutation<null, RegisterRequest>({
      query: body => ({ url: '/auth/register', method: 'POST', data: body, skipAuth: true }),
    }),
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: body => ({ url: '/auth/login', method: 'POST', data: body, skipAuth: true }),
    }),
    verifyLogin2fa: builder.mutation<SessionTokenPair, Login2faVerifyRequest>({
      query: body => ({
        url: '/auth/login/2fa/verify',
        method: 'POST',
        data: body,
        skipAuth: true,
      }),
    }),
    requestOtp: builder.mutation<null, OtpRequestRequest>({
      query: body => ({ url: '/auth/otp/request', method: 'POST', data: body, skipAuth: true }),
    }),
    verifyOtp: builder.mutation<OtpVerifyResponse, OtpVerifyRequest>({
      query: body => ({ url: '/auth/otp/verify', method: 'POST', data: body, skipAuth: true }),
    }),
    resetPassword: builder.mutation<null, ResetPasswordRequest>({
      query: body => ({ url: '/auth/reset-password', method: 'POST', data: body, skipAuth: true }),
    }),
    getMe: builder.query<AuthAccount, void>({
      query: () => ({ url: '/auth/me', method: 'GET' }),
      providesTags: ['Me'],
    }),
    logout: builder.mutation<null, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useVerifyLogin2faMutation,
  useRequestOtpMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useLogoutMutation,
} = authApi;
