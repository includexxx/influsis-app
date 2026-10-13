import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';

import { request } from '@/services/http';
import { profilesApi } from '@/services/profilesApi';
import auth, { sessionEstablished } from '@/slices/auth.slice';
import { AuthAccount } from '@/types';
import { creatorDirectoryApi } from '@/scenes/creator/api/creatorDirectoryApi';
import { campaignFeedApi } from '@/scenes/campaigns/api/campaignFeedApi';
import { PortfolioEntry } from '@/scenes/campaigns/types/portfolio';
import { ProfileReview } from '@/scenes/creator/types/creatorDirectory';
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

const account = {
  id: 'user-1',
  roleKey: 'creator',
  status: 'active',
  role: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  deactivatedAt: null,
};

let store: ReturnType<typeof makeStore>;

function makeStore() {
  return configureStore({
    reducer: {
      auth,
      [profilesApi.reducerPath]: profilesApi.reducer,
      [creatorDirectoryApi.reducerPath]: creatorDirectoryApi.reducer,
      [campaignFeedApi.reducerPath]: campaignFeedApi.reducer,
    },
    middleware: gDM =>
      gDM({ serializableCheck: false }).concat(
        profilesApi.middleware,
        creatorDirectoryApi.middleware,
        campaignFeedApi.middleware,
      ),
  });
}

function renderScreen() {
  store = makeStore();
  store.dispatch(sessionEstablished(account as unknown as AuthAccount));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return render(<MyProfile />, { wrapper });
}

type RequestConfig = { url: string; method?: string; data?: unknown };

const reputation = { averageRating: 4.5, reviewCount: 2, completedEngagements: 3 };

const review: ProfileReview = {
  id: 'r1',
  rating: 5,
  message: 'Delivered ahead of schedule.',
  submittedAt: '2026-10-15T10:00:00.000Z',
  reviewer: { userId: 'b1', displayName: 'Bkash Ltd.', handle: 'bkash', avatarUrl: null },
  campaign: { id: 'c1', title: 'Bkash Eid Campaign' },
};

function entry(overrides: Partial<PortfolioEntry> = {}): PortfolioEntry {
  return {
    engagementId: 'e1',
    completedAt: '2026-10-14T09:05:00.000Z',
    hidden: false,
    campaign: { id: 'c1', title: 'Bkash Eid Campaign', objective: null, coverUrl: null },
    business: { userId: 'b1', displayName: 'Bkash Ltd.', handle: 'bkash', avatarUrl: null },
    pieces: [
      {
        platform: 'instagram',
        type: 'reels',
        title: null,
        finalKind: 'live_post',
        livePostUrl: 'https://www.instagram.com/reel/abc',
      },
      { platform: 'tiktok', type: 'video', title: null, finalKind: 'file_link', livePostUrl: null },
    ],
    review: { rating: 5, message: 'Great reel, on time.', submittedAt: review.submittedAt },
    ...overrides,
  };
}

// Answers each request by URL; an Error value is thrown.
function answer({
  profile = profileResponse as unknown,
  publicProfile = { userId: 'user-1', reputation } as unknown,
  reviews = [] as unknown,
  portfolio = [] as unknown,
  patch = undefined as unknown,
} = {}) {
  mockRequest.mockImplementation((async (cfg: unknown) => {
    const { url, method } = cfg as RequestConfig;
    const pick =
      url === '/profiles/me'
        ? profile
        : url === '/creator-profiles/user-1'
          ? publicProfile
          : url === '/creator-profiles/user-1/reviews'
            ? reviews
            : url === '/me/campaign-portfolio'
              ? portfolio
              : method === 'PATCH'
                ? patch
                : new Error(`unexpected ${url}`);
    if (pick instanceof Error) throw pick;
    return pick;
  }) as typeof request);
}

function apiError(code: string, statusCode: number, message: string) {
  const { ApiError } = jest.requireMock('@/services/http') as {
    ApiError: new (body: { code: string; statusCode: number; message: string }) => Error;
  };
  return new ApiError({ code, statusCode, message });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
});

