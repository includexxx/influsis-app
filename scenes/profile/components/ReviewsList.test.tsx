import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProfileReview } from '@/scenes/creator/types/creatorDirectory';
import ReviewsList from './ReviewsList';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

function review(overrides: Partial<ProfileReview> = {}): ProfileReview {
  return {
    id: 'r1',
    rating: 5,
    message: 'Delivered ahead of schedule.',
    submittedAt: '2026-10-15T10:00:00.000Z',
    reviewer: { userId: 'b1', displayName: 'Bkash Ltd.', handle: 'bkash', avatarUrl: null },
    campaign: { id: 'c1', title: 'Bkash Eid Campaign' },
    ...overrides,
  };
}

// A page hook that returns the given rows for page 1 and nothing after.
function pages(rows: ProfileReview[] | 'error') {
  return ({ page }: { page: number }) => ({
    currentData: rows === 'error' ? undefined : page === 1 ? rows : [],
    isFetching: false,
    isError: rows === 'error',
    refetch: jest.fn(),
  });
}

function renderList(rows: ProfileReview[] | 'error', reviewer: 'business' | 'creator') {
  return render(
    <ReviewsList
      useQuery={pages(rows)}
      args={{ userId: 'u1' }}
      reviewer={reviewer}
      emptyText="No reviews yet."
      testIDPrefix="test"
    />,
  );
}

describe('<ReviewsList />', () => {
  test('a reviewer with a handle opens their profile', () => {
    renderList([review()], 'business');

    expect(screen.getByText('Delivered ahead of schedule.')).toBeTruthy();
    expect(screen.getByText('Bkash Eid Campaign')).toBeTruthy();
    fireEvent.press(screen.getByTestId('test-reviewer-r1'));
    expect(mockPush).toHaveBeenCalledWith('/business/b1');
  });

  test('a creator reviewer opens the creator profile', () => {
    renderList([review({ reviewer: { ...review().reviewer, userId: 'c9' } })], 'creator');

    fireEvent.press(screen.getByTestId('test-reviewer-r1'));
    expect(mockPush).toHaveBeenLastCalledWith('/creator/c9');
  });

  test('a "Former Influsis member" is not tappable', () => {
    renderList(
      [
        review({
          reviewer: {
            userId: 'gone',
            displayName: 'Former Influsis member',
            handle: null,
            avatarUrl: null,
          },
        }),
      ],
      'business',
    );

    expect(screen.getByText('Former Influsis member')).toBeTruthy();
    expect(screen.queryByTestId('test-reviewer-r1')).toBeNull();
  });

  test('shows the empty text and the error note', () => {
    const { unmount } = renderList([], 'business');
    expect(screen.getByText('No reviews yet.')).toBeTruthy();
    unmount();

    renderList('error', 'business');
    expect(screen.getByTestId('test-reviews-error')).toBeTruthy();
  });
});
