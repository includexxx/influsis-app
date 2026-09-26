import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/services/baseQuery';
import {
  CreatorDirectoryItem,
  CreatorDirectoryPageArgs,
  CreatorProfilePublic,
} from '../types/creatorDirectory';

// Home's "Top Rated Creator" row preview (TopRatedCreatorsSection).
export const CREATORS_PREVIEW_LIMIT = 6;
// Page size for the full virtualized Top Creators list.
export const CREATORS_PAGE_SIZE = 10;

// Backs every screen that reads the creator directory:
// - RBAC API group §E3 (GET /creator-profiles) - the paginated directory.
//   Requires auth (any of super_admin/admin/business/creator). Home's "Top
//   Rated Creator" preview and the full Top Creators screen.
// - RBAC API group §E4 (GET /creator-profiles/:userId) - the public
//   single-profile page (`@Public()`, no bearer needed). Creator Profile.
export const creatorDirectoryApi = createApi({
  reducerPath: 'creatorDirectoryApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['CreatorDirectory', 'CreatorProfile'],
  endpoints: builder => ({
    getTopCreators: builder.query<CreatorDirectoryItem[], { limit: number }>({
      query: ({ limit }) => ({
        url: '/creator-profiles',
        method: 'GET',
        params: { page: 1, limit },
      }),
      providesTags: ['CreatorDirectory'],
    }),
    // One page at a time - scenes/creator/hooks/useCreatorsFeed.ts
    // accumulates pages into one flat list itself, since services/http.ts
    // unwraps the response envelope and drops the backend's
    // `meta.hasNextPage` before RTK Query ever sees it.
    getCreatorsDirectoryPage: builder.query<CreatorDirectoryItem[], CreatorDirectoryPageArgs>({
      query: ({ page, limit }) => ({
        url: '/creator-profiles',
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['CreatorDirectory'],
    }),
    getCreatorProfile: builder.query<CreatorProfilePublic, { userId: string }>({
      query: ({ userId }) => ({
        url: `/creator-profiles/${userId}`,
        method: 'GET',
        skipAuth: true,
      }),
      providesTags: (_result, _error, { userId }) => [{ type: 'CreatorProfile', id: userId }],
    }),
  }),
});

export const {
  useGetTopCreatorsQuery,
  useGetCreatorsDirectoryPageQuery,
  useGetCreatorProfileQuery,
} = creatorDirectoryApi;