afterEach(() => {
  store?.dispatch(campaignFeedApi.util.resetApiState());
  store?.dispatch(creatorDirectoryApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<MyProfile />', () => {
  test('shows a spinner while the profile is loading', async () => {
    let resolveRequest: (value: MyProfileResponse) => void = () => {};
    answer({
      profile: new Promise<MyProfileResponse>(resolve => {
        resolveRequest = resolve;
      }),
    });
    renderScreen();
    expect(screen.getByText('My Profile')).toBeTruthy();

    // Resolve and let the request settle so nothing is left pending once the
    // test ends (an eternally-pending mock keeps Jest's process alive).
    resolveRequest(profileResponse);
    await screen.findByText('Ayesha Rahman');
  });

  test('renders the profile once loaded', async () => {
    answer();
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

  describe('rating, projects and reviews (37b)', () => {
    test('shows the rating and completed projects from reputation', async () => {
      answer();
      renderScreen();

      expect(await screen.findByText('4.5')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/creator-profiles/user-1', skipAuth: true }),
      );
    });

    test('says "New" with no ratings yet', async () => {
      answer({
        publicProfile: { userId: 'user-1', reputation: { ...reputation, averageRating: null } },
      });
      renderScreen();

      expect(await screen.findByText('New')).toBeTruthy();
      expect(screen.getByText('No ratings yet')).toBeTruthy();
    });

    test('lists the reviews businesses wrote', async () => {
      answer({ reviews: [review] });
      renderScreen();

      expect(await screen.findByTestId('my-profile-review-r1')).toBeTruthy();
      expect(screen.getAllByText('Delivered ahead of schedule.').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Bkash Eid Campaign').length).toBeGreaterThan(0);
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/creator-profiles/user-1/reviews',
          params: { page: 1, limit: 10 },
        }),
      );
    });

    test('says there are no reviews yet', async () => {
      answer();
      renderScreen();

      expect(await screen.findByTestId('my-profile-reviews-empty')).toBeTruthy();
    });

    test('a non-discoverable creator gets the note and no public reads', async () => {
      answer({
        profile: {
          ...profileResponse,
          profile: { ...profileResponse.profile, isDiscoverable: false },
        },
      });
      renderScreen();

      expect(await screen.findByTestId('my-profile-discoverability-note')).toBeTruthy();
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
      const urls = mockRequest.mock.calls.map(([cfg]) => (cfg as RequestConfig).url);
      expect(urls).not.toContain('/creator-profiles/user-1');
      expect(urls).not.toContain('/creator-profiles/user-1/reviews');
    });

    test('a 404 from the public profile shows the note', async () => {
      answer({ publicProfile: apiError('NOT_FOUND', 404, 'Creator profile not found.') });
      renderScreen();

      expect(await screen.findByTestId('my-profile-discoverability-note')).toBeTruthy();
    });

    test('a failed reviews read offers Try again', async () => {
      answer({ reviews: apiError('INTERNAL_ERROR', 500, 'Server error') });
      renderScreen();

      expect(await screen.findByTestId('my-profile-reviews-error')).toBeTruthy();
    });
  });

  describe('campaign work (37b)', () => {
    test('lists completed campaigns with their pieces and the business review', async () => {
      const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      answer({ portfolio: [entry()] });
      renderScreen();

      expect(await screen.findByTestId('campaign-work-e1')).toBeTruthy();
      expect(screen.getByText('Files delivered privately')).toBeTruthy();
      expect(screen.getByText('Great reel, on time.')).toBeTruthy();
      expect(screen.getByText('Show on public profile')).toBeTruthy();
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/me/campaign-portfolio', params: { page: 1, limit: 10 } }),
      );

      fireEvent.press(screen.getByTestId('campaign-work-e1-link-0'));
      expect(openURL).toHaveBeenCalledWith('https://www.instagram.com/reel/abc');
    });

    test('is shown even when the creator is not discoverable', async () => {
      answer({
        profile: {
          ...profileResponse,
          profile: { ...profileResponse.profile, isDiscoverable: false },
        },
        portfolio: [entry()],
      });
      renderScreen();

      expect(await screen.findByTestId('campaign-work-e1')).toBeTruthy();
    });

    test('hiding an entry sends CK7 and marks it hidden', async () => {
      answer({ portfolio: [entry()], patch: entry({ hidden: true }) });
      renderScreen();

      const toggle = await screen.findByTestId('campaign-work-e1-toggle');
      await act(async () => {
        fireEvent.press(toggle);
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/me/campaign-portfolio/e1',
          method: 'PATCH',
          data: { hidden: true },
        }),
      );
      expect(await screen.findByText('Hidden from your public profile')).toBeTruthy();
      expect(screen.getByTestId('campaign-work-e1-toggle').props.accessibilityState).toEqual(
        expect.objectContaining({ checked: false }),
      );
    });

    test('a 409 puts the entry back and says why', async () => {
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      answer({
        portfolio: [entry()],
        patch: apiError('CONFLICT', 409, 'Only completed campaigns are in your portfolio.'),
      });
      renderScreen();

      const toggle = await screen.findByTestId('campaign-work-e1-toggle');
      await act(async () => {
        fireEvent.press(toggle);
      });

      expect(alert).toHaveBeenCalledWith(
        "Couldn't update",
        'Only completed campaigns are in your portfolio.',
      );
      expect(screen.getByText('Show on public profile')).toBeTruthy();
      expect(screen.queryByText('Hidden from your public profile')).toBeNull();
    });

    test('says when there is no campaign work yet', async () => {
      answer();
      renderScreen();

      expect(await screen.findByTestId('campaign-work-empty')).toBeTruthy();
    });
  });
});
