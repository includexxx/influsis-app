import { describe, expect, jest, test } from '@jest/globals';
import { ApiError } from '@/services/http';
import { EngagementReview, EngagementReviewState } from '../types/review';
import {
  applyReviewError,
  businessLabel,
  reviewCardState,
  reviewSchema,
  reviewVisibilityLine,
  toReviewPayload,
} from './review';

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

function state(overrides: Partial<EngagementReviewState> = {}): EngagementReviewState {
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

describe('reviewSchema', () => {
  const valid = { rating: 4.5, message: 'Clear brief and quick feedback.' };

  test('accepts half steps from 0 to 5', () => {
    for (const rating of [0, 0.5, 3, 4.5, 5]) {
      expect(reviewSchema.safeParse({ ...valid, rating }).success).toBe(true);
    }
  });

  test('rejects a missing, out-of-range or non-half rating', () => {
    for (const rating of [null, -0.5, 5.5, 3.3]) {
      const result = reviewSchema.safeParse({ ...valid, rating });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Choose a rating');
    }
  });

  test('counts the message after trimming, 10-2000 characters', () => {
    expect(
      reviewSchema.safeParse({ ...valid, message: '   short   ' }).error?.issues[0].message,
    ).toBe('Write at least 10 characters');
    expect(
      reviewSchema.safeParse({ ...valid, message: 'x'.repeat(2001) }).error?.issues[0].message,
    ).toBe('Keep it under 2000 characters');
    expect(reviewSchema.safeParse({ ...valid, message: `  ${'x'.repeat(10)}  ` }).success).toBe(
      true,
    );
  });
});

test('toReviewPayload trims the message', () => {
  expect(toReviewPayload({ rating: 0, message: '  Fine to work with.  ' })).toEqual({
    rating: 0,
    message: 'Fine to work with.',
  });
});

describe('applyReviewError', () => {
  test('puts 422 field errors on their fields', () => {
    const setError = jest.fn();
    applyReviewError(
      new ApiError({
        code: 'VALIDATION_FAILED',
        statusCode: 422,
        message: 'Validation failed',
        errors: {
          rating: 'must be between 0 and 5 in steps of 0.5',
          message: 'must be 10-2000 characters',
        },
      }),
      setError,
    );
    expect(setError).toHaveBeenCalledWith('rating', {
      message: 'must be between 0 and 5 in steps of 0.5',
    });
    expect(setError).toHaveBeenCalledWith('message', { message: 'must be 10-2000 characters' });
    expect(setError).not.toHaveBeenCalledWith('root', expect.anything());
  });

  test('anything else is one form-level message', () => {
    const setError = jest.fn();
    applyReviewError(
      new ApiError({ code: 'INTERNAL_ERROR', statusCode: 500, message: 'Server error' }),
      setError,
    );
    expect(setError).toHaveBeenCalledWith('root', { message: 'Server error' });

    applyReviewError(new Error('boom'), setError);
    expect(setError).toHaveBeenLastCalledWith('root', {
      message: 'Something went wrong. Please try again.',
    });
  });
});

describe('reviewCardState', () => {
  test('nothing before the engagement is completed', () => {
    expect(
      reviewCardState(state({ engagementStatus: 'accepted', canReview: false, revealAt: null })),
    ).toEqual({ kind: 'none' });
  });

  test('write, and whether the business already reviewed', () => {
    expect(reviewCardState(state())).toEqual({ kind: 'write', theyReviewed: false, theirs: null });
    expect(reviewCardState(state({ theirsSubmitted: true }))).toEqual({
      kind: 'write',
      theyReviewed: true,
      theirs: null,
    });
  });

  test("write still carries theirs once it's visible after 7 days", () => {
    const theirs = review({ direction: 'business_to_creator', isVisible: true });
    expect(reviewCardState(state({ theirsSubmitted: true, theirs }))).toEqual({
      kind: 'write',
      theyReviewed: true,
      theirs,
    });
  });

  test('submitted while theirs is blind or unwritten', () => {
    const mine = review();
    expect(reviewCardState(state({ canReview: false, mine, theirsSubmitted: true }))).toEqual({
      kind: 'submitted-blind',
      mine,
    });
  });

  test('revealed when both are visible, including a hidden one', () => {
    const mine = review({ isVisible: true });
    const theirs = review({ id: 'review-2', direction: 'business_to_creator', hidden: true });
    expect(reviewCardState(state({ canReview: false, mine, theirs }))).toEqual({
      kind: 'revealed',
      mine,
      theirs,
    });
  });
});

test('businessLabel falls back to "the business"', () => {
  expect(businessLabel('Pathao Ltd.')).toBe('Pathao Ltd.');
  expect(businessLabel(null)).toBe('the business');
  expect(businessLabel('  ')).toBe('the business');
});

describe('reviewVisibilityLine', () => {
  test('visible now', () => {
    expect(reviewVisibilityLine(review({ isVisible: true }), null, 'Pathao Ltd.')).toBe(
      'Visible to Pathao Ltd.',
    );
  });

  test('blind until the reveal date', () => {
    expect(reviewVisibilityLine(review(), '2026-10-21T09:05:00.000Z', null)).toMatch(
      /^The business can see it on .+, or sooner if they review you$/,
    );
  });
});
