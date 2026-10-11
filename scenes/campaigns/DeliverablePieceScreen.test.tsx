import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { Linking } from 'react-native';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { request } from '@/services/http';
import { campaignFeedApi } from './api/campaignFeedApi';
import { DeliverablePiece, DeliverableSubmission } from './types/deliverables';
import DeliverablePieceScreen from './DeliverablePieceScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'eng-1', pieceId: 'piece-1' }),
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
type RequestConfig = { url: string; method?: string };

function submission(overrides: Partial<DeliverableSubmission>): DeliverableSubmission {
  return {
    id: 'sub-1',
    revisionNo: 1,
    submittedByUserId: 'creator-1',
    submittedAt: '2026-09-28T10:00:00.000Z',
    isLate: false,
    mediaId: null,
    externalUrl: 'https://instagram.com/p/rev-1',
    caption: null,
    livePostUrl: null,
    postedAt: null,
    status: 'submitted',
    reviewDecision: null,
    reviewReason: null,
    reviewedAt: null,
    reviewedByUserId: null,
    reviewDueAt: '2026-10-05T10:00:00.000Z',
    ...overrides,
  };
}

function piece(overrides: Partial<DeliverablePiece>): DeliverablePiece {
  return {
    id: 'piece-1',
    scopeItemId: 'scope-1',
    deliverableId: null,
    platform: 'instagram',
    type: 'reels',
    title: null,
    pieceNo: 1,
    status: 'pending',
    dueDate: '2099-10-10',
    lastSubmittedAt: null,
    approvedAt: null,
    approvedByUserId: null,
    submissions: [],
    ...overrides,
  };
}

function answers(pieces: DeliverablePiece[] | Error) {
  mockRequest.mockImplementation((async () => {
    if (pieces instanceof Error) throw pieces;
    return pieces;
  }) as typeof request);
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
  return render(<DeliverablePieceScreen />, { wrapper });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
});

afterEach(() => {
  store?.dispatch(campaignFeedApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('<DeliverablePieceScreen />', () => {
  test('is read-only: status, due date, history and a pointer to the Deliverables screen', async () => {
    answers([
      piece({
        status: 'submitted',
        submissions: [submission({ caption: 'First cut' })],
      }),
    ]);
    renderScreen();

    expect(await screen.findByText('Instagram Reels · 1')).toBeTruthy();
    expect(screen.getByTestId('piece-status')).toBeTruthy();
    expect(screen.getByText('Due 10 Oct, 2099')).toBeTruthy();
    expect(screen.getByText('Revision 1')).toBeTruthy();
    expect(screen.getByText('First cut')).toBeTruthy();
    expect(
      screen.getByText('Submit or update this piece from the Deliverables screen.'),
    ).toBeTruthy();
    // No CI2 submit or CI4 live-post controls, and nothing is sent.
    expect(screen.queryByTestId('piece-submit-form')).toBeNull();
    expect(screen.queryByTestId('piece-live-post')).toBeNull();
    expect(screen.queryByText(/revisions? left/)).toBeNull();
    expect(mockRequest.mock.calls.every(([cfg]) => (cfg as RequestConfig).method === 'GET')).toBe(
      true,
    );
  });

  test('names a custom piece by its title (18q)', async () => {
    answers([piece({ platform: 'custom', type: 'custom', title: 'Unboxing clip' })]);
    renderScreen();

    expect(await screen.findByText('Unboxing clip · 1')).toBeTruthy();
  });

  test("shows the business's latest change request", async () => {
    answers([
      piece({
        status: 'changes_requested',
        submissions: [
          submission({
            status: 'changes_requested',
            reviewDecision: 'changes_requested',
            reviewReason: 'Add the promo code at the end.',
          }),
        ],
      }),
    ]);
    renderScreen();

    expect(await screen.findByTestId('piece-change-request')).toBeTruthy();
    expect(screen.getAllByText(/Add the promo code at the end\./).length).toBeGreaterThan(0);
  });

  test('an approved piece says so, with no live-post form and no submit pointer', async () => {
    answers([
      piece({
        status: 'approved',
        approvedAt: '2026-09-29T09:00:00.000Z',
        submissions: [submission({ status: 'approved', reviewDecision: 'approved' })],
      }),
    ]);
    renderScreen();

    expect(await screen.findByTestId('piece-approved')).toBeTruthy();
    expect(screen.queryByTestId('piece-live-post')).toBeNull();
    expect(screen.queryByTestId('piece-submit-hint')).toBeNull();
  });

  test('flags an overdue piece', async () => {
    answers([piece({ dueDate: '2000-01-01' })]);
    renderScreen();

    expect(await screen.findByTestId('piece-overdue')).toBeTruthy();
  });

  test('opens an http(s) submission link and labels an upload', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    answers([
      piece({
        status: 'changes_requested',
        submissions: [
          submission({ id: 'sub-1', revisionNo: 1, externalUrl: null, mediaId: 'media-1' }),
          submission({ id: 'sub-2', revisionNo: 2 }),
        ],
      }),
    ]);
    renderScreen();

    expect(await screen.findByText('Uploaded image')).toBeTruthy();
    fireEvent.press(screen.getByTestId('submission-2-link'));
    expect(openURL).toHaveBeenCalledWith('https://instagram.com/p/rev-1');
  });

  test('says when the piece is not part of the engagement', async () => {
    answers([piece({ id: 'other' })]);
    renderScreen();

    expect(await screen.findByTestId('piece-not-found')).toBeTruthy();
  });

  test('shows a retryable error when the pieces fail to load', async () => {
    answers(new Error('offline'));
    renderScreen();

    expect(await screen.findByText('Something went wrong')).toBeTruthy();
  });
});
