import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { request } from '@/services/http';
import { profilesApi } from '@/services/profilesApi';
import { MyProfileResponse } from '@/types';
import Profile from './Profile';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));

jest.mock(
  'react-native-safe-area-context',
  () =>
    (jest.requireActual('react-native-safe-area-context/jest/mock') as { default: object }).default,
);

const mockDispatch = jest.fn();
const mockRemovePersistData = jest.fn();

jest.mock('@/slices', () => ({
  useAppSlice: () => ({ dispatch: mockDispatch, setUser: (user: unknown) => ({ user }) }),
  useAuthSlice: () => ({
    account: { email: 'ayesha@example.com' },
    signOut: () => ({ type: 'auth/signOut' }),
  }),
}));

jest.mock('@/hooks', () => ({
  ...(jest.requireActual('@/hooks') as object),
  useDataPersist: () => ({ removePersistData: mockRemovePersistData }),
}));

jest.mock('@/services/http', () => {
  class ApiError extends Error {
    code: string;
    statusCode: number;
    constructor(body: { code?: string; statusCode: number; message?: string }) {
      super(body.message ?? 'api error');
      this.name = 'ApiError';
      this.code = body.code ?? 'UNKNOWN';
      this.statusCode = body.statusCode;
    }
  }
  return { __esModule: true, request: jest.fn(), ApiError };
});

const mockRequest = request as jest.MockedFunction<typeof request>;
const mockPush = router.push as jest.Mock;
const mockReplace = router.replace as jest.Mock;

const profileResponse: MyProfileResponse = {
  kind: 'creator',
  handle: 'ayesha',
  profile: {
    id: 'p-1',
    name: 'Ayesha Rahman',
    bio: 'Skincare creator sharing honest, budget-friendly routines.',
    categories: ['music', 'beauty'],
    subcategories: [],
    languages: ['english'],
    deliverables: ['reel'],
    platforms: [{ platform: 'instagram', handle: 'ayesha' }],
    portfolio: [
      { url: 'instagram.com/p/a', platform: 'instagram', thumbnailUrl: null },
      { url: 'instagram.com/p/b', platform: 'instagram', thumbnailUrl: null },
      { url: 'instagram.com/p/c', platform: 'instagram', thumbnailUrl: null },
    ],
    dateOfBirth: null,
    gender: null,
    country: 'bangladesh',
    state: 'dhaka',
    city: 'Dhaka',
    postalCode: '1207',
    address: null,
    contactEmail: 'a@b.com',
    contactPhone: null,
    websiteUrl: null,
    avatarUrl: null,
    coverUrl: null,
    isDiscoverable: true,
    verificationDocumentsUrl: null,
    verificationStatus: 'verified',
    verificationNotes: null,
    verifiedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};

function renderScreen() {
  const store = configureStore({
    reducer: { [profilesApi.reducerPath]: profilesApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(profilesApi.middleware),
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return render(<Profile />, { wrapper });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
  mockPush.mockClear();
  mockReplace.mockClear();
  mockDispatch.mockClear();
  mockRemovePersistData.mockClear();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<Profile />', () => {
  test('shows the account email and placeholder stats while loading', async () => {
    let resolveRequest: (value: MyProfileResponse) => void = () => {};
    mockRequest.mockImplementation(
      (() =>
        new Promise<MyProfileResponse>(resolve => {
          resolveRequest = resolve;
        })) as typeof request,
    );
    renderScreen();

    expect(screen.getByText('Your Profile')).toBeTruthy();
    expect(screen.getByText('ayesha@example.com')).toBeTruthy();
    expect(screen.getAllByText('—')).toHaveLength(3);

    resolveRequest(profileResponse);
    await screen.findByText('Ayesha Rahman');
  });

  test('renders the identity, stats and strength once loaded', async () => {
    mockRequest.mockResolvedValue(profileResponse);
    renderScreen();

    expect(await screen.findByText('Ayesha Rahman')).toBeTruthy();
    expect(screen.getByText('@ayesha')).toBeTruthy();
    expect(screen.getByText('Dhaka, Bangladesh')).toBeTruthy();
    expect(screen.getByText('Verified')).toBeTruthy();
    // Portfolio 3, Platforms 1, Categories 2.
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    // Missing only the profile and cover photos.
    expect(screen.getByText('80%')).toBeTruthy();
    expect(screen.getByText('Add your profile photo and cover photo')).toBeTruthy();

    fireEvent.press(screen.getByTestId('profile-strength'));
    expect(mockPush).toHaveBeenCalledWith('/profile-edit');
  });

  test('hides the strength card for a complete profile', async () => {
    mockRequest.mockResolvedValue({
      ...profileResponse,
      profile: { ...profileResponse.profile, avatarUrl: 'a.png', coverUrl: 'c.png' },
    });
    renderScreen();

    await screen.findByText('Ayesha Rahman');
    expect(screen.queryByTestId('profile-strength')).toBeNull();
  });

  test('a creator without a profile is pointed at onboarding', async () => {
    const { ApiError } = jest.requireMock('@/services/http') as {
      ApiError: new (body: { code: string; statusCode: number; message: string }) => Error;
    };
    mockRequest.mockRejectedValue(
      new ApiError({ code: 'NOT_FOUND', statusCode: 404, message: 'Profile not found.' }),
    );
    renderScreen();

    fireEvent.press(await screen.findByText('Start onboarding'));
    expect(mockPush).toHaveBeenCalledWith('/creator-onboarding');
    expect(screen.queryByTestId('profile-stats')).toBeNull();
  });

  test('each menu row and header shortcut opens its destination', async () => {
    mockRequest.mockResolvedValue(profileResponse);
    renderScreen();
    await screen.findByText('Ayesha Rahman');

    const destinations: [string, string][] = [
      ['account-row-my-profile', '/my-profile'],
      ['account-row-profile', '/profile-edit'],
      ['account-row-security', '/security-settings'],
      ['account-row-ballance', '/ballance'],
      ['account-row-applications', '/applications'],
      ['account-row-help-center', '/help-center'],
      ['account-row-privacy-policy', '/privacy-policy'],
      ['profile-header-edit', '/profile-edit'],
      ['profile-header-view', '/my-profile'],
    ];
    for (const [testID, path] of destinations) {
      mockPush.mockClear();
      fireEvent.press(screen.getByTestId(testID));
      expect(mockPush).toHaveBeenCalledWith(path);
    }
  });

  test('logout asks for confirmation, then signs out', async () => {
    mockRequest.mockResolvedValue(profileResponse);
    renderScreen();
    await screen.findByText('Ayesha Rahman');

    fireEvent.press(screen.getByTestId('account-row-logout'));
    expect(screen.getByText('Are you sure you want to logout?')).toBeTruthy();

    fireEvent.press(screen.getByTestId('logout-confirm-primary'));
    expect(screen.queryByText('Are you sure you want to logout?')).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('account-row-logout'));
    fireEvent.press(screen.getByTestId('logout-confirm-secondary'));
    expect(mockRemovePersistData).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/signOut' });
    expect(mockReplace).toHaveBeenCalledWith('/auth');
  });
});
