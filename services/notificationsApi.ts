import { createApi } from '@reduxjs/toolkit/query/react';
import {
  MarkAllReadResult,
  MarkReadResult,
  NotificationItem,
  NotificationPreference,
  NotificationsPageArgs,
  PushDevice,
  RegisterPushDeviceRequest,
  UnreadCount,
  UpdateNotificationPreferencesRequest,
} from '@/types';
import { axiosBaseQuery } from './baseQuery';

// Group NT (backend 24a-24c). Every route is scoped to the caller's own
// notifications; another user's id answers 404, never 403. The feed's
// optimistic read state lives in scenes/notifications (earlier pages are
// local state there, not live cache entries), so the mutations here only
// refresh the unread count once the server confirms.
export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['NotificationsFeed', 'UnreadCount', 'NotificationPreferences'],
  endpoints: builder => ({
    // NT1
    getNotificationsPage: builder.query<NotificationItem[], NotificationsPageArgs>({
      query: ({ page, limit, unread, before }) => ({
        url: '/notifications',
        method: 'GET',
        params: {
          page,
          limit,
          ...(unread ? { unread: true } : {}),
          ...(before ? { before } : {}),
        },
      }),
      providesTags: ['NotificationsFeed'],
    }),
    // NT2
    getUnreadCount: builder.query<UnreadCount, void>({
      query: () => ({ url: '/notifications/unread-count', method: 'GET' }),
      providesTags: ['UnreadCount'],
    }),
    // NT3 - idempotent
    markNotificationRead: builder.mutation<MarkReadResult, { id: string }>({
      query: ({ id }) => ({
        url: `/notifications/${encodeURIComponent(id)}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error) => (error ? [] : ['UnreadCount']),
    }),
    // NT4 - `updated: 0` is a success
    markAllNotificationsRead: builder.mutation<MarkAllReadResult, { before: string }>({
      query: ({ before }) => ({
        url: '/notifications/read-all',
        method: 'POST',
        data: { before },
      }),
      invalidatesTags: (result, error) => (error ? [] : ['UnreadCount']),
    }),
    // NT5 - one row per category in the backend's fixed order
    getNotificationPreferences: builder.query<NotificationPreference[], void>({
      query: () => ({ url: '/notifications/preferences', method: 'GET' }),
      providesTags: ['NotificationPreferences'],
    }),
    // NT6 - partial; answers the NT5 shape, which replaces the cached NT5
    updateNotificationPreferences: builder.mutation<
      NotificationPreference[],
      UpdateNotificationPreferencesRequest
    >({
      query: body => ({ url: '/notifications/preferences', method: 'PATCH', data: body }),
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            notificationsApi.util.updateQueryData(
              'getNotificationPreferences',
              undefined,
              () => data,
            ),
          );
        } catch {
          // The caller reverts its own optimistic state.
        }
      },
    }),
    // NT7 - idempotent upsert, bound to the caller's current session
    registerPushDevice: builder.mutation<PushDevice, RegisterPushDeviceRequest>({
      query: body => ({ url: '/notifications/push-devices', method: 'POST', data: body }),
    }),
    // NT8 - 404 (already gone) counts as success for the caller
    deletePushDevice: builder.mutation<null, { id: string }>({
      query: ({ id }) => ({
        url: `/notifications/push-devices/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useGetNotificationsPageQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  useRegisterPushDeviceMutation,
  useDeletePushDeviceMutation,
} = notificationsApi;
