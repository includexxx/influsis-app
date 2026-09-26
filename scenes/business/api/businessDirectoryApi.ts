import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/services/baseQuery';
import {
  BusinessDirectoryItem,
  BusinessDirectoryPageArgs,
  BusinessProfilePublic,
} from '../types/businessDirectory';

// Home's "Business" logo row preview (BusinessLogosSection).
export const BUSINESSES_PREVIEW_LIMIT = 6;
// Page size for the full virtualized Businesses grid.
export const BUSINESSES_PAGE_SIZE = 12;

// Backs every screen that reads the business directory:
// - RBAC API group §E1 (GET /business-profiles) - the paginated directory.
//   Requires auth (any of super_admin/admin/business/creator). Home's
//   "Business" preview and the full Businesses screen.
// - RBAC API group §E2 (GET /business-profiles/:userId) - the public
//   single-profile page (`@Public()`, no bearer needed). Business Details.
export const businessDirectoryApi = createApi({
  reducerPath: 'businessDirectoryApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['BusinessDirectory', 'BusinessProfile'],
  endpoints: builder => ({
    getTopBusinesses: builder.query<BusinessDirectoryItem[], { limit: number }>({
      query: ({ limit }) => ({
        url: '/business-profiles',
        method: 'GET',
        params: { page: 1, limit },
      }),
      providesTags: ['BusinessDirectory'],
    }),
    // One page at a time - scenes/business/hooks/useBusinessesFeed.ts
    // accumulates pages into one flat list itself, since services/http.ts
    // unwraps the response envelope and drops the backend's
    // `meta.hasNextPage` before RTK Query ever sees it.
    getBusinessesDirectoryPage: builder.query<BusinessDirectoryItem[], BusinessDirectoryPageArgs>({
      query: ({ page, limit }) => ({
        url: '/business-profiles',
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['BusinessDirectory'],
    }),
    getBusinessProfile: builder.query<BusinessProfilePublic, { userId: string }>({
      query: ({ userId }) => ({
        url: `/business-profiles/${userId}`,
        method: 'GET',
        skipAuth: true,
      }),
      providesTags: (_result, _error, { userId }) => [{ type: 'BusinessProfile', id: userId }],
    }),
  }),
});

export const {
  useGetTopBusinessesQuery,
  useGetBusinessesDirectoryPageQuery,
  useGetBusinessProfileQuery,
} = businessDirectoryApi;
