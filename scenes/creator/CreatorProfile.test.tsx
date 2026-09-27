import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react-native';

import { ApiError, request } from '@/services/http';
import { creatorDirectoryApi } from './api/creatorDirectoryApi';
import { CreatorProfilePublic } from './types/creatorDirectory';
import CreatorProfile from './CreatorProfile';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: '09fb1827-642a-4a17-99a3-1aa6765d8d07' }),
  Redirect: ({ href }: { href: string }) => {
    const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
    return <Text>{'redirect:' + href}</Text>;
  },
}));

jest.mock('@/services/http', () => {
  class ApiError extends Error {
    code: string;
    statusCode: number;
    constructor(body: { code?: string; statusCode: number; message?: string }) {
      super(body.message ?? 'api error');
      this.code = body.code ?? 'UNKNOWN';
      this.statusCode = body.statusCode;
    }
  }
  return { __esModule: true, request: jest.fn(), ApiError };
});

const mockRequest = request as jest.MockedFunction<typeof request>;

const creator: CreatorProfilePublic = {
  userId: '09fb1827-642a-4a17-99a3-1aa6765d8d07',
  displayName: 'Ayesha Rahman',
  bio: 'Skincare creator sharing honest routines.',
  categories: ['beauty'],
  subcategories: ['skincare'],
  languages: ['english'],
  platforms: [{ platform: 'instagram', handle: 'ayesha' }],
  portfolio: [{ url: 'instagram.com/p/a', platform: 'instagram', thumbnailUrl: null }],
  country: 'bangladesh',
  state: null,
  city: 'Dhaka',
  websiteUrl: 'https://ayesha.example',
  avatarUrl: null,
  coverUrl: null,
  verificationStatus: 'verified',
  handle: 'ayesha',
  createdAt: '2026-08-13T12:00:00.000Z',
};

let store: ReturnType<typeof makeStore>;

function makeStore() {
  return configureStore({
    reducer: { [creatorDirectoryApi.reducerPath]: creatorDirectoryApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(creatorDirectoryApi.middleware),
  });
}

function renderScreen() {
  store = makeStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return render(<CreatorProfile />, { wrapper });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
});

afterEach(() => {
  store?.dispatch(creatorDirectoryApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<CreatorProfile />', () => {
  test('shows a skeleton, then the full public profile', async () => {
    mockRequest.mockResolvedValue(creator);
    renderScreen();

    expect(screen.getByTestId('creator-profile-skeleton')).toBeTruthy();
    expect(await screen.findByText('Ayesha Rahman')).toBeTruthy();

    expect(screen.getByText('Verified')).toBeTruthy();
    expect(screen.getByText('@ayesha')).toBeTruthy();
    expect(screen.getByText('Dhaka, Bangladesh')).toBeTruthy();
    expect(screen.getByText('Skincare creator sharing honest routines.')).toBeTruthy();
    expect(screen.getByText('Aug 2026')).toBeTruthy();
    expect(screen.getByText('Beauty & Lifestyle')).toBeTruthy();
    expect(screen.getByText('Skincare')).toBeTruthy();
    expect(screen.getByText('English')).toBeTruthy();
    expect(screen.getByText('Instagram · @ayesha')).toBeTruthy();
    expect(screen.getByText('ayesha.example')).toBeTruthy();
    expect(screen.getByTestId('creator-profile-portfolio-0')).toBeTruthy();
    // Public view: no owner-only controls.
    expect(screen.queryByText('Add work')).toBeNull();
    expect(screen.queryByText('Edit')).toBeNull();
  });

  test('hides sections the creator has left empty', async () => {
    mockRequest.mockResolvedValue({
      ...creator,
      subcategories: [],
      languages: [],
      platforms: [],
      websiteUrl: null,
      portfolio: [],
      verificationStatus: 'unverified',
    });
    renderScreen();

    expect(await screen.findByText('Ayesha Rahman')).toBeTruthy();
    expect(screen.queryByText('Subcategories')).toBeNull();
    expect(screen.queryByText('Languages')).toBeNull();
    expect(screen.queryByText('Social platforms')).toBeNull();
    expect(screen.queryByText('Website')).toBeNull();
    expect(screen.queryByText('Verified')).toBeNull();
    expect(screen.getByText('No portfolio work shared yet.')).toBeTruthy();
  });

  test('shows a retryable error when loading fails', async () => {
    mockRequest.mockRejectedValue(
      new ApiError({ code: 'INTERNAL_ERROR', statusCode: 500, message: 'boom' }),
    );
    renderScreen();

    expect(await screen.findByText('Try again')).toBeTruthy();
  });

  test('redirects home when the profile does not exist or is hidden', async () => {
    mockRequest.mockRejectedValue(
      new ApiError({ code: 'NOT_FOUND', statusCode: 404, message: 'Creator profile not found.' }),
    );
    renderScreen();

    expect(await screen.findByText('redirect:/home')).toBeTruthy();
  });
});
