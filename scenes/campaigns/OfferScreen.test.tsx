import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ApiError, request } from '@/services/http';
import { campaignFeedApi } from './api/campaignFeedApi';
import { EngagementOffer, MyEngagementDetail } from './types/myEngagement';
import OfferScreen from './OfferScreen';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'eng-1', title: 'Pathao Summer Push' }),
}));

jest.mock('@/services/http', () => {
  class ApiError extends Error {
    code: string;
    statusCode: number;
    errors: Record<string, string> | null;
    constructor(body: { code?: string; statusCode: number; message?: string }) {
      super(body.message ?? 'api error');
      this.name = 'ApiError';
      this.code = body.code ?? 'UNKNOWN';
      this.statusCode = body.statusCode;
      this.errors = null;
    }
  }
  return { __esModule: true, request: jest.fn(), ApiError };
});

const mockRequest = request as jest.MockedFunction<typeof request>;

type RequestConfig = { url: string; method?: string; data?: unknown };

function answerWith(handler: (cfg: RequestConfig) => unknown) {
  mockRequest.mockImplementation((async (cfg: unknown) =>
    handler(cfg as RequestConfig)) as typeof request);
}

function offer(
  roundNo: number,
  senderType: EngagementOffer['senderType'],
  status: EngagementOffer['status'],
  amountMinor: number,
): EngagementOffer {
  return {
    id: `offer-${roundNo}`,
    roundNo,
    senderType,
    amountMinor,
    currency: 'BDT',
    note: null,
    status,
    createdAt: '2026-09-28T10:00:00.000Z',
  };
}

function engagement(overrides: Partial<MyEngagementDetail>): MyEngagementDetail {
  const offers = overrides.offers ?? [];
  return {
    id: 'eng-1',
    campaignId: 'campaign-1',
    creatorId: 'creator-1',
    origin: 'invited',
    status: 'pending',
    pitch: null,
    proposedAmountMinor: null,
    agreedAmountMinor: null,
    latestOfferAmountMinor: null,
    latestOfferNote: null,
    currency: 'BDT',
    crossedIntentAt: null,
    createdAt: '2026-09-28T10:00:00.000Z',
    negotiationRoundLimit: 3,
    negotiationRoundCount: offers.length,
    licensingMarkupMinor: null,
    acceptedAt: null,
    closedAt: null,
    closeReason: null,
    nextAction: null,
    escrowFundingDeadline: null,
    ...overrides,
    offers,
  };
}

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
  return render(<OfferScreen />, { wrapper });
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

describe('<OfferScreen />', () => {
  test("shows the thread and Accept/Counter/Decline for the business's invitation", async () => {
    answerWith(() => engagement({ offers: [offer(1, 'business', 'pending', 2_000_000)] }));
    renderScreen();

    expect(await screen.findByText('Pathao Summer Push')).toBeTruthy();
    expect(screen.getByText('Round 1 · Business')).toBeTruthy();
    expect(screen.getByText('BDT 20,000')).toBeTruthy();
    expect(screen.getByTestId('offer-rounds-left').props.children).toEqual(['Rounds left: ', 2]);
    expect(screen.getByTestId('offer-accept')).toBeTruthy();
    expect(screen.getByTestId('offer-counter')).toBeTruthy();
    expect(screen.getByTestId('offer-decline')).toBeTruthy();
    expect(screen.queryByTestId('offer-withdraw-offer')).toBeNull();
    expect(screen.queryByTestId('offer-withdraw-application')).toBeNull();
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/me/engagements/eng-1', method: 'GET' }),
    );
  });

  test("hides Counter and waits when the creator's own offer is pending", async () => {
    answerWith(() =>
      engagement({
        origin: 'requested',
        offers: [offer(1, 'creator', 'pending', 2_500_000)],
      }),
    );
    renderScreen();

    expect(await screen.findByText('Waiting for the business to respond.')).toBeTruthy();
    expect(screen.getByText('Round 1 · You')).toBeTruthy();
    expect(screen.queryByTestId('offer-counter')).toBeNull();
    expect(screen.queryByTestId('offer-accept')).toBeNull();
    expect(screen.getByTestId('offer-withdraw-offer')).toBeTruthy();
    expect(screen.getByTestId('offer-withdraw-application')).toBeTruthy();
  });

  test('sends a counter-offer, then shows the server message after a 409', async () => {
    answerWith(({ method }) => {
      if (method === 'POST') {
        throw new ApiError({
          code: 'NEGOTIATION_LIMIT_REACHED',
          statusCode: 409,
          message: 'This engagement has reached its negotiation round cap.',
        });
      }
      return engagement({
        status: 'countered',
        offers: [
          offer(1, 'creator', 'superseded', 3_000_000),
          offer(2, 'business', 'pending', 2_000_000),
        ],
      });
    });
    renderScreen();

    fireEvent.press(await screen.findByTestId('offer-counter'));
    fireEvent.changeText(screen.getByTestId('offer-counter-amount'), '25,000');
    await act(async () => {
      fireEvent.press(screen.getByTestId('offer-counter-submit'));
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/engagements/eng-1/offers',
        method: 'POST',
        data: { amountMinor: 2_500_000 },
      }),
    );
    expect(
      await screen.findByText('This engagement has reached its negotiation round cap.'),
    ).toBeTruthy();
  });

  test('shows the agreed price and the escrow deadline once accepted', async () => {
    answerWith(() =>
      engagement({
        status: 'accepted',
        agreedAmountMinor: 2_300_000,
        licensingMarkupMinor: 575_000,
        nextAction: 'fund_escrow',
        escrowFundingDeadline: '2026-10-01T09:00:00',
        offers: [offer(1, 'business', 'accepted', 2_300_000)],
      }),
    );
    renderScreen();

    expect(await screen.findByTestId('offer-accepted-summary')).toBeTruthy();
    expect(screen.getByText('Agreed price')).toBeTruthy();
    expect(screen.getByText('The business has until 1 Oct 2026 to fund escrow.')).toBeTruthy();
    expect(screen.queryByTestId('offer-counter')).toBeNull();
  });

  test('shows a retryable error state when the engagement fails to load', async () => {
    answerWith(() => {
      throw new Error('offline');
    });
    renderScreen();

    expect(await screen.findByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });
});
