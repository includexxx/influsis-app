import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ApiError, request } from '@/services/http';
import { campaignFeedApi } from './api/campaignFeedApi';
import { DeliveryPiece, DeliveryRound, EngagementDelivery } from './types/delivery';
import DeliverablesScreen from './DeliverablesScreen';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'eng-1', title: 'Pathao Summer Push' }),
  Redirect: ({ href }: { href: string }) => {
    const { Text: RNText } = jest.requireActual<typeof import('react-native')>('react-native');
    return <RNText>{`redirect:${href}`}</RNText>;
  },
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

function piece(overrides: Partial<DeliveryPiece>): DeliveryPiece {
  return {
    id: 'piece-1',
    scopeItemId: 'scope-1',
    platform: 'instagram',
    type: 'reels',
    title: null,
    pieceNo: 1,
    dueDate: '2099-10-10',
    status: 'pending',
    finalKind: 'file_link',
    ...overrides,
  };
}

function round(overrides: Partial<DeliveryRound> = {}): DeliveryRound {
  return {
    id: 'round-1',
    phase: 'draft',
    roundNo: 1,
    status: 'submitted',
    converted: false,
    submittedAt: '2026-10-08T10:00:00.000Z',
    isLate: false,
    reviewDueAt: '2026-10-15T10:00:00.000Z',
    reviewDecision: null,
    reviewReason: null,
    reviewedAt: null,
    reviewedByUserId: null,
    autoApproved: false,
    items: [],
    ...overrides,
  };
}

function delivery(overrides: Partial<EngagementDelivery> = {}): EngagementDelivery {
  return {
    stage: 'awaiting_draft',
    objective: 'ugc_content',
    revisionsRemaining: 2,
    draftChangeRequests: 0,
    escalatedAt: null,
    escalationReason: null,
    pieces: [piece({ id: 'p1' })],
    rounds: [],
    ...overrides,
  };
}

const engagement = {
  id: 'eng-1',
  campaignId: 'campaign-1',
  status: 'accepted',
  offers: [],
  scope: [{ id: 'scope-1', platform: 'instagram', type: 'reels', count: 2 }],
  agreedAmountMinor: 2_000_000,
  licensingMarkupMinor: 500_000,
  acceptedAt: '2026-09-30T10:00:00',
  currency: 'BDT',
};

