import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import { authApi, clearTokens, getTokens, httpClient } from '@/services';
import authReducer from '@/slices/auth.slice';
import {
  clearPendingResetToken,
  getPendingResetToken,
  setPendingResetToken,
} from '@/utils/resetToken';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import SignIn from './SignIn';
import SignUp from './SignUp';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));

// SuccessSheet (ResetPassword) mounts @gorhom/bottom-sheet on its native
// path, which is incompatible with react-native-reanimated's jest mock -
// force the plain web fallback, same as SuccessSheet's own test.
jest.mock('@/utils/deviceInfo', () => ({
  ...(jest.requireActual('@/utils/deviceInfo') as typeof import('@/utils/deviceInfo')),
  isWeb: true,
}));

jest.mock(
  'react-native-safe-area-context',
  () =>
    (jest.requireActual('react-native-safe-area-context/jest/mock') as { default: object }).default,
);

const mockPush = router.push as jest.Mock;
const mockReplace = router.replace as jest.Mock;

type Adapter = (config: InternalAxiosRequestConfig) => Promise<unknown>;
let adapter: jest.MockedFunction<Adapter>;

function respond(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  const response = { data, status, statusText: '', headers: {}, config };
  if (status < 300) return Promise.resolve(response);
  return Promise.reject(
    new AxiosError(`status ${status}`, 'ERR_BAD_RESPONSE', config, {}, response),
  );
}

function envelope<T>(data: T) {
  return { success: true, statusCode: 200, message: 'ok', data, meta: null };
}

let store: ReturnType<typeof makeStore>;

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer, [authApi.reducerPath]: authApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(authApi.middleware),
  });
}

function renderWithStore(ui: ReactNode) {
  store = makeStore();
  return render(<Provider store={store}>{ui}</Provider>);
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  await clearTokens();
  mockPush.mockClear();
  mockReplace.mockClear();
  clearPendingResetToken();
  adapter = jest.fn<Adapter>();
  httpClient.defaults.adapter = adapter as typeof httpClient.defaults.adapter;
});

