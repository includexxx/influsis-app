import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

import { request } from '@/services/http';
import auth from '@/slices/auth.slice';
import { authApi } from '@/services/authApi';
import { profilesApi } from '@/services/profilesApi';
import { MyProfileResponse } from '@/types';
import EditProfile from './EditProfile';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));

// SuccessSheet mounts @gorhom/bottom-sheet on its native path, which is
// incompatible with react-native-reanimated's jest mock — force the plain
// web fallback, same as SuccessSheet's own test.
jest.mock('@/utils/deviceInfo', () => ({
  ...(jest.requireActual('@/utils/deviceInfo') as typeof import('@/utils/deviceInfo')),
  isWeb: true,
}));

jest.mock('@/services/http', () => {
  class ApiError extends Error {
    code: string;
    statusCode: number;
    errors: Record<string, string> | null;
    constructor(body: {
      code?: string;
      statusCode: number;
      message?: string;
      errors?: Record<string, string> | null;
    }) {
      super(body.message ?? 'api error');
      this.name = 'ApiError';
      this.code = body.code ?? 'UNKNOWN';
      this.statusCode = body.statusCode;
      this.errors = body.errors ?? null;
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
    bio: 'Skincare creator sharing honest routines.',
    categories: [],
    subcategories: [],
    languages: [],
    deliverables: [],
    platforms: [],
    portfolio: [],
    dateOfBirth: null,
    gender: null,
    country: 'bangladesh',
    state: null,
    city: null,
    postalCode: null,
    address: null,
    contactEmail: null,
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

function makeStore() {
  return configureStore({
    reducer: {
      auth,
      [authApi.reducerPath]: authApi.reducer,
      [profilesApi.reducerPath]: profilesApi.reducer,
    },
    middleware: gDM =>
      gDM({ serializableCheck: false }).concat(authApi.middleware, profilesApi.middleware),
  });
}

function renderScreen() {
  const store = makeStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  render(<EditProfile />, { wrapper });
  return store;
}

function saveDisabled(): boolean | undefined {
  return screen.getByTestId('edit-profile-save').props.accessibilityState?.disabled;
}

async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<EditProfile />', () => {
  test('seeds every field from GET /profiles/me and starts with Save disabled', async () => {
    mockRequest.mockResolvedValue(profileResponse);
    renderScreen();

    expect(await screen.findByDisplayValue('Ayesha Rahman')).toBeTruthy();
    expect(screen.getByDisplayValue('Skincare creator sharing honest routines.')).toBeTruthy();
    expect(saveDisabled()).toBe(true);
  });

  test('editing bio enables Save and PATCHes only the changed field', async () => {
    mockRequest.mockResolvedValue(profileResponse);
    renderScreen();
    await screen.findByDisplayValue('Ayesha Rahman');

    fireEvent.changeText(
      screen.getByTestId('edit-profile-bio'),
      'A brand new bio that is definitely long enough.',
    );
    await settle();
    expect(saveDisabled()).toBe(false);

    mockRequest.mockResolvedValueOnce({
      ...profileResponse,
      profile: {
        ...profileResponse.profile,
        bio: 'A brand new bio that is definitely long enough.',
      },
    });

    fireEvent.press(screen.getByTestId('edit-profile-save'));
    await settle();
    await settle();

    const patchCall = mockRequest.mock.calls.find(
      ([args]) => (args as { method?: string }).method === 'PATCH',
    );
    expect(patchCall).toBeTruthy();
    expect(patchCall?.[0].data).toEqual({ bio: 'A brand new bio that is definitely long enough.' });
  });

  test('clearing an optional field to blank sends an explicit null, not an empty string', async () => {
    const withWebsite: MyProfileResponse = {
      ...profileResponse,
      profile: { ...profileResponse.profile, websiteUrl: 'https://example.com' },
    };
    mockRequest.mockResolvedValue(withWebsite);
    renderScreen();
    await screen.findByDisplayValue('https://example.com');

    fireEvent.changeText(screen.getByTestId('edit-profile-website'), '');
    await settle();

    mockRequest.mockResolvedValueOnce(withWebsite);
    fireEvent.press(screen.getByTestId('edit-profile-save'));
    await settle();
    await settle();

    const patchCall = mockRequest.mock.calls.find(
      ([args]) => (args as { method?: string }).method === 'PATCH',
    );
    expect(patchCall?.[0].data).toEqual({ websiteUrl: null });
  });
});
