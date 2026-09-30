import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { ApiError, request } from '@/services/http';
import { campaignFeedApi } from './api/campaignFeedApi';
import { DeliverablePiece, DeliverableSubmission } from './types/deliverables';
import DeliverablePieceScreen from './DeliverablePieceScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'eng-1', pieceId: 'piece-1' }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
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
      this.code = body.code ?? 'UNKNOWN';
      this.statusCode = body.statusCode;
      this.errors = body.errors ?? null;
    }
  }
  return { __esModule: true, request: jest.fn(), ApiError };
});

const mockRequest = request as jest.MockedFunction<typeof request>;
const mockPicker = ImagePicker as jest.Mocked<typeof ImagePicker>;
type RequestConfig = { url: string; method?: string; data?: unknown; headers?: unknown };

function answerWith(handler: (cfg: RequestConfig) => unknown) {
  mockRequest.mockImplementation((async (cfg: unknown) =>
    handler(cfg as RequestConfig)) as typeof request);
}

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

// GET returns the given piece; POSTs go to `onPost`.
function answers(current: DeliverablePiece, onPost: (cfg: RequestConfig) => unknown = () => ({})) {
  answerWith(cfg => (cfg.method === 'POST' ? onPost(cfg) : [current]));
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
});

describe('<DeliverablePieceScreen />', () => {
  test('submits a link as JSON with its caption', async () => {
    answers(piece({}), () => submission({}));
    renderScreen();

    fireEvent.changeText(await screen.findByTestId('piece-url'), 'https://instagram.com/p/1');
    fireEvent.changeText(screen.getByTestId('piece-caption'), 'First cut');
    await act(async () => {
      fireEvent.press(screen.getByTestId('piece-submit'));
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/engagements/eng-1/deliverables/piece-1/submissions',
        method: 'POST',
        data: { externalUrl: 'https://instagram.com/p/1', caption: 'First cut' },
      }),
    );
    expect(await screen.findByText('Submitted for review.')).toBeTruthy();
  });

  test('uploads a picked image as multipart', async () => {
    mockPicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mockPicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg', mimeType: 'image/jpeg', fileName: 'photo.jpg' }],
    } as never);
    answers(piece({}), () => submission({ externalUrl: null, mediaId: 'media-1' }));
    renderScreen();

    fireEvent.press(await screen.findByTestId('piece-kind-image'));
    await act(async () => {
      fireEvent.press(screen.getByTestId('piece-pick-image'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('piece-submit'));
    });

    const post = mockRequest.mock.calls
      .map(([cfg]) => cfg as RequestConfig)
      .find(cfg => cfg.method === 'POST');
    expect(post?.url).toBe('/engagements/eng-1/deliverables/piece-1/submissions');
    expect(post?.data).toBeInstanceOf(FormData);
    expect(post?.headers).toEqual({ 'Content-Type': 'multipart/form-data' });
  });

  test('blocks a bad link or a missing image without calling the API', async () => {
    answers(piece({}));
    renderScreen();

    fireEvent.changeText(await screen.findByTestId('piece-url'), 'instagram.com/p/1');
    await act(async () => {
      fireEvent.press(screen.getByTestId('piece-submit'));
    });
    expect(screen.getByText('Enter a full link starting with https://')).toBeTruthy();

    fireEvent.press(screen.getByTestId('piece-kind-image'));
    await act(async () => {
      fireEvent.press(screen.getByTestId('piece-submit'));
    });
    expect(screen.getByText('Choose an image to upload.')).toBeTruthy();
    expect(mockRequest.mock.calls.every(([cfg]) => (cfg as RequestConfig).method !== 'POST')).toBe(
      true,
    );
  });

  test("shows the business's change request and offers Resubmit", async () => {
    answers(
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
    );
    renderScreen();

    expect(await screen.findByTestId('piece-change-request')).toBeTruthy();
    expect(screen.getAllByText(/Add the promo code at the end\./).length).toBeGreaterThan(0);
    expect(screen.getByText('Resubmit')).toBeTruthy();
  });

  test('shows the server message after a 409', async () => {
    answers(piece({}), () => {
      throw new ApiError({
        code: 'DELIVERABLE_NOT_SUBMITTABLE',
        statusCode: 409,
        message: 'This deliverable cannot accept a submission while it is approved.',
      } as never);
    });
    renderScreen();

    fireEvent.changeText(await screen.findByTestId('piece-url'), 'https://instagram.com/p/1');
    await act(async () => {
      fireEvent.press(screen.getByTestId('piece-submit'));
    });

    expect(
      await screen.findByText('This deliverable cannot accept a submission while it is approved.'),
    ).toBeTruthy();
  });

  test('an escalated piece shows the dispute notice and no form', async () => {
    answers(piece({ status: 'escalated', revisionsRemaining: 0 }));
    renderScreen();

    expect(await screen.findByTestId('piece-escalated')).toBeTruthy();
    expect(screen.queryByTestId('piece-submit-form')).toBeNull();
  });

  test('an approved piece saves the live post link, and validates it', async () => {
    answers(
      piece({
        status: 'approved',
        approvedAt: '2026-09-29T09:00:00.000Z',
        submissions: [submission({ status: 'approved', reviewDecision: 'approved' })],
      }),
      () => submission({ livePostUrl: 'https://instagram.com/p/live' }),
    );
    renderScreen();

    expect(await screen.findByTestId('piece-approved')).toBeTruthy();
    expect(screen.queryByTestId('piece-submit-form')).toBeNull();

    fireEvent.changeText(screen.getByTestId('piece-live-post-url'), 'not a link');
    await act(async () => {
      fireEvent.press(screen.getByTestId('piece-live-post-save'));
    });
    expect(screen.getByText('Enter a full link starting with https://')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('piece-live-post-url'), 'https://instagram.com/p/live');
    await act(async () => {
      fireEvent.press(screen.getByTestId('piece-live-post-save'));
    });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/engagements/eng-1/deliverables/piece-1/posted',
        method: 'POST',
        data: { livePostUrl: 'https://instagram.com/p/live' },
      }),
    );
    expect(await screen.findByText('Live post saved.')).toBeTruthy();
  });
});