function answers(read: EngagementDelivery | Error) {
  answerWith(({ url }) => {
    if (url === '/me/engagements/eng-1') return engagement;
    // CB2 404s once the campaign isn't live.
    if (url === '/feed/campaigns/campaign-1') throw new Error('not found');
    if (url === '/engagements/eng-1/delivery') {
      if (read instanceof Error) throw read;
      return read;
    }
    throw new Error(`unexpected ${url}`);
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
  test('reads the delivery and lists the pieces with status and due date', async () => {
    answers(
      delivery({
        pieces: [
          piece({ id: 'p1' }),
          piece({ id: 'p2', pieceNo: 2, status: 'changes_requested' }),
          piece({ id: 'p3', platform: 'tiktok', type: 'video', status: 'approved' }),
        ],
      }),
    );
    renderScreen();

    expect(await screen.findByText('Instagram Reels · 1')).toBeTruthy();
    expect(screen.getByText('Pathao Summer Push')).toBeTruthy();
    expect(screen.getByText('Changes requested')).toBeTruthy();
    expect(screen.getByText('Approved')).toBeTruthy();
    expect(screen.queryByText(/revisions? left/)).toBeNull();
    expect(screen.getByTestId('deliverables-progress').props.children).toEqual([
      1,
      ' of ',
      3,
      ' approved',
    ]);
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/engagements/eng-1/delivery', method: 'GET' }),
    );
    // The per-piece CI1 list is no longer read here.
    expect(
      mockRequest.mock.calls.some(
        ([cfg]) => (cfg as RequestConfig).url === '/engagements/eng-1/deliverables',
      ),
    ).toBe(false);
  });

  test('awaiting a draft offers Submit delivery', async () => {
    answers(delivery());
    renderScreen();

    expect(await screen.findByText('Deliver every piece together as one draft.')).toBeTruthy();
    fireEvent.press(screen.getByTestId('deliverables-submit'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/engagement/[id]/submit-delivery',
      params: { id: 'eng-1', title: 'Pathao Summer Push' },
    });
  });

  test('a draft in review shows when it was submitted and no action', async () => {
    answers(delivery({ stage: 'draft_in_review', rounds: [round()] }));
    renderScreen();

    expect(await screen.findByText('Draft submitted')).toBeTruthy();
    expect(screen.getByText("Waiting for the business's review.")).toBeTruthy();
    expect(screen.getByText('Submitted 08 Oct, 2026')).toBeTruthy();
    expect(screen.queryByTestId('deliverables-submit')).toBeNull();
  });

  test('changes requested shows the reason, revisions left and a resubmit', async () => {
    answers(
      delivery({
        stage: 'draft_changes_requested',
        revisionsRemaining: 1,
        draftChangeRequests: 1,
        rounds: [
          round({
            status: 'changes_requested',
            reviewDecision: 'changes_requested',
            reviewReason: 'Logo must show in the first 3 seconds',
          }),
        ],
      }),
    );
    renderScreen();

    expect(await screen.findByText('The business asked for changes')).toBeTruthy();
    expect(screen.getByText('Logo must show in the first 3 seconds')).toBeTruthy();
    expect(screen.getByText('1 revision left')).toBeTruthy();
    expect(screen.getByText('Submit revised draft')).toBeTruthy();
  });

  test('awaiting the final offers Send final delivery', async () => {
    answers(delivery({ stage: 'awaiting_final' }));
    renderScreen();

    expect(await screen.findByText('Now send the final delivery for every piece.')).toBeTruthy();
    expect(screen.getByText('Final due')).toBeTruthy();
    fireEvent.press(screen.getByText('Send final delivery'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/engagement/[id]/submit-delivery',
      params: { id: 'eng-1', title: 'Pathao Summer Push' },
    });
    expect(screen.queryByText(/coming soon/i)).toBeNull();
  });

  test('a final in review shows when it was submitted and no action', async () => {
    answers(
      delivery({
        stage: 'final_in_review',
        rounds: [
          round({ status: 'approved' }),
          round({
            id: 'round-2',
            phase: 'final',
            submittedAt: '2026-10-12T10:00:00.000Z',
            reviewDueAt: '2026-10-15T10:00:00.000Z',
          }),
        ],
      }),
    );
    renderScreen();

    expect(await screen.findByText('Final delivery submitted')).toBeTruthy();
    expect(screen.getByText('Submitted 12 Oct, 2026')).toBeTruthy();
    expect(
      screen.getByText(
        "Waiting for the business to approve it. If it doesn't, it's approved automatically on 15 Oct, 2026.",
      ),
    ).toBeTruthy();
    expect(screen.queryByTestId('deliverables-submit')).toBeNull();
  });

  test('delivered says the campaign is complete, never paid', async () => {
    answers(delivery({ stage: 'delivered', pieces: [piece({ status: 'approved' })] }));
    renderScreen();

    expect(await screen.findByText('This campaign is complete.')).toBeTruthy();
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
    expect(screen.queryByText(/paid|payment/i)).toBeNull();
    expect(screen.queryByTestId('deliverables-submit')).toBeNull();
  });

  test.each([
    [
      { draftChangeRequests: 3 },
      "The business requested changes to the draft 3 times. Disputes aren't available yet.",
    ],
    [
      { draftChangeRequests: 0 },
      "This delivery was escalated to a dispute. Disputes aren't available yet.",
    ],
  ])('escalated shows "In dispute" with no actions (%o)', async (counts, copy) => {
    answers(
      delivery({
        stage: 'escalated',
        escalatedAt: '2026-10-09T10:00:00.000Z',
        escalationReason: 'auto-escalated after 3 draft change requests',
        ...counts,
      }),
    );
    renderScreen();

    expect(await screen.findByText(copy)).toBeTruthy();
    expect(screen.getAllByText('In dispute').length).toBeGreaterThan(0);
    expect(screen.queryByText(/auto-escalated/)).toBeNull();
    expect(screen.queryByTestId('deliverables-submit')).toBeNull();
  });

  test('names a custom piece by its title (18q)', async () => {
    answers(
      delivery({
        pieces: [
          piece({ id: 'p1' }),
          piece({ id: 'p2', platform: 'custom', type: 'custom', title: 'Unboxing clip' }),
        ],
      }),
    );
    renderScreen();

    expect(await screen.findByText('Unboxing clip · 1')).toBeTruthy();
    expect(screen.getByLabelText('Unboxing clip · 1, To deliver')).toBeTruthy();
  });

  test('flags an overdue piece', async () => {
    answers(delivery({ pieces: [piece({ dueDate: '2000-01-01' })] }));
    renderScreen();

    expect(await screen.findByText(' · Overdue')).toBeTruthy();
  });

  test('opens a piece on tap', async () => {
    answers(delivery({ pieces: [piece({ id: 'p1' })] }));
    renderScreen();

    fireEvent.press(await screen.findByTestId('deliverable-p1'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/engagement/[id]/deliverables/[pieceId]',
      params: { id: 'eng-1', pieceId: 'p1', title: 'Pathao Summer Push' },
    });
  });

  test('View agreement shows the confirmed terms, falling back without the campaign', async () => {
    answers(delivery());
    renderScreen();

    fireEvent.press(await screen.findByTestId('deliverables-view-agreement'));

    expect(await screen.findByText('Agreement confirmed · 30 Sep, 2026')).toBeTruthy();
    expect(screen.getByText('2 × Instagram Reels')).toBeTruthy();
    expect(screen.getByLabelText("You'll receive 25,000 taka")).toBeTruthy();
    expect(screen.queryByTestId('agreement-accept')).toBeNull();

    fireEvent.press(screen.getByTestId('agreement-close'));
    expect(screen.queryByTestId('agreement-sheet')).toBeNull();
  });

  test("shows the campaign's content deadline under the title", async () => {
    answerWith(({ url }) => {
      if (url === '/me/engagements/eng-1') return engagement;
      if (url === '/feed/campaigns/campaign-1') {
        return { id: 'campaign-1', title: 'Pathao Summer Push', contentDeadline: '2026-10-10' };
      }
      return delivery();
    });
    renderScreen();

    expect(await screen.findByText('Content deadline · 10 Oct, 2026')).toBeTruthy();
  });

  test('leaves the deadline out when the campaign is no longer live', async () => {
    answers(delivery());
    renderScreen();

    expect(await screen.findByText('Instagram Reels · 1')).toBeTruthy();
    expect(screen.queryByTestId('deliverables-deadline')).toBeNull();
  });

  test('shows the empty state before any piece exists', async () => {
    answers(delivery({ stage: null, pieces: [] }));
    renderScreen();

    expect(
      await screen.findByText('No deliverables yet. They appear once the offer is accepted.'),
    ).toBeTruthy();
    expect(screen.queryByTestId('deliverables-status')).toBeNull();
  });

  test('shows the loading skeleton first', () => {
    answers(delivery());
    renderScreen();

    expect(screen.getByTestId('deliverables-loading')).toBeTruthy();
  });

  test('shows a retryable error when the delivery fails to load', async () => {
    answers(new Error('offline'));
    renderScreen();

    expect(await screen.findByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });

  test('redirects to Live Campaigns when the engagement is not found', async () => {
    answers(new ApiError({ code: 'NOT_FOUND', statusCode: 404 } as never));
    renderScreen();

    expect(await screen.findByText('redirect:/live-campaign')).toBeTruthy();
  });
});
