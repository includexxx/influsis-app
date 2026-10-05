import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { request } from '@/services/http';
import { businessDirectoryApi } from './api/businessDirectoryApi';
import { BusinessDirectoryItem } from './types/businessDirectory';
import Businesses from './Businesses';

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

function business(overrides: Partial<BusinessDirectoryItem>): BusinessDirectoryItem {
  return {
    userId: 'business-1',
    businessName: 'Bkash Ltd.',
    username: 'bkash',
    description: 'Mobile financial services for everyone.',
    categories: ['fintech', 'mobile-banking', 'payments'],
    subcategories: [],
    country: 'Bangladesh',
    state: null,
    city: 'Dhaka',
    contactEmail: null,
    contactPhone: null,
    websiteUrl: null,
    avatarUrl: null,
    verificationStatus: 'verified',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const rows = [
  business({}),
  business({
    userId: 'business-2',
    businessName: 'Dhaka Delights',
    description: null,
    categories: ['food'],
    city: null,
    verificationStatus: 'unverified',
  }),
];

let store: ReturnType<typeof makeStore>;
function makeStore() {
  return configureStore({
    reducer: { [businessDirectoryApi.reducerPath]: businessDirectoryApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(businessDirectoryApi.middleware),
  });
}

function renderScreen() {
  store = makeStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return render(<Businesses />, { wrapper });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
  mockPush.mockReset();
});

afterEach(() => {
  store?.dispatch(businessDirectoryApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<Businesses />', () => {
  test('shows stack skeletons, then the businesses as stacked cards by default', async () => {
    mockRequest.mockResolvedValue(rows as never);
    renderScreen();

    expect(screen.getByTestId('businesses-loading')).toBeTruthy();
    expect(screen.getAllByTestId('business-card-skeleton').length).toBe(6);

    expect(await screen.findByText('Bkash Ltd.')).toBeTruthy();
    expect(screen.getByTestId('businesses-list-stack')).toBeTruthy();
    expect(screen.getByText('Dhaka, Bangladesh')).toBeTruthy();
    expect(screen.getByText('Mobile financial services for everyone.')).toBeTruthy();
    expect(screen.getByText('Fintech')).toBeTruthy();
    expect(screen.getByText('Mobile banking')).toBeTruthy();
    expect(screen.getByText('+1')).toBeTruthy();
    expect(screen.getByTestId('businesses-view-stack').props.accessibilityState).toEqual({
      checked: true,
    });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/business-profiles', params: { page: 1, limit: 12 } }),
    );
  });

  test('switches to the grid view and back', async () => {
    mockRequest.mockResolvedValue(rows as never);
    renderScreen();
    await screen.findByText('Bkash Ltd.');

    fireEvent.press(screen.getByTestId('businesses-view-grid'));
    expect(screen.getByTestId('businesses-list-grid')).toBeTruthy();
    expect(screen.getByTestId('businesses-view-grid').props.accessibilityState).toEqual({
      checked: true,
    });
    // The grid tile shows one category and no description.
    expect(screen.getByText('Fintech')).toBeTruthy();
    expect(screen.queryByText('Mobile financial services for everyone.')).toBeNull();

    fireEvent.press(screen.getByTestId('businesses-view-stack'));
    expect(screen.getByTestId('businesses-list-stack')).toBeTruthy();
  });

  test('opens a business on tap and marks verified ones', async () => {
    mockRequest.mockResolvedValue(rows as never);
    renderScreen();

    fireEvent.press(await screen.findByLabelText('Bkash Ltd., verified, Dhaka, Bangladesh'));
    expect(mockPush).toHaveBeenCalledWith('/business/business-1');
    expect(screen.getAllByTestId('business-card-verified')).toHaveLength(1);
  });

  test('shows a retryable error when the directory fails to load', async () => {
    mockRequest.mockRejectedValue(new Error('offline'));
    renderScreen();

    expect(await screen.findByText('Something went wrong')).toBeTruthy();
  });
});
