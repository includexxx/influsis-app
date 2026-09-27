import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { request } from '@/services/http';
import { campaignFeedApi } from '@/scenes/campaigns/api/campaignFeedApi';
import { MyEngagementItem } from '@/scenes/campaigns/types/myEngagement';
import ActiveCampaignsSection from './ActiveCampaignsSection';

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

const engagement: MyEngagementItem = {
  id: 'e1',
  campaignId: 'c1',
  creatorId: 'u1',
  origin: 'requested',
  status: 'accepted',
  pitch: null,
  proposedAmountMinor: null,
  agreedAmountMinor: 600000,
  latestOfferAmountMinor: null,
  latestOfferNote: null,
  currency: 'BDT',
  crossedIntentAt: null,
  createdAt: '2026-09-26T10:00:00.000Z',
  campaign: {
    campaignId: 'c1',
    title: 'New Shop Openning',
    status: 'live',
    coverUrl: null,
    avatarUrl: null,
    budgetAmountMinor: 600000,
    currency: 'BDT',
    applicationDeadline: '2026-10-10',
    contentDeadline: '2026-10-10',
  },
};

let store: ReturnType<typeof makeStore>;

function makeStore() {
  return configureStore({
    reducer: { [campaignFeedApi.reducerPath]: campaignFeedApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(campaignFeedApi.middleware),
  });
}

function renderSection(onCampaignPress?: (id: string) => void) {
  store = makeStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return render(<ActiveCampaignsSection onCampaignPress={onCampaignPress} />, { wrapper });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
});

afterEach(() => {
  store?.dispatch(campaignFeedApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<ActiveCampaignsSection />', () => {
  test("lists the creator's joined campaigns and opens the campaign on tap", async () => {
    mockRequest.mockResolvedValue([engagement]);
    const onCampaignPress = jest.fn();
    renderSection(onCampaignPress);

    expect(await screen.findByText('New Shop Openning')).toBeTruthy();
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/me/engagements',
        params: { page: 1, limit: 3, engagementStatus: ['accepted'] },
      }),
    );

    fireEvent.press(screen.getByTestId('joined-campaign-e1'));
    expect(onCampaignPress).toHaveBeenCalledWith('c1');
  });

  test("shows a message when the creator hasn't joined any campaigns", async () => {
    mockRequest.mockResolvedValue([]);
    renderSection();

    expect(await screen.findByText("You haven't joined any campaigns")).toBeTruthy();
  });
});
