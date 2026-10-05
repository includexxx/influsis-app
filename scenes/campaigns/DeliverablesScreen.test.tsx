import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { request } from '@/services/http';
import { campaignFeedApi } from './api/campaignFeedApi';
import { DeliverablePiece } from './types/deliverables';
import DeliverablesScreen from './DeliverablesScreen';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'eng-1', title: 'Pathao Summer Push' }),
  Redirect: () => null,
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
    errors: Record<string, string> | null = null;
    constructor(body: { code?: string; statusCode: number; message?: string }) {
      super(body.message ?? 'api error');
      this.code = body.code ?? 'UNKNOWN';
      this.statusCode = body.statusCode;
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

function piece(overrides: Partial<DeliverablePiece>): DeliverablePiece {
  return {
    id: 'piece-1',
    scopeItemId: 'scope-1',
    deliverableId: null,
    platform: 'instagram',
    type: 'reels',
    pieceNo: 1,
    status: 'pending',
    dueDate: '2099-10-10',
    revisionCount: 0,
    rejectionCount: 0,
    revisionsRemaining: 3,
    escalatedAt: null,
    escalationReason: null,
    lastSubmittedAt: null,
    approvedAt: null,
    approvedByUserId: null,
    submissions: [],
    ...overrides,
  };
}

function answers(pieces: DeliverablePiece[] | Error, status = 'accepted') {
  answerWith(({ url }) => {
    if (url === '/me/engagements/eng-1') {
      return {
        id: 'eng-1',
        campaignId: 'campaign-1',
        status,
        offers: [],
        scope: [{ id: 'scope-1', platform: 'instagram', type: 'reels', count: 2 }],
        agreedAmountMinor: 2_000_000,
        licensingMarkupMinor: 500_000,
        acceptedAt: '2026-09-30T10:00:00',
        currency: 'BDT',
      };
    }
    // CB2 404s once the campaign isn't live.
    if (url === '/feed/campaigns/campaign-1') throw new Error('not found');
    if (pieces instanceof Error) throw pieces;
    return pieces;
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
  return render(<DeliverablesScreen />, { wrapper });
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

describe('<DeliverablesScreen />', () => {
  test('lists the pieces with status, due date and revisions left', async () => {
    answers([
      piece({ id: 'p1' }),
      piece({ id: 'p2', pieceNo: 2, status: 'changes_requested', revisionsRemaining: 2 }),
      piece({ id: 'p3', platform: 'tiktok', type: 'video', status: 'approved' }),
    ]);
    renderScreen();

    expect(await screen.findByText('Instagram Reels · 1')).toBeTruthy();
    expect(screen.getByText('Pathao Summer Push')).toBeTruthy();
    expect(screen.getByText('To deliver')).toBeTruthy();
    expect(screen.getByText('Changes requested')).toBeTruthy();
    expect(screen.getByText('Approved')).toBeTruthy();
    expect(screen.getByText('2 revisions left')).toBeTruthy();
    expect(screen.getByTestId('deliverables-progress').props.children).toEqual([
      1,
      ' of ',
      3,
      ' approved',
    ]);
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/engagements/eng-1/deliverables', method: 'GET' }),
    );
  });

  test('flags an overdue piece', async () => {
    answers([piece({ dueDate: '2000-01-01' })]);
    renderScreen();

    expect(await screen.findByText(' · Overdue')).toBeTruthy();
  });

  test('opens a piece on tap', async () => {
    answers([piece({ id: 'p1' })]);
    renderScreen();

    fireEvent.press(await screen.findByTestId('deliverable-p1'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/engagement/[id]/deliverables/[pieceId]',
      params: { id: 'eng-1', pieceId: 'p1', title: 'Pathao Summer Push' },
    });
  });

  test('shows the completed banner once the business approved everything', async () => {
    answers([piece({ status: 'approved' })], 'completed');
    renderScreen();

    expect(await screen.findByTestId('deliverables-completed')).toBeTruthy();
    expect(screen.queryByText(/paid/i)).toBeNull();
  });

  test('View agreement shows the confirmed terms, falling back without the campaign', async () => {
    answers([piece({ id: 'p1' })]);
    renderScreen();

    fireEvent.press(await screen.findByTestId('deliverables-view-agreement'));

    expect(await screen.findByText('Agreement confirmed · 30 Sep 2026')).toBeTruthy();
    expect(screen.getByText('2 × Instagram Reels')).toBeTruthy();
    expect(screen.getByText('No deadline set')).toBeTruthy();
    expect(screen.getByLabelText("You'll receive 25,000 taka")).toBeTruthy();
    expect(screen.queryByTestId('agreement-business')).toBeNull();
    expect(screen.queryByTestId('agreement-accept')).toBeNull();

    fireEvent.press(screen.getByTestId('agreement-close'));
    expect(screen.queryByTestId('agreement-sheet')).toBeNull();
  });

  test("shows the campaign's content deadline under the title", async () => {
    answerWith(({ url }) => {
      if (url === '/me/engagements/eng-1') {
        return { id: 'eng-1', campaignId: 'campaign-1', status: 'accepted', offers: [], scope: [] };
      }
      if (url === '/feed/campaigns/campaign-1') {
        return { id: 'campaign-1', title: 'Pathao Summer Push', contentDeadline: '2026-10-10' };
      }
      return [piece({ id: 'p1' })];
    });
    renderScreen();

    expect(await screen.findByText('Content deadline · 10 Oct 2026')).toBeTruthy();
  });

  test('leaves the deadline out when the campaign is no longer live', async () => {
    answers([piece({ id: 'p1' })]);
    renderScreen();

    expect(await screen.findByText('Instagram Reels · 1')).toBeTruthy();
    expect(screen.queryByTestId('deliverables-deadline')).toBeNull();
  });

  test('shows the empty state', async () => {
    answers([]);
    renderScreen();

    expect(
      await screen.findByText('No deliverables yet. They appear once the offer is accepted.'),
    ).toBeTruthy();
  });

  test('shows a retryable error when the list fails to load', async () => {
    answers(new Error('offline'));
    renderScreen();

    expect(await screen.findByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });
});
