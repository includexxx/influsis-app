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
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));

// See OptionSheet.test.tsx: force BottomSheet's plain-View web fallback so
// the Agreement sheet renders under Jest.
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
      errors?: Record<string, string>;
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
    scopeChanged: false,
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
    scope: [
      { id: 'scope-1', platform: 'instagram', type: 'reels', count: 2 },
      { id: 'scope-2', platform: 'tiktok', type: 'video', count: 1 },
    ],
    ...overrides,
    offers,
  };
}

// CB2 (GET /feed/campaigns/:id) - only the fields the Agreement sheet reads.
const feedCampaign = {
  id: 'campaign-1',
  title: 'Pathao Summer Push',
  licensingTier: 2,
  contentDeadline: '2026-10-10',
  business: {
    businessId: 'biz-1',
    businessName: 'Pathao Ltd.',
    avatarUrl: null,
    verificationStatus: 'verified',
  },
};

const isCampaignRequest = (cfg: RequestConfig) => cfg.url === '/feed/campaigns/campaign-1';

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
  mockParams = { id: 'eng-1', title: 'Pathao Summer Push' };
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

  test('once accepted, shows what the creator receives (licensing included) and no escrow line', async () => {
    answerWith(cfg =>
      isCampaignRequest(cfg)
        ? feedCampaign
        : engagement({
            status: 'accepted',
            agreedAmountMinor: 2_300_000,
            licensingMarkupMinor: 575_000,
            acceptedAt: '2026-09-30T10:00:00',
            nextAction: 'fund_escrow',
            escrowFundingDeadline: '2026-10-01T09:00:00',
            offers: [offer(1, 'business', 'accepted', 2_300_000)],
          }),
    );
    renderScreen();

    expect(await screen.findByTestId('offer-accepted-summary')).toBeTruthy();
    expect(screen.getByText("You'll receive")).toBeTruthy();
    expect(screen.getByText('BDT 28,750')).toBeTruthy();
    expect(screen.queryByText(/escrow/i)).toBeNull();
    expect(screen.queryByTestId('offer-counter')).toBeNull();

    fireEvent.press(screen.getByTestId('offer-view-agreement'));
    expect(await screen.findByText('Agreement confirmed · 30 Sep, 2026')).toBeTruthy();
    expect(screen.queryByTestId('agreement-accept')).toBeNull();
  });

  test('Accept opens the agreement; confirming accepts the offer shown', async () => {
    let accepted = false;
    answerWith(cfg => {
      if (isCampaignRequest(cfg)) return feedCampaign;
      if (cfg.method === 'POST') {
        accepted = true;
        return {};
      }
      return accepted
        ? engagement({
            status: 'accepted',
            agreedAmountMinor: 2_000_000,
            licensingMarkupMinor: 500_000,
            acceptedAt: '2026-09-30T10:00:00',
            offers: [offer(1, 'business', 'accepted', 2_000_000)],
          })
        : engagement({ offers: [offer(1, 'business', 'pending', 2_000_000)] });
    });
    renderScreen();

    fireEvent.press(await screen.findByTestId('offer-accept'));
    expect(await screen.findByText('Review the agreement')).toBeTruthy();
    expect(screen.getByText('Pathao Ltd.')).toBeTruthy();
    expect(screen.getByLabelText("You'll receive 25,000 taka")).toBeTruthy();
    expect(mockRequest).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'POST' }));

    await act(async () => {
      fireEvent.press(screen.getByTestId('agreement-accept'));
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/me/engagements/eng-1/accept',
        method: 'POST',
        data: { offerId: 'offer-1' },
      }),
    );
    expect(await screen.findByText('Agreement confirmed · 30 Sep, 2026')).toBeTruthy();
  });

  test('Back to offer closes the agreement without accepting', async () => {
    answerWith(cfg =>
      isCampaignRequest(cfg)
        ? feedCampaign
        : engagement({ offers: [offer(1, 'business', 'pending', 2_000_000)] }),
    );
    renderScreen();

    fireEvent.press(await screen.findByTestId('offer-accept'));
    fireEvent.press(await screen.findByTestId('agreement-back'));

    expect(screen.queryByTestId('agreement-sheet')).toBeNull();
    expect(mockRequest).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'POST' }));
  });

  test('a 409 keeps the agreement open with the server message and disables Accept', async () => {
    let countered = false;
    answerWith(cfg => {
      if (isCampaignRequest(cfg)) return feedCampaign;
      if (cfg.method === 'POST') {
        countered = true;
        throw new ApiError({
          code: 'OFFER_NOT_PENDING',
          statusCode: 409,
          message: 'This offer is no longer pending.',
        });
      }
      return countered
        ? engagement({
            status: 'countered',
            offers: [
              offer(1, 'business', 'superseded', 2_000_000),
              offer(2, 'business', 'pending', 1_800_000),
            ],
          })
        : engagement({ offers: [offer(1, 'business', 'pending', 2_000_000)] });
    });
    renderScreen();

    fireEvent.press(await screen.findByTestId('offer-accept'));
    const accept = await screen.findByTestId('agreement-accept');
    await act(async () => {
      fireEvent.press(accept);
    });

    expect(await screen.findByTestId('agreement-message')).toBeTruthy();
    expect(screen.getAllByText('This offer is no longer pending.').length).toBeGreaterThan(0);
    // The refetch brought a new offer; the sheet keeps the reviewed terms
    // (BDT 20,000 + 25%) with Accept disabled.
    await screen.findByText('BDT 18,000');
    expect(screen.getByLabelText("You'll receive 25,000 taka")).toBeTruthy();
    expect(screen.getByTestId('agreement-accept').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  test("won't show the pay when the campaign's terms fail to load", async () => {
    answerWith(cfg => {
      if (isCampaignRequest(cfg))
        throw new ApiError({ code: 'NOT_FOUND', statusCode: 404, message: 'Not found' });
      return engagement({ offers: [offer(1, 'business', 'pending', 2_000_000)] });
    });
    renderScreen();

    fireEvent.press(await screen.findByTestId('offer-accept'));

    expect(await screen.findByText("Couldn't load the campaign terms.")).toBeTruthy();
    expect(screen.queryByTestId('agreement-accept')).toBeNull();
  });

  test('review=1 opens the agreement on load', async () => {
    mockParams = { id: 'eng-1', title: 'Pathao Summer Push', review: '1' };
    answerWith(cfg =>
      isCampaignRequest(cfg)
        ? feedCampaign
        : engagement({ offers: [offer(1, 'business', 'pending', 2_000_000)] }),
    );
    renderScreen();

    expect(await screen.findByText('Review the agreement')).toBeTruthy();
    expect(mockRequest).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'POST' }));

    fireEvent.press(screen.getByTestId('agreement-back'));
    expect(screen.queryByTestId('agreement-sheet')).toBeNull();
  });

  test('shows a retryable error state when the engagement fails to load', async () => {
    answerWith(() => {
      throw new Error('offline');
    });
    renderScreen();

    expect(await screen.findByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });
  test('shows the deliverables and tags rounds that changed them (backend 18l)', async () => {
    answerWith(() =>
      engagement({
        status: 'countered',
        offers: [
          offer(1, 'business', 'superseded', 2_000_000),
          { ...offer(2, 'business', 'pending', 2_000_000), scopeChanged: true },
        ],
      }),
    );
    renderScreen();

    expect(await screen.findByTestId('offer-deliverables')).toBeTruthy();
    expect(screen.getByText('2 × Instagram Reels')).toBeTruthy();
    expect(screen.getByText('1 × TikTok Video')).toBeTruthy();
    expect(screen.queryByTestId('offer-round-1-scope-changed')).toBeNull();
    expect(screen.getByTestId('offer-round-2-scope-changed')).toBeTruthy();
  });

  test('a deliverables-only counter re-sends the pre-filled amount with the new scope', async () => {
    answerWith(() => engagement({ offers: [offer(1, 'business', 'pending', 2_000_000)] }));
    renderScreen();

    fireEvent.press(await screen.findByTestId('offer-counter'));
    expect(screen.getByTestId('offer-counter-amount').props.value).toBe('20000');
    fireEvent.press(screen.getByTestId('offer-change-deliverables'));
    fireEvent.press(screen.getByLabelText('Increase Instagram Reels'));
    await act(async () => {
      fireEvent.press(screen.getByTestId('offer-counter-submit'));
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/engagements/eng-1/offers',
        method: 'POST',
        data: {
          amountMinor: 2_000_000,
          scope: [
            { platform: 'instagram', type: 'reels', count: 3 },
            { platform: 'tiktok', type: 'video', count: 1 },
          ],
        },
      }),
    );
  });

  test('an opened but unchanged deliverables editor sends no scope', async () => {
    answerWith(() => engagement({ offers: [offer(1, 'business', 'pending', 2_000_000)] }));
    renderScreen();

    fireEvent.press(await screen.findByTestId('offer-counter'));
    fireEvent.press(screen.getByTestId('offer-change-deliverables'));
    await act(async () => {
      fireEvent.press(screen.getByTestId('offer-counter-submit'));
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', data: { amountMinor: 2_000_000 } }),
    );
  });

  test('shows a backend scope error under its row', async () => {
    answerWith(({ method }) => {
      if (method === 'POST') {
        throw new ApiError({
          code: 'VALIDATION_FAILED',
          statusCode: 422,
          message: 'The submitted data is invalid.',
          errors: { 'scope[0]': 'duplicate platform/type - send count instead' },
        } as never);
      }
      return engagement({ offers: [offer(1, 'business', 'pending', 2_000_000)] });
    });
    renderScreen();

    fireEvent.press(await screen.findByTestId('offer-counter'));
    fireEvent.press(screen.getByTestId('offer-change-deliverables'));
    fireEvent.press(screen.getByLabelText('Decrease Instagram Reels'));
    await act(async () => {
      fireEvent.press(screen.getByTestId('offer-counter-submit'));
    });

    expect(await screen.findByText('duplicate platform/type - send count instead')).toBeTruthy();
  });
  test('offers Deliver work only once accepted or completed (item 25)', async () => {
    answerWith(() =>
      engagement({
        status: 'accepted',
        agreedAmountMinor: 2_000_000,
        offers: [offer(1, 'business', 'accepted', 2_000_000)],
      }),
    );
    renderScreen();

    fireEvent.press(await screen.findByTestId('offer-deliver-work'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/engagement/[id]/deliverables',
      params: { id: 'eng-1', title: 'Pathao Summer Push' },
    });
  });

  test('hides Deliver work while negotiating', async () => {
    answerWith(() => engagement({ offers: [offer(1, 'business', 'pending', 2_000_000)] }));
    renderScreen();

    expect(await screen.findByTestId('offer-counter')).toBeTruthy();
    expect(screen.queryByTestId('offer-deliver-work')).toBeNull();
  });
});
