import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ApiError, request } from '@/services/http';
import { campaignFeedApi } from './api/campaignFeedApi';
import { CampaignFeedDetail } from './types/campaignFeed';
import CampaignDetails from './CampaignDetails';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'c37bd636-54fb-4469-9752-a3ce2cc2128c' }),
  Redirect: ({ href }: { href: string }) => {
    const { Text: RNText } = jest.requireActual<typeof import('react-native')>('react-native');
    return <RNText>{`redirect:${href}`}</RNText>;
  },
}));

jest.mock(
  'react-native-safe-area-context',
  () =>
    (jest.requireActual('react-native-safe-area-context/jest/mock') as { default: object }).default,
);

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

const campaign: CampaignFeedDetail = {
  id: 'c37bd636-54fb-4469-9752-a3ce2cc2128c',
  businessId: '8ba43b43-fb06-4ee2-a25d-caa71f4189b5',
  type: 'campaign',
  status: 'live',
  publishedAt: '2026-09-26T10:19:12.511Z',
  title: 'New Shop Openning',
  description: 'Celebrate our new Gulshan branch with us.',
  country: 'Bangladesh',
  state: null,
  city: 'Dhaka',
  zipCode: null,
  coverUrl: null,
  avatarUrl: null,
  preferredGender: 'any',
  audienceLocation: null,
  budgetAmountMinor: 600000,
  currency: 'BDT',
  licensingTier: 1,
  appliedPromoCode: null,
  applicationDeadline: '2026-10-10',
  contentDeadline: '2026-10-10',
  campaignEndDate: '2026-10-10',
  preferredPostingDates: null,
  promoting: ['Grand opening offers'],
  objectives: [],
  categories: ['food'],
  subCategories: [],
  ageRanges: [],
  interests: [],
  requirements: [
    {
      id: 'timing',
      sectionKey: 'timing',
      label: 'Timing',
      hint: null,
      icon: null,
      tone: null,
      layout: 'list',
      sortOrder: 1,
      items: ['Content due by 2026-10-10'],
      readOnly: true,
    },
  ],
  deliverables: [{ id: 'd1', platform: 'instagram', type: 'reels', count: 2 }],
  business: {
    businessId: '8ba43b43-fb06-4ee2-a25d-caa71f4189b5',
    businessName: 'Dhaka Delights Ltd.',
    avatarUrl: null,
    verificationStatus: 'verified',
  },
  myEngagement: null,
  createdAt: '2026-09-26T10:00:00.000Z',
  updatedAt: '2026-09-26T10:00:00.000Z',
};

let store: ReturnType<typeof makeStore>;

