import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react-native';

import { request } from '@/services/http';
import { profilesApi } from '@/services/profilesApi';
import { MyProfileResponse } from '@/types';
import MyProfile from './MyProfile';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
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

const profileResponse: MyProfileResponse = {
  kind: 'creator',
  handle: 'ayesha',
  profile: {
    id: 'p-1',
    name: 'Ayesha Rahman',
    bio: 'Skincare creator sharing honest, budget-friendly routines.',
    categories: ['music'],
    subcategories: ['singing'],
    languages: ['english'],
    deliverables: ['reel'],
    platforms: [],
    portfolio: [{ url: 'instagram.com/p/a', platform: 'instagram', thumbnailUrl: null }],
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
    verificationStatus: 'unverified',
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
  return render(<MyProfile />, { wrapper });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<MyProfile />', () => {
  test('shows a spinner while the profile is loading', async () => {
    let resolveRequest: (value: MyProfileResponse) => void = () => {};
    mockRequest.mockImplementation(
      (() =>
        new Promise<MyProfileResponse>(resolve => {
          resolveRequest = resolve;
        })) as typeof request,
    );
    renderScreen();
    expect(screen.getByText('My Profile')).toBeTruthy();

    // Resolve and let the request settle so nothing is left pending once the
    // test ends (an eternally-pending mock keeps Jest's process alive).
    resolveRequest(profileResponse);
    await screen.findByText('Ayesha Rahman');
  });

  test('renders the profile once loaded', async () => {
    mockRequest.mockResolvedValue(profileResponse);
    renderScreen();

    expect(await screen.findByText('Ayesha Rahman')).toBeTruthy();
    expect(screen.getByText('@ayesha')).toBeTruthy();
    expect(
      screen.getByText('Skincare creator sharing honest, budget-friendly routines.'),
    ).toBeTruthy();
    expect(screen.getByText('Music')).toBeTruthy(); // categories label lookup
    // City and Division both resolve to "Dhaka" here (district + division
    // label lookup), so there are two matches, not one.
    expect(screen.getAllByText('Dhaka')).toHaveLength(2);
  });

  test('a NOT_FOUND error offers a link to onboarding instead of a generic error', async () => {
    const { ApiError } = jest.requireMock('@/services/http') as {
      ApiError: new (body: { code: string; statusCode: number; message: string }) => Error;
    };
    mockRequest.mockRejectedValue(
      new ApiError({ code: 'NOT_FOUND', statusCode: 404, message: 'Profile not found.' }),
    );
    renderScreen();

    expect(await screen.findByText("You haven't set up your profile yet.")).toBeTruthy();
    expect(screen.getByTestId('my-profile-onboard-cta')).toBeTruthy();
  });

  test('any other error shows a message with a retry button', async () => {
    const { ApiError } = jest.requireMock('@/services/http') as {
      ApiError: new (body: { code: string; statusCode: number; message: string }) => Error;
    };
    mockRequest.mockRejectedValue(
      new ApiError({ code: 'INTERNAL_ERROR', statusCode: 500, message: 'Server exploded.' }),
    );
    renderScreen();

    expect(await screen.findByText('Server exploded.')).toBeTruthy();
    expect(screen.getByTestId('my-profile-retry')).toBeTruthy();
  });
});
