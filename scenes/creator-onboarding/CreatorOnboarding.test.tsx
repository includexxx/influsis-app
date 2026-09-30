import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, act } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
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

import { request } from '@/services/http';
import { profilesApi } from '@/services/profilesApi';
import { MyProfileResponse } from '@/types';
import creatorOnboarding, { goToStep, completeOnboarding } from '@/slices/creatorOnboarding.slice';
import CreatorOnboarding from './CreatorOnboarding';

const mockRequest = request as jest.MockedFunction<typeof request>;

async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
}

function renderShell(setup?: (dispatch: ReturnType<typeof configureStore>['dispatch']) => void) {
  const store = configureStore({
    reducer: { creatorOnboarding, [profilesApi.reducerPath]: profilesApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(profilesApi.middleware),
  });
  setup?.(store.dispatch);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  render(<CreatorOnboarding />, { wrapper });
  return store;
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
  mockRequest.mockResolvedValue(null as unknown as MyProfileResponse);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<CreatorOnboarding />', () => {
  test('renders the active step while onboarding is in progress', async () => {
    renderShell(dispatch => dispatch(goToStep(10)));
    expect(screen.getByText('10 of 10')).toBeTruthy();
    expect(screen.queryByText("You're all set")).toBeNull();
    await settle();
  });

  test('swaps the wizard for the completion screen once completed', async () => {
    renderShell(dispatch => {
      dispatch(goToStep(10));
      dispatch(completeOnboarding());
    });
    expect(screen.getByText("You're all set")).toBeTruthy();
    expect(screen.queryByText('10 of 10')).toBeNull();
    await settle();
  });

  test('passes the fetched profile name into step 1', async () => {
    const profileResponse: MyProfileResponse = {
      kind: 'creator',
      handle: 'ayesha',
      profile: {
        id: 'p-1',
        name: 'Ayesha Rahman',
        bio: '',
        categories: [],
        subcategories: [],
        languages: [],
        deliverables: [],
        platforms: [],
        portfolio: [],
        dateOfBirth: null,
        gender: null,
        country: null,
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
    mockRequest.mockResolvedValue(profileResponse);

    renderShell();

    expect(await screen.findByDisplayValue('Ayesha Rahman')).toBeTruthy();
  });
});
