import { configureStore } from '@reduxjs/toolkit';
import app from '@/slices/app.slice';
import auth, { clearSessionState } from '@/slices/auth.slice';
import creatorOnboarding from '@/slices/creatorOnboarding.slice';
import createGig from '@/slices/createGig.slice';
import { authApi } from '@/services/authApi';
import { profilesApi } from '@/services/profilesApi';
import { campaignFeedApi } from '@/scenes/campaigns/api/campaignFeedApi';
import { businessDirectoryApi } from '@/scenes/business/api/businessDirectoryApi';
import { creatorDirectoryApi } from '@/scenes/creator/api/creatorDirectoryApi';
import { notificationsApi } from '@/services/notificationsApi';
import { setUnauthorizedHandler } from '@/services/http';
import cacheSync from '@/services/cacheSync';
import accountStateSignOut from '@/services/accountStateSignOut';
import config from '@/utils/config';
import { Env } from '@/types/env';
import logger from 'redux-logger';

const store = configureStore({
  reducer: {
    app,
    auth,
    creatorOnboarding,
    createGig,
    [authApi.reducerPath]: authApi.reducer,
    [profilesApi.reducerPath]: profilesApi.reducer,
    [campaignFeedApi.reducerPath]: campaignFeedApi.reducer,
    [businessDirectoryApi.reducerPath]: businessDirectoryApi.reducer,
    [creatorDirectoryApi.reducerPath]: creatorDirectoryApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
  },
  middleware: getDefaultMiddleware => {
    // RTK Query keeps our ApiError instance (a class, deliberately not a plain
    // object) in the authApi/profilesApi/campaignFeedApi/businessDirectoryApi/
    // creatorDirectoryApi/notificationsApi error state and rejected-action payloads.
    const base = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          `${authApi.reducerPath}/executeQuery/rejected`,
          `${authApi.reducerPath}/executeMutation/rejected`,
          `${profilesApi.reducerPath}/executeQuery/rejected`,
          `${profilesApi.reducerPath}/executeMutation/rejected`,
          `${campaignFeedApi.reducerPath}/executeQuery/rejected`,
          `${businessDirectoryApi.reducerPath}/executeQuery/rejected`,
          `${creatorDirectoryApi.reducerPath}/executeQuery/rejected`,
          `${notificationsApi.reducerPath}/executeQuery/rejected`,
          `${notificationsApi.reducerPath}/executeMutation/rejected`,
        ],
        ignoredPaths: [
          authApi.reducerPath,
          profilesApi.reducerPath,
          campaignFeedApi.reducerPath,
          businessDirectoryApi.reducerPath,
          creatorDirectoryApi.reducerPath,
          notificationsApi.reducerPath,
        ],
      },
    })
      // cross-API cache invalidation after mutations (services/cacheSync.ts)
      .prepend(cacheSync.middleware)
      // ACCOUNT_* on a notification call signs out (services/accountStateSignOut.ts)
      .prepend(accountStateSignOut.middleware)
      .concat(
        authApi.middleware,
        profilesApi.middleware,
        campaignFeedApi.middleware,
        businessDirectoryApi.middleware,
        creatorDirectoryApi.middleware,
        notificationsApi.middleware,
      );
    return config.env === Env.dev ? base.concat(logger) : base;
  },
  devTools: config.env === Env.dev,
});

// One-shot handler for a dead refresh (19a): end the Redux session, reset
// every user-scoped slice, and drop every cached RTK Query response so
// nothing stale survives the sign-out (the token store is already cleared).
setUnauthorizedHandler(() => clearSessionState(store.dispatch));

export type State = ReturnType<typeof store.getState>;
export type Dispatch = typeof store.dispatch;

export default store;
