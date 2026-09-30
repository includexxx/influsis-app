import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ApiError, request } from '@/services/http';
import { campaignFeedApi, CAMPAIGNS_FEED_PAGE_SIZE } from '@/scenes/campaigns/api/campaignFeedApi';
import { CampaignFeedItem } from '@/scenes/campaigns/types/campaignFeed';
import BusinessCampaignsSection from './BusinessCampaignsSection';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
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
const BUSINESS_ID = '8ba43b43-fb06-4ee2-a25d-caa71f4189b5';

function makeCampaign(id: string): CampaignFeedItem {
  return {
    id,
    title: `Campaign ${id}`,
    type: 'campaign',
    status: 'live',
    coverUrl: null,
    avatarUrl: null,
    budgetAmountMinor: 600000,
    currency: 'BDT',
    licensingTier: 1,
    applicationDeadline: '2026-10-10',
    contentDeadline: null,
    campaignEndDate: null,
    publishedAt: null,
    businessId: BUSINESS_ID,
    businessName: 'Dhaka Delights Ltd.',
    myEngagement: null,
  };
}

let store: ReturnType<typeof makeStore>;

function makeStore() {
  return configureStore({
    reducer: { [campaignFeedApi.reducerPath]: campaignFeedApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(campaignFeedApi.middleware),
  });
}

function renderSection() {
  store = makeStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return render(<BusinessCampaignsSection businessId={BUSINESS_ID} />, { wrapper });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
  mockPush.mockReset();
});

afterEach(() => {
  store?.dispatch(campaignFeedApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<BusinessCampaignsSection />', () => {
  test("shows skeletons, then the business's live campaigns", async () => {
    mockRequest.mockResolvedValue([makeCampaign('c1')]);
    renderSection();

    expect(screen.getAllByTestId('campaign-card-skeleton').length).toBeGreaterThan(0);
    expect(await screen.findByText('Campaign c1')).toBeTruthy();
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/feed/campaigns',
        params: { page: 1, limit: CAMPAIGNS_FEED_PAGE_SIZE, businessId: BUSINESS_ID },
      }),
    );
    expect(screen.queryByTestId('business-campaigns-show-more')).toBeNull();

    fireEvent.press(screen.getByTestId('feed-campaign-c1'));
    expect(mockPush).toHaveBeenCalledWith('/campaign/c1');
  });

  test('shows an empty state when the business has no live campaigns', async () => {
    mockRequest.mockResolvedValue([]);
    renderSection();

    expect(await screen.findByText('No ongoing campaigns')).toBeTruthy();
  });

  test('shows a retryable error when loading fails', async () => {
    mockRequest.mockRejectedValue(
      new ApiError({ code: 'INTERNAL_ERROR', statusCode: 500, message: 'boom' }),
    );
    renderSection();

    expect(await screen.findByText('Something went wrong')).toBeTruthy();
  });

  test('loads the next page with Show more', async () => {
    const firstPage = Array.from({ length: CAMPAIGNS_FEED_PAGE_SIZE }, (_, i) =>
      makeCampaign(`p1-${i}`),
    );
    // `request` is generic (Promise<T>), so the page-aware mock is cast.
    mockRequest.mockImplementation((async (config: { params: { page: number } }) =>
      config.params.page === 1 ? firstPage : [makeCampaign('p2-0')]) as typeof request);
    renderSection();

    fireEvent.press(await screen.findByTestId('business-campaigns-show-more'));

    expect(await screen.findByText('Campaign p2-0')).toBeTruthy();
    expect(screen.queryByTestId('business-campaigns-show-more')).toBeNull();
  });
});
