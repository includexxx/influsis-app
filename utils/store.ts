import { configureStore, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import app from '@/slices/app.slice';
import profileVerification from '@/slices/profileVerification.slice';
import createGig from '@/slices/createGig.slice';
import config from '@/utils/config';
import { Env } from '@/types/env';
import logger from 'redux-logger';

const store = configureStore({
  reducer: {
    app,
    profileVerification,
    createGig,
    // add more store ...
  },
  middleware: getDefaultMiddleware =>
    config.env === Env.dev ? getDefaultMiddleware() : getDefaultMiddleware().concat(logger),
  devTools: config.env === Env.dev,
});

export type State = ReturnType<typeof store.getState>;
export type Dispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, State, undefined, UnknownAction>;

export default store;
