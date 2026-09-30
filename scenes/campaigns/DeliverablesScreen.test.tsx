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
      return { id: 'eng-1', campaignId: 'campaign-1', status, offers: [], scope: [] };
    }
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
