import { configureStore } from '@reduxjs/toolkit';
import app from '@/slices/app.slice';
import auth, { sessionEnded } from '@/slices/auth.slice';
import creatorOnboarding from '@/slices/creatorOnboarding.slice';
import createGig from '@/slices/createGig.slice';
import { authApi } from '@/services/authApi';
import { profilesApi } from '@/services/profilesApi';
import { setUnauthorizedHandler } from '@/services/http';
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
  },
  middleware: getDefaultMiddleware => {
    // RTK Query keeps our ApiError instance (a class, deliberately not a plain
    // object) in the authApi/profilesApi error state and rejected-action
    // payloads.
    const base = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          `${authApi.reducerPath}/executeQuery/rejected`,
          `${authApi.reducerPath}/executeMutation/rejected`,
          `${profilesApi.reducerPath}/executeQuery/rejected`,
          `${profilesApi.reducerPath}/executeMutation/rejected`,
        ],
        ignoredPaths: [authApi.reducerPath, profilesApi.reducerPath],
      },
    }).concat(authApi.middleware, profilesApi.middleware);
    return config.env === Env.dev ? base.concat(logger) : base;
  },
  devTools: config.env === Env.dev,
});

// One-shot handler for a dead refresh (19a): end the Redux session and drop
// every cached authApi/profilesApi response so nothing stale survives the
// sign-out.
setUnauthorizedHandler(() => {
  store.dispatch(sessionEnded());
  store.dispatch(authApi.util.resetApiState());
  store.dispatch(profilesApi.util.resetApiState());
});

export type State = ReturnType<typeof store.getState>;
export type Dispatch = typeof store.dispatch;

export default store;