afterEach(() => {
  store?.dispatch(authApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe('<SignIn />', () => {
  test('validates both fields before calling the API', async () => {
    renderWithStore(<SignIn />);
    expect(screen.getByText('Welcome back')).toBeTruthy();

    await press('sign-in-submit');

    expect(screen.getByText('Enter your email or phone number')).toBeTruthy();
    expect(screen.getByText('Enter your password')).toBeTruthy();
    expect(adapter).not.toHaveBeenCalled();
  });

  test('signs in, stores the tokens and opens Home', async () => {
    adapter.mockImplementation(config =>
      respond(
        config,
        envelope({
          token: 'access-1',
          refreshToken: 'refresh-1',
          tokenExpires: 2_000_000_000_000,
          user: { id: 'u-1', status: 'active', isOnboardingComplete: true },
        }),
      ),
    );
    renderWithStore(<SignIn />);

    fireEvent.changeText(screen.getByTestId('sign-in-email'), 'creator@influsis.test');
    fireEvent.changeText(screen.getByTestId('sign-in-password'), 'pass1234');
    await press('sign-in-submit');

    expect(adapter.mock.calls[0][0].url).toBe('/auth/login');
    expect(await getTokens()).toMatchObject({ token: 'access-1' });
    expect(store.getState().auth.status).toBe('authenticated');
    expect(mockReplace).toHaveBeenCalledWith('/home');
  });

  test('shows wrong credentials in the form banner', async () => {
    adapter.mockImplementation(config =>
      respond(
        config,
        {
          success: false,
          code: 'AUTH_INVALID_CREDENTIALS',
          statusCode: 401,
          message: 'bad',
          errors: null,
        },
        401,
      ),
    );
    renderWithStore(<SignIn />);

    fireEvent.changeText(screen.getByTestId('sign-in-email'), 'creator@influsis.test');
    fireEvent.changeText(screen.getByTestId('sign-in-password'), 'wrong-pass');
    await press('sign-in-submit');

    expect(screen.getByTestId('auth-form-alert')).toBeTruthy();
    expect(screen.getByText('The email/phone or password is incorrect.')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test('links to password reset and sign-up, and toggles password visibility', () => {
    renderWithStore(<SignIn />);

    fireEvent.press(screen.getByTestId('sign-in-forgot-password'));
    expect(mockPush).toHaveBeenLastCalledWith('/auth/forgot-password');
    fireEvent.press(screen.getByTestId('sign-in-go-sign-up'));
    expect(mockPush).toHaveBeenLastCalledWith('/auth/sign-up');

    expect(screen.getByTestId('sign-in-password').props.secureTextEntry).toBe(true);
    fireEvent.press(screen.getByLabelText('Show password'));
    expect(screen.getByTestId('sign-in-password').props.secureTextEntry).toBe(false);
  });
});

describe('<SignUp />', () => {
  test('asks for an email or a phone and checks the passwords match', async () => {
    renderWithStore(<SignUp />);
    expect(screen.getByText('Create your account')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('sign-up-password'), 'Abcdef1!');
    fireEvent.changeText(screen.getByTestId('sign-up-confirm-password'), 'different');
    await press('sign-up-submit');

    expect(screen.getAllByText('Enter a phone number or an email')).toHaveLength(2);
    expect(screen.getByText('Passwords do not match')).toBeTruthy();
    expect(adapter).not.toHaveBeenCalled();
  });

  test('rates the password as it is typed', () => {
    renderWithStore(<SignUp />);
    expect(screen.queryByTestId('password-strength')).toBeNull();

    fireEvent.changeText(screen.getByTestId('sign-up-password'), 'abc');
    expect(screen.getByText('Weak')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('sign-up-password'), 'Abcdef1!');
    expect(screen.getByText('Strong')).toBeTruthy();
  });

  test('registers and continues to the OTP screen with the backend destination', async () => {
    adapter.mockImplementation(config =>
      respond(
        config,
        envelope({
          verification: {
            destination: 'creator@influsis.test',
            channel: 'email',
            expiresInMinutes: 5,
          },
        }),
      ),
    );
    renderWithStore(<SignUp />);

    fireEvent.changeText(screen.getByTestId('sign-up-email'), ' creator@influsis.test ');
    fireEvent.changeText(screen.getByTestId('sign-up-password'), 'Abcdef1!');
    fireEvent.changeText(screen.getByTestId('sign-up-confirm-password'), 'Abcdef1!');
    await press('sign-up-submit');

    const [config] = adapter.mock.calls[0];
    expect(config.url).toBe('/auth/register');
    expect(JSON.parse(config.data as string)).toEqual({
      roleKey: 'creator',
      password: 'Abcdef1!',
      email: 'creator@influsis.test',
    });
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/auth/verify-otp',
      params: expect.objectContaining({
        destination: 'creator@influsis.test',
        channel: 'email',
        expiresInMinutes: '5',
      }),
    });
  });

  test('links back to sign-in', () => {
    renderWithStore(<SignUp />);
    fireEvent.press(screen.getByTestId('sign-up-go-sign-in'));
    expect(mockPush).toHaveBeenLastCalledWith('/auth/sign-in');
  });
});

describe('<ForgotPassword />', () => {
  test('validates the email before sending a code', async () => {
    renderWithStore(<ForgotPassword />);
    expect(screen.getByText('Forgot password?')).toBeTruthy();
    expect(screen.getByLabelText('Step 1 of 3: Email')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('forgot-password-email'), 'not-an-email');
    await press('forgot-password-submit');

    expect(screen.getByText('Enter a valid email')).toBeTruthy();
    expect(adapter).not.toHaveBeenCalled();
  });

  test('sends a reset code and continues to the OTP screen', async () => {
    adapter.mockImplementation(config => respond(config, envelope(null)));
    renderWithStore(<ForgotPassword />);

    fireEvent.changeText(screen.getByTestId('forgot-password-email'), ' creator@influsis.test ');
    await press('forgot-password-submit');

    const [config] = adapter.mock.calls[0];
    expect(config.url).toBe('/auth/otp/request');
    expect(JSON.parse(config.data as string)).toEqual({
      destination: 'creator@influsis.test',
      channel: 'email',
      purpose: 'password_reset',
    });
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/auth/verify-otp',
      params: { email: 'creator@influsis.test', flow: 'reset' },
    });
  });

  test('shows a failed send in the form banner', async () => {
    adapter.mockImplementation(config =>
      respond(
        config,
        { success: false, code: 'NETWORK_ERROR', statusCode: 500, message: 'down', errors: null },
        500,
      ),
    );
    renderWithStore(<ForgotPassword />);

    fireEvent.changeText(screen.getByTestId('forgot-password-email'), 'creator@influsis.test');
    await press('forgot-password-submit');

    expect(screen.getByTestId('auth-form-alert')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('<ResetPassword />', () => {
  test('without a reset token, disables the form and offers to start over', () => {
    renderWithStore(<ResetPassword />);

    expect(screen.getByText('This reset link has expired. Start the reset again.')).toBeTruthy();
    expect(screen.getByTestId('reset-password-submit').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    fireEvent.press(screen.getByTestId('auth-form-alert-action'));
    expect(mockReplace).toHaveBeenCalledWith('/auth/forgot-password');
  });

  test('checks the new passwords match and rates the new one', async () => {
    setPendingResetToken('reset-1');
    renderWithStore(<ResetPassword />);
    expect(screen.getByLabelText('Step 3 of 3: New password')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('reset-password-new'), 'Abcdef1!');
    expect(screen.getByText('Strong')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('reset-password-confirm'), 'Abcdef1?');
    await press('reset-password-submit');

    expect(screen.getByText('Passwords do not match')).toBeTruthy();
    expect(adapter).not.toHaveBeenCalled();
  });

  test('resets the password, spends the token and leads to sign-in', async () => {
    setPendingResetToken('reset-1');
    adapter.mockImplementation(config => respond(config, envelope(null)));
    renderWithStore(<ResetPassword />);

    fireEvent.changeText(screen.getByTestId('reset-password-new'), 'Abcdef1!');
    fireEvent.changeText(screen.getByTestId('reset-password-confirm'), 'Abcdef1!');
    await press('reset-password-submit');

    const [config] = adapter.mock.calls[0];
    expect(config.url).toBe('/auth/reset-password');
    expect(JSON.parse(config.data as string)).toEqual({
      resetToken: 'reset-1',
      newPassword: 'Abcdef1!',
    });
    expect(getPendingResetToken()).toBeNull();
    expect(screen.getByText('Password reset')).toBeTruthy();

    fireEvent.press(screen.getByText('Sign in'));
    expect(mockReplace).toHaveBeenCalledWith('/auth/sign-in');
  });

  test('an expired token from the backend shows the start-over banner', async () => {
    setPendingResetToken('reset-1');
    adapter.mockImplementation(config =>
      respond(
        config,
        { success: false, code: 'NOT_FOUND', statusCode: 404, message: 'gone', errors: null },
        404,
      ),
    );
    renderWithStore(<ResetPassword />);

    fireEvent.changeText(screen.getByTestId('reset-password-new'), 'Abcdef1!');
    fireEvent.changeText(screen.getByTestId('reset-password-confirm'), 'Abcdef1!');
    await press('reset-password-submit');

    expect(screen.getByText('This reset link has expired. Start the reset again.')).toBeTruthy();
    expect(screen.getByTestId('auth-form-alert-action')).toBeTruthy();
  });
});
