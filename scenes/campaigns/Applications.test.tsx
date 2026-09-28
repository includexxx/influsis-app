import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { request } from '@/services/http';
import { campaignFeedApi } from './api/campaignFeedApi';
import { MyEngagementItem } from './types/myEngagement';
import Applications from './Applications';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
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

// request() is generic over its resolved type; the mocks return plain values.
function answerWith(handler: (cfg: RequestConfig) => unknown) {
  mockRequest.mockImplementation((async (cfg: unknown) =>
    handler(cfg as RequestConfig)) as typeof request);
}

type RequestConfig = { url: string; method?: string; params?: { origin?: string } };

function engagement(overrides: Partial<MyEngagementItem>): MyEngagementItem {
  return {
    id: 'eng-1',
    campaignId: 'campaign-1',
    creatorId: 'creator-1',
    origin: 'requested',
    status: 'pending',
    pitch: null,
    proposedAmountMinor: 450000,
    agreedAmountMinor: null,
    latestOfferAmountMinor: null,
    latestOfferNote: null,
    currency: 'BDT',
    crossedIntentAt: null,
    createdAt: '2026-07-10T09:00:00.000Z',
    campaign: {
      campaignId: 'campaign-1',
      title: 'Bkash Branding Campaign',
      status: 'live',
      coverUrl: null,
      avatarUrl: null,
      budgetAmountMinor: 600000,
      currency: 'BDT',
      applicationDeadline: '2026-10-01',
      contentDeadline: null,
    },
    ...overrides,
  };
}

const application = engagement({ id: 'app-1' });
const invitation = engagement({
  id: 'inv-1',
  origin: 'invited',
  campaign: { ...application.campaign!, title: 'Pathao Summer Push' },
});

// Answers each GET /me/engagements by `origin`.
function mockLists({ applied, invited }: { applied: unknown; invited: unknown }) {
  answerWith(({ params }) => {
    const result = params?.origin === 'invited' ? invited : applied;
    if (result instanceof Error) throw result;
    return result;
  });
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
  return render(<Applications />, { wrapper });
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

describe('<Applications />', () => {
  test('shows skeletons, then the creator’s applications', async () => {
    mockLists({ applied: [application], invited: [] });
    renderScreen();

    expect(screen.getAllByTestId('campaign-card-skeleton').length).toBeGreaterThan(0);
    expect(await screen.findByText('Bkash Branding Campaign')).toBeTruthy();
    // The tab chip plus the card's status badge.
    expect(screen.getAllByText('Applied')).toHaveLength(2);
    expect(screen.queryByTestId('campaign-card-skeleton')).toBeNull();

    const params = mockRequest.mock.calls.map(([cfg]) => (cfg as RequestConfig).params);
    expect(params).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ origin: 'requested', page: 1 }),
        expect.objectContaining({
          origin: 'invited',
          engagementStatus: ['pending', 'countered'],
          page: 1,
        }),
      ]),
    );
  });

  test('tapping an application or an invitation opens its Offer screen', async () => {
    mockLists({
      applied: [application],
      invited: [{ ...invitation, campaignId: 'campaign-2' }],
    });
    renderScreen();

    fireEvent.press(await screen.findByTestId('application-app-1'));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/engagement/[id]',
      params: { id: 'app-1', title: 'Bkash Branding Campaign' },
    });

    fireEvent.press(screen.getByTestId('applications-tab-request'));
    fireEvent.press(await screen.findByTestId('campaign-request-inv-1'));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/engagement/[id]',
      params: { id: 'inv-1', title: 'Pathao Summer Push' },
    });
  });

  test('a countered invitation shows no quick Accept/Decline', async () => {
    mockLists({
      applied: [],
      invited: [invitation, { ...invitation, id: 'inv-2', status: 'countered' }],
    });
    renderScreen();
    fireEvent.press(screen.getByTestId('applications-tab-request'));

    expect(await screen.findByTestId('campaign-request-inv-2')).toBeTruthy();
    expect(screen.getByTestId('campaign-request-inv-1-accept')).toBeTruthy();
    expect(screen.queryByTestId('campaign-request-inv-2-accept')).toBeNull();
    expect(screen.queryByTestId('campaign-request-inv-2-decline')).toBeNull();
  });

  test('shows an empty state when there are no applications', async () => {
    mockLists({ applied: [], invited: [] });
    renderScreen();

    expect(await screen.findByText("You haven't applied to any campaigns")).toBeTruthy();
  });

  test('shows an empty state on the Request tab when there are no invitations', async () => {
    mockLists({ applied: [application], invited: [] });
    renderScreen();
    await screen.findByText('Bkash Branding Campaign');

    fireEvent.press(screen.getByTestId('applications-tab-request'));

    expect(await screen.findByText('No campaign requests')).toBeTruthy();
  });

  test('declining an invitation calls CF5 and removes the row', async () => {
    mockLists({ applied: [], invited: [invitation] });
    renderScreen();
    fireEvent.press(screen.getByTestId('applications-tab-request'));
    expect(await screen.findByText("You're invited to join Pathao Summer Push")).toBeTruthy();

    answerWith(({ method }) => (method === 'POST' ? { id: 'inv-1', status: 'declined' } : []));
    await act(async () => {
      fireEvent.press(screen.getByTestId('campaign-request-inv-1-decline'));
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/me/engagements/inv-1/decline',
        method: 'POST',
        data: { reason: '' },
      }),
    );
    expect(await screen.findByText('No campaign requests')).toBeTruthy();
  });

  test('shows a retryable error state when the list fails to load', async () => {
    mockLists({ applied: new Error('offline'), invited: [] });
    renderScreen();

    expect(await screen.findByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });
});
