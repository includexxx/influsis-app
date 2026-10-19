import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ApiError, request } from '@/services/http';
import { campaignFeedApi } from './api/campaignFeedApi';
import { EngagementReview, EngagementReviewState } from './types/review';
import ReviewBusinessScreen from './ReviewBusinessScreen';

let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => mockParams,
  Redirect: ({ href }: { href: string }) => {
    const { Text: RNText } = jest.requireActual<typeof import('react-native')>('react-native');
    return <RNText>{`redirect:${href}`}</RNText>;
  },
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

function review(overrides: Partial<EngagementReview> = {}): EngagementReview {
  return {
    id: 'review-1',
    direction: 'creator_to_business',
    rating: 4.5,
    message: 'Clear brief and quick feedback.',
    submittedAt: '2026-10-14T11:00:00.000Z',
    visibleAt: '2026-10-21T09:05:00.000Z',
    isVisible: false,
    hidden: false,
    ...overrides,
  };
}

function reviewState(overrides: Partial<EngagementReviewState> = {}): EngagementReviewState {
  return {
    engagementStatus: 'completed',
    completedAt: '2026-10-14T09:05:00.000Z',
    revealAt: '2026-10-21T09:05:00.000Z',
    canReview: true,
    mine: null,
    theirs: null,
    theirsSubmitted: false,
    ...overrides,
  };
}

const theirs = review({
  id: 'review-2',
  direction: 'business_to_creator',
  rating: 5,
  message: 'Delivered early, great quality.',
  isVisible: true,
});

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
  return render(<ReviewBusinessScreen />, { wrapper });
}

async function fillAndSubmit(message = '  Clear brief and quick feedback.  ') {
  fireEvent.press(await screen.findByTestId('review-rating-4.5'));
  fireEvent.changeText(screen.getByTestId('review-message'), message);
  await act(async () => {
    fireEvent.press(screen.getByTestId('review-submit'));
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
  mockParams = { id: 'eng-1', title: 'Pathao Summer Push', business: 'Pathao Ltd.' };
});

afterEach(() => {
  store?.dispatch(campaignFeedApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<ReviewBusinessScreen />', () => {
  test('submits the rating and the trimmed message, then shows the submitted review', async () => {
    let submitted = false;
    answerWith(({ method }) => {
      if (method === 'POST') {
        submitted = true;
        return review();
      }
      return submitted ? reviewState({ canReview: false, mine: review() }) : reviewState();
    });
    renderScreen();

    expect(await screen.findByText('Rate Pathao Ltd.')).toBeTruthy();
    expect(screen.getByText("Reviews can't be edited or deleted after you submit.")).toBeTruthy();
    await fillAndSubmit();

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/engagements/eng-1/reviews',
        method: 'POST',
        data: { rating: 4.5, message: 'Clear brief and quick feedback.' },
      }),
    );
    expect(await screen.findByTestId('review-mine')).toBeTruthy();
    expect(screen.getByTestId('review-visibility').props.children).toMatch(
      /^Pathao Ltd\. can see it on .+, or sooner if they review you$/,
    );
    expect(screen.queryByTestId('review-submit')).toBeNull();
  });

  test('counts the message and blocks an invalid form without a request', async () => {
    answerWith(() => reviewState());
    renderScreen();

    fireEvent.changeText(await screen.findByTestId('review-message'), 'Too short');
    expect(screen.getByTestId('review-counter').props.children).toEqual([9, '/', 2000]);
    await act(async () => {
      fireEvent.press(screen.getByTestId('review-submit'));
    });

    expect(screen.getByText('Choose a rating')).toBeTruthy();
    expect(screen.getByText('Write at least 10 characters')).toBeTruthy();
    expect(mockRequest).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'POST' }));
  });

  test('puts a 422 on the matching field', async () => {
    answerWith(({ method }) => {
      if (method === 'POST') {
        throw new ApiError({
          code: 'VALIDATION_FAILED',
          statusCode: 422,
          message: 'Validation failed',
          errors: { message: 'must be 10-2000 characters' },
        });
      }
      return reviewState();
    });
    renderScreen();
    await fillAndSubmit();

    expect(await screen.findByText('must be 10-2000 characters')).toBeTruthy();
  });

  test('409 ALREADY_EXISTS refetches CK1 and shows the submitted state', async () => {
    let reads = 0;
    answerWith(({ method }) => {
      if (method === 'POST') {
        throw new ApiError({
          code: 'ALREADY_EXISTS',
          statusCode: 409,
          message: 'You have already reviewed this engagement.',
        });
      }
      reads += 1;
      return reads === 1 ? reviewState() : reviewState({ canReview: false, mine: review() });
    });
    renderScreen();
    await fillAndSubmit();

    expect(await screen.findByTestId('review-mine')).toBeTruthy();
    expect(reads).toBe(2);
  });

  test('shows both reviews once revealed, with the hidden note', async () => {
    answerWith(() =>
      reviewState({
        canReview: false,
        mine: review({ isVisible: true }),
        theirs: { ...theirs, hidden: true },
        theirsSubmitted: true,
      }),
    );
    renderScreen();

    expect(await screen.findByTestId('review-theirs')).toBeTruthy();
    expect(screen.getByText("Pathao Ltd.'s review of you")).toBeTruthy();
    expect(screen.getByText('Delivered early, great quality.')).toBeTruthy();
    expect(screen.getByTestId('review-theirs-hidden')).toBeTruthy();
    expect(screen.getByTestId('review-visibility').props.children).toBe('Visible to Pathao Ltd.');
  });

  test('tells the creator the business already reviewed them', async () => {
    answerWith(() => reviewState({ theirsSubmitted: true }));
    renderScreen();

    expect(
      await screen.findByText('Pathao Ltd. reviewed you. Write yours to see it.'),
    ).toBeTruthy();
    expect(screen.getByTestId('review-submit')).toBeTruthy();
  });

  test('shows a notice before the engagement is completed', async () => {
    answerWith(() =>
      reviewState({ engagementStatus: 'accepted', canReview: false, revealAt: null }),
    );
    renderScreen();

    expect(await screen.findByText('Reviews open once the engagement is completed.')).toBeTruthy();
    expect(screen.queryByTestId('review-submit')).toBeNull();
  });

  test('falls back to "the business" without a name', async () => {
    mockParams = { id: 'eng-1' };
    answerWith(() => reviewState());
    renderScreen();

    expect(await screen.findByText('Rate the business')).toBeTruthy();
  });

  test('says the item is no longer available when the engagement is not the creator’s', async () => {
    answerWith(() => {
      throw new ApiError({ code: 'NOT_FOUND', statusCode: 404, message: 'Not found' });
    });
    renderScreen();

    expect(await screen.findByText('This item is no longer available')).toBeTruthy();
    expect(screen.queryByText('redirect:/home')).toBeNull();
  });

  test('shows a retryable error when CK1 fails', async () => {
    answerWith(() => {
      throw new ApiError({ code: 'INTERNAL_ERROR', statusCode: 500, message: 'Server error' });
    });
    renderScreen();

    expect(await screen.findByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });
});
