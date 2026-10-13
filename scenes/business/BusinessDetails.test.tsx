import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { request } from '@/services/http';
import { campaignFeedApi } from '@/scenes/campaigns/api/campaignFeedApi';
import { businessDirectoryApi } from './api/businessDirectoryApi';
import { BusinessProfilePublic } from './types/businessDirectory';
import BusinessDetails from './BusinessDetails';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'biz-1' }),
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

const business: BusinessProfilePublic = {
  userId: 'biz-1',
  businessName: 'Pathao Ltd.',
  username: 'pathao',
  description: 'Ride sharing and delivery.',
  categories: [],
  subcategories: [],
  socialLinks: [],
  country: 'bangladesh',
  state: null,
  city: 'Dhaka',
  contactEmail: null,
  contactPhone: null,
  websiteUrl: null,
  avatarUrl: null,
  coverUrl: null,
  verificationStatus: 'verified',
  handle: 'pathao',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const review = {
  id: 'r1',
  rating: 4.5,
  message: 'Clear brief and quick payment.',
  submittedAt: '2026-10-15T10:00:00.000Z',
  reviewer: { userId: 'cr-1', displayName: 'Ayesha Rahman', handle: 'ayesha', avatarUrl: null },
  campaign: { id: 'c1', title: 'Pathao Summer Push' },
};

// Answers E2 with `profile` and CK4 with `reviews`; the campaign feed and the
// creator's completed engagements come back empty.
function answer(profile: unknown, reviews: unknown[] = []) {
  mockRequest.mockImplementation((async (cfg: unknown) => {
    const { url } = cfg as { url: string };
    if (url === '/business-profiles/biz-1') return profile;
    if (url === '/business-profiles/biz-1/reviews') return reviews;
    return [];
  }) as typeof request);
}

let store: ReturnType<typeof makeStore>;

function makeStore() {
  return configureStore({
    reducer: {
      [businessDirectoryApi.reducerPath]: businessDirectoryApi.reducer,
      [campaignFeedApi.reducerPath]: campaignFeedApi.reducer,
    },
    middleware: gDM =>
      gDM({ serializableCheck: false }).concat(
        businessDirectoryApi.middleware,
        campaignFeedApi.middleware,
      ),
  });
}

function renderScreen() {
  store = makeStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return render(<BusinessDetails />, { wrapper });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
  mockPush.mockReset();
});

afterEach(() => {
  store?.dispatch(businessDirectoryApi.util.resetApiState());
  store?.dispatch(campaignFeedApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<BusinessDetails /> reputation (37c)', () => {
  test('shows the rating summary', async () => {
    answer({
      ...business,
      reputation: { averageRating: 4.5, reviewCount: 12, completedEngagements: 14 },
    });
    renderScreen();

    expect(await screen.findByText('4.5 · 12 reviews · 14 campaigns completed')).toBeTruthy();
  });

  test('says "New" with no ratings yet', async () => {
    answer({
      ...business,
      reputation: { averageRating: null, reviewCount: 0, completedEngagements: 3 },
    });
    renderScreen();

    expect(await screen.findByText('New - no ratings yet · 3 campaigns completed')).toBeTruthy();
  });

  test('shows no summary without reputation', async () => {
    answer(business);
    renderScreen();

    expect(await screen.findByText('Pathao Ltd.')).toBeTruthy();
    expect(screen.queryByTestId('business-rating-summary')).toBeNull();
  });

  test('lists reviews from creators; a creator reviewer opens their profile', async () => {
    answer(business, [review]);
    renderScreen();

    expect(await screen.findByText('Clear brief and quick payment.')).toBeTruthy();
    expect(screen.getByText('Reviews from creators')).toBeTruthy();
    fireEvent.press(screen.getByTestId('business-reviewer-r1'));
    expect(mockPush).toHaveBeenCalledWith('/creator/cr-1');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/business-profiles/biz-1/reviews',
        params: { page: 1, limit: 10 },
      }),
    );
  });

  test('says when there are no reviews from creators', async () => {
    answer(business);
    renderScreen();

    expect(await screen.findByText('No reviews from creators yet.')).toBeTruthy();
  });
});
