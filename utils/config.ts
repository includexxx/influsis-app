import Constants from 'expo-constants';
import { Env } from '@/types';

const config = {
  env: Constants.expoConfig?.extra?.env as Env,
  apiUrl: Constants.expoConfig?.extra?.apiUrl as string,
  /** Origin of the backend's better-auth mount, e.g. `http://localhost:3001`. */
  betterAuthUrl: Constants.expoConfig?.extra?.betterAuthUrl as string,
} as const satisfies {
  env: Env;
  apiUrl: string;
  betterAuthUrl: string;
};

export default config;