function makeStore() {
  return configureStore({
    reducer: { [campaignFeedApi.reducerPath]: campaignFeedApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(campaignFeedApi.middleware),
  });
}

function renderScreen() {
  store = makeStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return render(<CampaignDetails />, { wrapper });
}

beforeEach(() => {
  jest.useFakeTimers();
  // Fixed "today" so the 10 Oct, 2026 application deadline stays open.
  jest.setSystemTime(new Date(2026, 9, 7));
  mockRequest.mockReset();
  mockPush.mockReset();
});

afterEach(() => {
  store?.dispatch(campaignFeedApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<CampaignDetails />', () => {
  test('fetches the campaign by route id and renders its details', async () => {
    mockRequest.mockResolvedValue(campaign);
    renderScreen();

    expect(screen.getByTestId('campaign-details-skeleton')).toBeTruthy();
    expect(await screen.findByText('New Shop Openning')).toBeTruthy();

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: `/feed/campaigns/${campaign.id}`, method: 'GET' }),
    );
    expect(screen.getByText('Dhaka Delights Ltd.')).toBeTruthy();
    expect(screen.getByText('Posted 26 Sep, 2026')).toBeTruthy();
    expect(screen.getByText('Dhaka, Bangladesh')).toBeTruthy();
    expect(screen.getByText('Food')).toBeTruthy(); // category pill on the cover
    // The budget card and the pinned apply bar.
    expect(screen.getAllByText('BDT 6,000')).toHaveLength(2);
    expect(screen.getByText('3 days left')).toBeTruthy();
    expect(screen.getByText('Apply by 10 Oct, 2026')).toBeTruthy();
    expect(screen.getByText('Celebrate our new Gulshan branch with us.')).toBeTruthy();
    expect(screen.getByText('Grand opening offers')).toBeTruthy();
    expect(screen.getByText('Content due by 2026-10-10')).toBeTruthy();
    expect(screen.getByText('2 × Reels')).toBeTruthy();
    expect(screen.getByText('Instagram')).toBeTruthy();

    fireEvent.press(screen.getByText('Apply Now'));
    expect(mockPush).toHaveBeenCalledWith(`/campaign/${campaign.id}/apply`);

    fireEvent.press(screen.getByTestId('campaign-details-business'));
    expect(mockPush).toHaveBeenCalledWith(`/business/${campaign.businessId}`);
  });

  test('shows the engagement status instead of Apply when already applied', async () => {
    mockRequest.mockResolvedValue({
      ...campaign,
      myEngagement: { id: 'e1', origin: 'requested', status: 'pending' },
    });
    renderScreen();

    await screen.findByText('New Shop Openning');
    // On the cover and in the apply bar.
    expect(screen.getAllByText('Applied')).toHaveLength(2);
    expect(screen.queryByText('Apply Now')).toBeNull();
    fireEvent.press(screen.getByTestId('campaign-details-apply'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('closes applications once the deadline has passed', async () => {
    mockRequest.mockResolvedValue({ ...campaign, applicationDeadline: '2026-10-01' });
    renderScreen();

    expect(await screen.findByText('Applications closed')).toBeTruthy();
    expect(screen.getByText('Closed')).toBeTruthy();
    fireEvent.press(screen.getByTestId('campaign-details-apply'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('renders brief sections by layout, licensing and audience', async () => {
    mockRequest.mockResolvedValue({
      ...campaign,
      licensingTier: 2,
      ageRanges: ['18-24'],
      requirements: [
        {
          ...campaign.requirements[0],
          id: 'donts',
          sectionKey: 'donts',
          label: "Don'ts",
          tone: 'danger',
          sortOrder: 1,
          items: ['No competitor brands'],
        },
        {
          ...campaign.requirements[0],
          id: 'promo',
          sectionKey: 'promo-code',
          label: 'Promo code',
          layout: 'code',
          sortOrder: 2,
          items: ['DHAKA20'],
        },
      ],
    });
    renderScreen();

    expect(await screen.findByText("Don'ts")).toBeTruthy();
    expect(screen.getByText('No competitor brands')).toBeTruthy();
    expect(screen.getByText('DHAKA20')).toBeTruthy();
    expect(screen.getByText('+25% licensing for usage rights')).toBeTruthy();
    expect(screen.getByText('Audience')).toBeTruthy();
    expect(screen.getByText('18-24')).toBeTruthy();
  });

  test('collapses a long description behind Read more', async () => {
    mockRequest.mockResolvedValue({ ...campaign, description: 'Long story. '.repeat(40) });
    renderScreen();

    fireEvent.press(await screen.findByText('Read more'));
    expect(screen.getByText('Show less')).toBeTruthy();
  });

  test('shows a retryable error when the request fails', async () => {
    mockRequest.mockRejectedValue(
      new ApiError({ code: 'INTERNAL_ERROR', statusCode: 500, message: 'boom' }),
    );
    renderScreen();

    expect(await screen.findByText('Something went wrong')).toBeTruthy();
  });

  test('redirects home when the campaign is not live (404)', async () => {
    mockRequest.mockRejectedValue(
      new ApiError({ code: 'NOT_FOUND', statusCode: 404, message: 'Campaign not found.' }),
    );
    renderScreen();

    expect(await screen.findByText('redirect:/home')).toBeTruthy();
  });
});
