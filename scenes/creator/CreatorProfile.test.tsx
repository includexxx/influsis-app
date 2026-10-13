import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ApiError, request } from '@/services/http';
import { creatorDirectoryApi } from './api/creatorDirectoryApi';
import { CreatorProfilePublic } from './types/creatorDirectory';
import CreatorProfile from './CreatorProfile';

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
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
const mockPush = jest.fn();

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

const PROFILE_URL = `/creator-profiles/${creator.userId}`;

// Answers E4 with `profile`, CK3 with `reviews` and CK5 with `work`.
function answer(profile: unknown, reviews: unknown[] = [], work: unknown[] = []) {
  mockRequest.mockImplementation((async (cfg: unknown) => {
    const { url } = cfg as { url: string };
    if (url === `${PROFILE_URL}/reviews`) return reviews;
    if (url === `${PROFILE_URL}/campaign-portfolio`) return work;
    return profile;
  }) as typeof request);
}

const review = {
  id: 'r1',
  rating: 5,
  message: 'Delivered ahead of schedule.',
  submittedAt: '2026-10-15T10:00:00.000Z',
  reviewer: { userId: 'b1', displayName: 'Bkash Ltd.', handle: 'bkash', avatarUrl: null },
  campaign: { id: 'c1', title: 'Bkash Eid Campaign' },
};

const workEntry = {
  engagementId: 'e1',
  completedAt: '2026-10-14T09:05:00.000Z',
  campaign: { id: 'c1', title: 'Pathao Summer Push', objective: null, coverUrl: null },
  business: { userId: 'b2', displayName: 'Pathao Ltd.', handle: 'pathao', avatarUrl: null },
  pieces: [],
  review: null,
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
  mockPush.mockReset();
});

afterEach(() => {
  store?.dispatch(creatorDirectoryApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<CreatorProfile />', () => {
  test('shows a skeleton, then the full public profile', async () => {
    answer(creator);
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
    answer({
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

  describe('reputation, reviews and campaign work (37c)', () => {
    test('shows the rating and completed projects from reputation', async () => {
      answer({
        ...creator,
        reputation: { averageRating: 4.5, reviewCount: 12, completedEngagements: 14 },
      });
      renderScreen();

      expect(await screen.findByText('4.5')).toBeTruthy();
      expect(screen.getByText('14')).toBeTruthy();
    });

    test('says "New" with no ratings yet', async () => {
      answer({
        ...creator,
        reputation: { averageRating: null, reviewCount: 0, completedEngagements: 2 },
      });
      renderScreen();

      expect(await screen.findByText('New')).toBeTruthy();
      expect(screen.getByText('No ratings yet')).toBeTruthy();
    });

    test('lists reviews; a business reviewer opens their page', async () => {
      answer(creator, [review]);
      renderScreen();

      fireEvent.press(await screen.findByTestId('creator-profile-reviewer-r1'));
      expect(mockPush).toHaveBeenCalledWith('/business/b1');
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: `${PROFILE_URL}/reviews`, params: { page: 1, limit: 10 } }),
      );
    });

    test('a "Former Influsis member" reviewer is not tappable', async () => {
      answer(creator, [
        {
          ...review,
          reviewer: {
            userId: 'gone',
            displayName: 'Former Influsis member',
            handle: null,
            avatarUrl: null,
          },
        },
      ]);
      renderScreen();

      expect(await screen.findByText('Former Influsis member')).toBeTruthy();
      expect(screen.queryByTestId('creator-profile-reviewer-r1')).toBeNull();
    });

    test('lists campaign work without a hide toggle', async () => {
      answer(creator, [], [workEntry]);
      renderScreen();

      expect(await screen.findByTestId('campaign-work-e1')).toBeTruthy();
      expect(screen.getByText('Pathao Summer Push')).toBeTruthy();
      expect(screen.queryByTestId('campaign-work-e1-toggle')).toBeNull();
    });

    test('shows the empty states', async () => {
      answer(creator);
      renderScreen();

      expect(await screen.findByText('No reviews yet.')).toBeTruthy();
      expect(screen.getByText('No campaign work to show yet.')).toBeTruthy();
    });
  });
});
