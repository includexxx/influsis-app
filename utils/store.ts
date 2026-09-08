import { configureStore } from '@reduxjs/toolkit';
import app from '@/slices/app.slice';
import auth, { sessionEnded } from '@/slices/auth.slice';
import profileVerification from '@/slices/profileVerification.slice';
import createGig from '@/slices/createGig.slice';
import { authApi } from '@/services/authApi';
import { setUnauthorizedHandler } from '@/services/http';
import config from '@/utils/config';
import { Env } from '@/types/env';
import logger from 'redux-logger';

const store = configureStore({
  reducer: {
    app,
    auth,
    profileVerification,
    createGig,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: getDefaultMiddleware => {
    // RTK Query keeps our ApiError instance (a class, deliberately not a plain
    // object) in the authApi error state and rejected-action payloads.
    const base = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          `${authApi.reducerPath}/executeQuery/rejected`,
          `${authApi.reducerPath}/executeMutation/rejected`,
        ],
        ignoredPaths: [authApi.reducerPath],
      },
    }).concat(authApi.middleware);
    return config.env === Env.dev ? base : base.concat(logger);
  },
  devTools: config.env === Env.dev,
});

// One-shot handler for a dead refresh (19a): end the Redux session and drop
// every cached authApi response so nothing stale survives the sign-out.
setUnauthorizedHandler(() => {
  store.dispatch(sessionEnded());
  store.dispatch(authApi.util.resetApiState());
});

export type State = ReturnType<typeof store.getState>;
export type Dispatch = typeof store.dispatch;

export default store;
