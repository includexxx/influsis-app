import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { ApiError, request } from '@/services/http';
import { uploadMediaImage } from '@/services/mediaUpload';
import { campaignFeedApi } from './api/campaignFeedApi';
import { DeliveryPiece, DeliveryRound, EngagementDelivery } from './types/delivery';
import SubmitDeliveryScreen from './SubmitDeliveryScreen';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: () => mockBack() },
  useLocalSearchParams: () => ({ id: 'eng-1', title: 'Pathao Summer Push' }),
  Redirect: ({ href }: { href: string }) => {
    const { Text: RNText } = jest.requireActual<typeof import('react-native')>('react-native');
    return <RNText>{`redirect:${href}`}</RNText>;
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@/services/mediaUpload', () => ({ uploadMediaImage: jest.fn() }));

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
const mockUpload = uploadMediaImage as jest.MockedFunction<typeof uploadMediaImage>;
const mockPicker = ImagePicker as jest.Mocked<typeof ImagePicker>;
type RequestConfig = { url: string; method?: string; data?: unknown };

function piece(overrides: Partial<DeliveryPiece>): DeliveryPiece {
  return {
    id: 'p1',
    scopeItemId: 'scope-1',
    platform: 'instagram',
    type: 'reels',
    title: null,
    pieceNo: 1,
    dueDate: '2026-10-20',
    status: 'pending',
    finalKind: 'file_link',
    ...overrides,
  };
}

const twoPieces = [
  piece({ id: 'p1' }),
  piece({ id: 'p2', platform: 'tiktok', type: 'video' }),
  piece({ id: 'p3', status: 'cancelled' }),
];

function changesRequested(): DeliveryRound {
  return {
    id: 'round-1',
    phase: 'draft',
    roundNo: 1,
    status: 'changes_requested',
    converted: false,
    submittedAt: '2026-10-08T10:00:00.000Z',
    isLate: false,
    reviewDueAt: '2026-10-15T10:00:00.000Z',
    reviewDecision: 'changes_requested',
    reviewReason: 'Logo must show in the first 3 seconds',
    reviewedAt: '2026-10-09T10:00:00.000Z',
    reviewedByUserId: 'biz-user',
    autoApproved: false,
    items: [
      {
        id: 'item-1',
        pieceId: 'p1',
        revisionNo: 1,
        mediaId: null,
        externalUrl: 'https://drive.test/v1',
        livePostUrl: null,
        caption: 'First cut',
        reviewComment: 'Re-shoot in daylight',
        status: 'changes_requested',
        reusedFromSubmissionId: null,
      },
      {
        id: 'item-2',
        pieceId: 'p2',
        revisionNo: 1,
        mediaId: 'media-old',
        externalUrl: null,
        livePostUrl: null,
        caption: null,
        reviewComment: null,
        status: 'changes_requested',
        reusedFromSubmissionId: null,
      },
    ],
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
    pieces: twoPieces,
    rounds: [],
    ...overrides,
  };
}

function answers(read: EngagementDelivery, onPost?: (cfg: RequestConfig) => unknown) {
  mockRequest.mockImplementation((async (raw: unknown) => {
    const cfg = raw as RequestConfig;
    if (cfg.url === '/engagements/eng-1/delivery') return read;
    if (cfg.url === '/engagements/eng-1/delivery/rounds' && cfg.method === 'POST') {
      return onPost ? onPost(cfg) : { id: 'round-2', phase: 'draft', items: [] };
    }
    throw new Error(`unexpected ${cfg.method} ${cfg.url}`);
  }) as typeof request);
}

function posted(): RequestConfig | undefined {
  return mockRequest.mock.calls
    .map(([cfg]) => cfg as RequestConfig)
    .find(cfg => cfg.method === 'POST');
}

function deliveryReads(): number {
  return mockRequest.mock.calls.filter(
    ([cfg]) => (cfg as RequestConfig).url === '/engagements/eng-1/delivery',
  ).length;
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
  return render(<SubmitDeliveryScreen />, { wrapper });
}

function submitButton() {
  return screen.getByTestId('submit-delivery-submit');
}

async function pressSubmit() {
  await act(async () => {
    fireEvent.press(submitButton());
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
  mockUpload.mockReset();
  mockBack.mockReset();
  mockPicker.requestMediaLibraryPermissionsAsync.mockReset();
  mockPicker.launchImageLibraryAsync.mockReset();
});

afterEach(() => {
  store?.dispatch(campaignFeedApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<SubmitDeliveryScreen />', () => {
  test('a slot per non-cancelled piece; Submit stays disabled until every slot is filled', async () => {
    answers(delivery());
    renderScreen();

    expect(await screen.findByText('Instagram Reels · 1')).toBeTruthy();
    expect(screen.getByText('TikTok Video · 1')).toBeTruthy();
    expect(screen.queryByTestId('delivery-slot-2')).toBeNull();
    // No earlier round, so there's nothing to keep.
    expect(screen.queryByTestId('delivery-slot-0-keep')).toBeNull();
    expect(submitButton().props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId('delivery-slot-0-url'), 'https://drive.test/a');
    expect(submitButton().props.accessibilityState?.disabled).toBe(true);
    fireEvent.changeText(screen.getByTestId('delivery-slot-1-url'), 'drive.test/b');
    expect(screen.getByText('Enter a full link starting with https://')).toBeTruthy();
    expect(submitButton().props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId('delivery-slot-1-url'), 'https://drive.test/b');
    expect(submitButton().props.accessibilityState?.disabled).toBe(false);
  });

  test('sends a link round and goes back', async () => {
    answers(delivery());
    renderScreen();

    fireEvent.changeText(
      await screen.findByTestId('delivery-slot-0-url'),
      ' https://drive.test/a ',
    );
    fireEvent.changeText(screen.getByTestId('delivery-slot-0-caption'), '  Cut one ');
    fireEvent.changeText(screen.getByTestId('delivery-slot-1-url'), 'https://drive.test/b');
    await pressSubmit();

    expect(posted()?.data).toEqual({
      items: [
        { pieceId: 'p1', externalUrl: 'https://drive.test/a', caption: 'Cut one' },
        { pieceId: 'p2', externalUrl: 'https://drive.test/b' },
      ],
    });
    expect(mockBack).toHaveBeenCalled();
  });

  test('uploads a picked image first and sends its media id', async () => {
    mockPicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mockPicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg', mimeType: 'image/jpeg', fileName: 'photo.jpg' }],
    } as never);
    mockUpload.mockResolvedValue('media-9');
    answers(delivery());
    renderScreen();

    fireEvent.press(await screen.findByTestId('delivery-slot-0-image'));
    await act(async () => {
      fireEvent.press(screen.getByTestId('delivery-slot-0-pick'));
    });
    fireEvent.changeText(screen.getByTestId('delivery-slot-1-url'), 'https://drive.test/b');
    await pressSubmit();

    expect(mockUpload).toHaveBeenCalledWith({
      uri: 'file:///photo.jpg',
      mimeType: 'image/jpeg',
      fileName: 'photo.jpg',
    });
    expect(posted()?.data).toEqual({
      items: [
        { pieceId: 'p1', mediaId: 'media-9' },
        { pieceId: 'p2', externalUrl: 'https://drive.test/b' },
      ],
    });
  });

  test('says so when photo access is denied', async () => {
    mockPicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false } as never);
    answers(delivery());
    renderScreen();

    fireEvent.press(await screen.findByTestId('delivery-slot-0-image'));
    await act(async () => {
      fireEvent.press(screen.getByTestId('delivery-slot-0-pick'));
    });

    expect(screen.getByText('Allow photo access in Settings to upload an image.')).toBeTruthy();
    expect(mockPicker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  test('after changes are requested: shows the reason and comments, keeps pieces by default', async () => {
    answers(
      delivery({
        stage: 'draft_changes_requested',
        revisionsRemaining: 1,
        draftChangeRequests: 1,
        pieces: twoPieces.slice(0, 2),
        rounds: [changesRequested()],
      }),
    );
    renderScreen();

    expect(await screen.findByText('Logo must show in the first 3 seconds')).toBeTruthy();
    expect(screen.getByText('1 revision left')).toBeTruthy();
    expect(
      within(screen.getByTestId('delivery-slot-0-comment')).getByText('Re-shoot in daylight'),
    ).toBeTruthy();
    expect(screen.queryByTestId('delivery-slot-1-comment')).toBeNull();
    expect(screen.getByTestId('delivery-slot-0-keep').props.accessibilityState?.checked).toBe(true);
    expect(screen.getByText('https://drive.test/v1')).toBeTruthy();
    expect(screen.getByText('Uploaded image')).toBeTruthy();
    expect(submitButton().props.accessibilityState?.disabled).toBe(false);

    // Replace piece 1 with a new link; keep piece 2 with a fresh caption.
    fireEvent.press(screen.getByTestId('delivery-slot-0-link'));
    fireEvent.changeText(screen.getByTestId('delivery-slot-0-url'), 'https://drive.test/v2');
    fireEvent.changeText(screen.getByTestId('delivery-slot-1-caption'), 'Now with the logo');
    await pressSubmit();

    expect(posted()?.data).toEqual({
      items: [
        { pieceId: 'p1', externalUrl: 'https://drive.test/v2' },
        { pieceId: 'p2', reuseItemId: 'item-2', caption: 'Now with the logo' },
      ],
    });
    expect(mockUpload).not.toHaveBeenCalled();
  });

  test('a kept piece with an empty caption sends no caption', async () => {
    answers(
      delivery({
        stage: 'draft_changes_requested',
        pieces: twoPieces.slice(0, 2),
        rounds: [changesRequested()],
      }),
    );
    renderScreen();

    await screen.findByTestId('delivery-slot-0-keep');
    await pressSubmit();

    expect(posted()?.data).toEqual({
      items: [
        { pieceId: 'p1', reuseItemId: 'item-1' },
        { pieceId: 'p2', reuseItemId: 'item-2' },
      ],
    });
  });

  test('a 409 shows the server message and refetches the delivery', async () => {
    answers(delivery(), () => {
      throw new ApiError({
        code: 'CONFLICT',
        statusCode: 409,
        message: 'A delivery is already awaiting review.',
      } as never);
    });
    renderScreen();

    fireEvent.changeText(await screen.findByTestId('delivery-slot-0-url'), 'https://drive.test/a');
    fireEvent.changeText(screen.getByTestId('delivery-slot-1-url'), 'https://drive.test/b');
    const readsBefore = deliveryReads();
    await pressSubmit();

    expect(await screen.findByText('A delivery is already awaiting review.')).toBeTruthy();
    expect(deliveryReads()).toBeGreaterThan(readsBefore);
    expect(mockBack).not.toHaveBeenCalled();
  });

  test('a 422 lands on the slot it names, and editing clears it', async () => {
    answers(delivery(), () => {
      throw new ApiError({
        code: 'VALIDATION_FAILED',
        statusCode: 422,
        message: 'The submitted data is invalid.',
        errors: { 'items[1].externalUrl': 'must be a URL address' },
      } as never);
    });
    renderScreen();

    fireEvent.changeText(await screen.findByTestId('delivery-slot-0-url'), 'https://drive.test/a');
    fireEvent.changeText(screen.getByTestId('delivery-slot-1-url'), 'https://drive.test/b');
    await pressSubmit();

    expect(
      within(screen.getByTestId('delivery-slot-1')).getByText('must be a URL address'),
    ).toBeTruthy();
    expect(screen.queryByTestId('submit-delivery-error')).toBeNull();

    fireEvent.changeText(screen.getByTestId('delivery-slot-1-url'), 'https://drive.test/c');
    expect(screen.queryByText('must be a URL address')).toBeNull();
  });

  test('a too-large image shows on its slot and sends no round', async () => {
    mockPicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mockPicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///big.jpg', mimeType: 'image/jpeg', fileName: 'big.jpg' }],
    } as never);
    mockUpload.mockRejectedValue(
      new ApiError({ code: 'MEDIA_TOO_LARGE', statusCode: 413, message: 'too large' } as never),
    );
    answers(delivery());
    renderScreen();

    fireEvent.changeText(await screen.findByTestId('delivery-slot-0-url'), 'https://drive.test/a');
    fireEvent.press(screen.getByTestId('delivery-slot-1-image'));
    await act(async () => {
      fireEvent.press(screen.getByTestId('delivery-slot-1-pick'));
    });
    await pressSubmit();

    expect(
      within(screen.getByTestId('delivery-slot-1')).getByText(
        'That image is too large (max 5 MB).',
      ),
    ).toBeTruthy();
    expect(posted()).toBeUndefined();
  });

  test('a network failure shows a generic banner', async () => {
    answers(delivery(), () => {
      throw new ApiError({ code: 'NETWORK_ERROR', statusCode: 0 } as never);
    });
    renderScreen();

    fireEvent.changeText(await screen.findByTestId('delivery-slot-0-url'), 'https://drive.test/a');
    fireEvent.changeText(screen.getByTestId('delivery-slot-1-url'), 'https://drive.test/b');
    await pressSubmit();

    expect(
      await screen.findByText('Cannot reach the server. Check your connection and try again.'),
    ).toBeTruthy();
  });

  test('a stage that cannot submit shows nothing to submit', async () => {
    answers(delivery({ stage: 'draft_in_review' }));
    renderScreen();

    expect(await screen.findByText('Nothing to submit right now.')).toBeTruthy();
    expect(screen.queryByTestId('submit-delivery-submit')).toBeNull();
    fireEvent.press(screen.getByTestId('submit-delivery-back'));
    expect(mockBack).toHaveBeenCalled();
  });
  describe('the final delivery (backend 18r2)', () => {
    function approvedDraft(items: DeliveryRound['items']): DeliveryRound {
      return {
        ...changesRequested(),
        status: 'approved',
        reviewDecision: 'approved',
        reviewReason: null,
        items,
      };
    }
    const linkItem = (id: string, pieceId: string, externalUrl: string) => ({
      ...changesRequested().items[0],
      id,
      pieceId,
      externalUrl,
      reviewComment: null,
      status: 'approved',
    });

    test('UGC: no Image option, the approved draft link is kept, Send final delivery', async () => {
      answers(
        delivery({
          stage: 'awaiting_final',
          pieces: twoPieces.slice(0, 2),
          rounds: [
            approvedDraft([
              linkItem('item-1', 'p1', 'https://drive.test/final-1'),
              { ...linkItem('item-2', 'p2', ''), externalUrl: null, mediaId: 'media-old' },
            ]),
          ],
        }),
      );
      renderScreen();

      expect(await screen.findByText('Send final delivery')).toBeTruthy();
      expect(screen.queryByTestId('delivery-slot-0-image')).toBeNull();
      expect(screen.queryByTestId('delivery-slot-1-image')).toBeNull();
      expect(screen.getByTestId('delivery-slot-0-keep').props.accessibilityState?.checked).toBe(
        true,
      );
      // A draft upload can't be a final item: the slot starts on Link.
      expect(screen.queryByTestId('delivery-slot-1-keep')).toBeNull();
      expect(
        screen.getAllByText('Share the final files, e.g. a Google Drive or Dropbox link.'),
      ).toHaveLength(2);
      expect(submitButton().props.accessibilityState?.disabled).toBe(true);

      fireEvent.changeText(screen.getByTestId('delivery-slot-1-url'), 'https://drive.test/final-2');
      await pressSubmit();

      expect(posted()?.data).toEqual({
        items: [
          { pieceId: 'p1', reuseItemId: 'item-1' },
          { pieceId: 'p2', externalUrl: 'https://drive.test/final-2' },
        ],
      });
      expect(mockUpload).not.toHaveBeenCalled();
    });

    test('Brand Awareness: a live post must be on the piece platform', async () => {
      answers(
        delivery({
          stage: 'awaiting_final',
          objective: 'brand_awareness',
          pieces: [
            piece({ id: 'p1', finalKind: 'live_post' }),
            piece({
              id: 'p2',
              platform: 'custom',
              type: 'custom',
              title: 'Store visit',
              finalKind: 'live_post',
            }),
          ],
          rounds: [approvedDraft([])],
        }),
      );
      renderScreen();

      expect(
        await screen.findByText('Post it on Instagram, then paste the live post link.'),
      ).toBeTruthy();
      expect(screen.getByText('Post it, then paste the link to the live post.')).toBeTruthy();

      fireEvent.changeText(screen.getByTestId('delivery-slot-0-url'), 'https://tiktok.com/@me/1');
      fireEvent.changeText(screen.getByTestId('delivery-slot-1-url'), 'https://blog.example.com/p');
      expect(screen.getByText('Paste the Instagram post link.')).toBeTruthy();
      expect(submitButton().props.accessibilityState?.disabled).toBe(true);

      fireEvent.changeText(
        screen.getByTestId('delivery-slot-0-url'),
        'https://www.instagram.com/reel/abc',
      );
      expect(screen.queryByText('Paste the Instagram post link.')).toBeNull();
      expect(submitButton().props.accessibilityState?.disabled).toBe(false);
      await pressSubmit();

      expect(posted()?.data).toEqual({
        items: [
          { pieceId: 'p1', externalUrl: 'https://www.instagram.com/reel/abc' },
          { pieceId: 'p2', externalUrl: 'https://blog.example.com/p' },
        ],
      });
    });

    test('a server live-post 422 lands on its slot', async () => {
      answers(
        delivery({
          stage: 'awaiting_final',
          objective: 'brand_awareness',
          pieces: [piece({ id: 'p1', finalKind: 'live_post' })],
          rounds: [approvedDraft([])],
        }),
        () => {
          throw new ApiError({
            code: 'VALIDATION_FAILED',
            statusCode: 422,
            message: 'The submitted data is invalid.',
            errors: { 'items[0].externalUrl': 'must be an Instagram post link' },
          } as never);
        },
      );
      renderScreen();

      fireEvent.changeText(
        await screen.findByTestId('delivery-slot-0-url'),
        'https://instagram.com/reel/abc',
      );
      await pressSubmit();

      expect(
        within(screen.getByTestId('delivery-slot-0')).getByText('must be an Instagram post link'),
      ).toBeTruthy();
    });
  });
});
