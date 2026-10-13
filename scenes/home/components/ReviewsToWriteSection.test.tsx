import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { request } from '@/services/http';
import { campaignFeedApi } from '@/scenes/campaigns/api/campaignFeedApi';
import { PendingReview } from '@/scenes/campaigns/types/review';
import ReviewsToWriteSection from './ReviewsToWriteSection';

jest.mock('@/services/http', () => {
  class ApiError extends Error {
    code: string;
    statusCode: number;
    constructor(body: { code?: string; statusCode: number; message?: string }) {
      super(body.message ?? 'api error');
      this.code = body.code ?? 'UNKNOWN';
      this.statusCode = body.statusCode;
    }
  }
  return { __esModule: true, request: jest.fn(), ApiError };
});

const mockRequest = request as jest.MockedFunction<typeof request>;

const pending: PendingReview = {
  engagementId: 'eng-1',
  completedAt: '2026-10-14T09:05:00.000Z',
  theirsSubmitted: true,
  campaign: { id: 'c1', title: 'Pathao Summer Push' },
  counterparty: { userId: 'biz-1', displayName: 'Pathao Ltd.', avatarUrl: null },
};

let store: ReturnType<typeof makeStore>;

function makeStore() {
  return configureStore({
    reducer: { [campaignFeedApi.reducerPath]: campaignFeedApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(campaignFeedApi.middleware),
  });
}

function renderSection(onReviewPress?: (review: PendingReview) => void) {
  store = makeStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return render(<ReviewsToWriteSection onReviewPress={onReviewPress} />, { wrapper });
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

describe('<ReviewsToWriteSection />', () => {
  test('lists the reviews to write and opens one on tap', async () => {
    mockRequest.mockResolvedValue([
      pending,
      { ...pending, engagementId: 'eng-2', theirsSubmitted: false },
    ]);
    const onReviewPress = jest.fn();
    renderSection(onReviewPress);

    expect(await screen.findByText('Reviews to write')).toBeTruthy();
    expect(screen.getAllByText('Rate Pathao Ltd.')).toHaveLength(2);
    expect(screen.getAllByText("They've reviewed you")).toHaveLength(1);
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/me/reviews/pending', params: { page: 1, limit: 3 } }),
    );

    fireEvent.press(screen.getByTestId('review-to-write-eng-1'));
    expect(onReviewPress).toHaveBeenCalledWith(pending);
  });

  test('renders nothing when there is nothing to review', async () => {
    mockRequest.mockResolvedValue([]);
    renderSection();

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    expect(mockRequest).toHaveBeenCalled();
    expect(screen.queryByTestId('reviews-to-write')).toBeNull();
  });

  test('renders nothing when the list fails to load', async () => {
    mockRequest.mockRejectedValue(new Error('offline'));
    renderSection();

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    expect(screen.queryByTestId('reviews-to-write')).toBeNull();
  });
});
