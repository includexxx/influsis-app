import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { request } from '@/services/http';
import { creatorDirectoryApi } from './api/creatorDirectoryApi';
import { CreatorDirectoryItem } from './types/creatorDirectory';
import TopCreators from './TopCreators';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
}));

jest.mock('@/services/http', () => {
  class ApiError extends Error {
    code = 'UNKNOWN';
    statusCode = 500;
  }
  return { __esModule: true, request: jest.fn(), ApiError };
});

const mockRequest = request as jest.MockedFunction<typeof request>;

function creator(overrides: Partial<CreatorDirectoryItem>): CreatorDirectoryItem {
  return {
    userId: 'creator-1',
    displayName: 'Rafi Ahmed',
    categories: ['food', 'travel-vlogs', 'lifestyle', 'tech'],
    country: 'Bangladesh',
    state: null,
    city: 'Dhaka',
    contactEmail: null,
    contactPhone: null,
    avatarUrl: null,
    isDiscoverable: true,
    verificationStatus: 'verified',
    createdAt: '2026-08-15T10:00:00.000Z',
    updatedAt: '2026-08-15T10:00:00.000Z',
    ...overrides,
  };
}

const rows = [
  creator({}),
  creator({
    userId: 'creator-2',
    displayName: 'Nadia Islam',
    categories: [],
    city: null,
    country: null,
    verificationStatus: 'unverified',
  }),
];

let store: ReturnType<typeof makeStore>;
function makeStore() {
  return configureStore({
    reducer: { [creatorDirectoryApi.reducerPath]: creatorDirectoryApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(creatorDirectoryApi.middleware),
  });
}

function renderScreen() {
  store = makeStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return render(<TopCreators />, { wrapper });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
  mockPush.mockReset();
});

afterEach(() => {
  store?.dispatch(creatorDirectoryApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<TopCreators />', () => {
  test('shows stack skeletons, then the creators as stacked cards by default', async () => {
    mockRequest.mockResolvedValue(rows as never);
    renderScreen();

    expect(screen.getByTestId('creators-loading')).toBeTruthy();
    expect(screen.getAllByTestId('creator-card-skeleton').length).toBe(6);

    expect(await screen.findByText('Rafi Ahmed')).toBeTruthy();
    expect(screen.getByTestId('creators-list-stack')).toBeTruthy();
    expect(screen.getByText('Dhaka, Bangladesh')).toBeTruthy();
    expect(screen.getAllByText('Creator since Aug 2026')).toHaveLength(2);
    expect(screen.getByText('Travel vlogs')).toBeTruthy();
    expect(screen.getByText('+1')).toBeTruthy();
    expect(screen.getByTestId('creators-view-stack').props.accessibilityState).toEqual({
      checked: true,
    });
  });

  test('switches to the grid view and back', async () => {
    mockRequest.mockResolvedValue(rows as never);
    renderScreen();
    await screen.findByText('Rafi Ahmed');

    fireEvent.press(screen.getByTestId('creators-view-grid'));
    expect(screen.getByTestId('creators-list-grid')).toBeTruthy();
    // The grid tile shows one category and no "Creator since".
    expect(screen.getByText('Food')).toBeTruthy();
    expect(screen.queryByText('Creator since Aug 2026')).toBeNull();

    fireEvent.press(screen.getByTestId('creators-view-stack'));
    expect(screen.getByTestId('creators-list-stack')).toBeTruthy();
  });

  test('opens a creator on tap; no location row when none is set', async () => {
    mockRequest.mockResolvedValue(rows as never);
    renderScreen();

    fireEvent.press(await screen.findByLabelText('Nadia Islam'));
    expect(mockPush).toHaveBeenCalledWith('/creator/creator-2');
    expect(screen.queryByText('Location not set')).toBeNull();
    expect(screen.getAllByTestId('creator-card-verified')).toHaveLength(1);
  });

  test('shows a retryable error when the directory fails to load', async () => {
    mockRequest.mockRejectedValue(new Error('offline'));
    renderScreen();

    expect(await screen.findByText('Something went wrong')).toBeTruthy();
  });
});
