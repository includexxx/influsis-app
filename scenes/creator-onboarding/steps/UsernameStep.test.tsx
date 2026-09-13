import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

import { request } from '@/services/http';
import creatorOnboarding, {
  goToStep,
  saveBasics,
  saveLocation,
} from '@/slices/creatorOnboarding.slice';
import { authApi } from '@/services/authApi';
import { profilesApi } from '@/services/profilesApi';
import { MyProfileResponse } from '@/types';
import UsernameStep from './UsernameStep';

jest.mock('@/services/http', () => {
  class ApiError extends Error {
    code: string;
    statusCode: number;
    errors: Record<string, string> | null;
    constructor(body: {
      code?: string;
      statusCode: number;
      message?: string;
      errors?: Record<string, string> | null;
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

const profileResponse: MyProfileResponse = {
  kind: 'creator',
  handle: 'ayesha_rahman',
  profile: {
    id: 'p-1',
    name: 'Ayesha Rahman',
    bio: null,
    categories: [],
    subcategories: [],
    languages: [],
    deliverables: [],
    platforms: [],
    portfolio: [],
    dateOfBirth: null,
    gender: null,
    country: null,
    state: null,
    city: null,
    postalCode: null,
    address: null,
    contactEmail: null,
    contactPhone: null,
    websiteUrl: null,
    avatarUrl: null,
    coverUrl: null,
    isDiscoverable: true,
    verificationDocumentsUrl: null,
    verificationStatus: 'unverified',
    verificationNotes: null,
    verifiedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};

function makeStore() {
  return configureStore({
    reducer: {
      creatorOnboarding,
      [authApi.reducerPath]: authApi.reducer,
      [profilesApi.reducerPath]: profilesApi.reducer,
    },
    middleware: gDM =>
      gDM({ serializableCheck: false }).concat(authApi.middleware, profilesApi.middleware),
  });
}

function renderStep() {
  const store = makeStore();
  store.dispatch(goToStep(10));
  store.dispatch(
    saveBasics({
      name: 'Ayesha Rahman',
      gender: 'female',
      dateOfBirth: '2001-04-12T00:00:00.000Z',
    }),
  );
  store.dispatch(saveLocation({ country: 'bangladesh', division: 'dhaka', city: 'Dhaka' }));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  render(<UsernameStep />, { wrapper });
  return store;
}

async function settle(ms = 400) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
  await act(async () => {
    await Promise.resolve();
  });
}

function nextDisabled(): boolean | undefined {
  return screen.getByTestId('onboarding-next').props.accessibilityState?.disabled;
}

/** Resolves the availability check and, separately, the onboarding submit. */
function mockNetwork(onSubmit: (args: { url: string }) => unknown) {
  mockRequest.mockImplementation((async (args: { url?: string }) => {
    if (String(args.url).includes('/availability')) {
      return { available: true };
    }
    if (args.url === '/profiles/onboarding-creator') {
      return onSubmit(args as { url: string });
    }
    throw new Error(`unexpected request to ${args.url}`);
  }) as typeof request);
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({ available: true });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('<UsernameStep />', () => {
  test('renders "10 of 10" with Finish disabled', () => {
    renderStep();
    expect(screen.getByText('10 of 10')).toBeTruthy();
    expect(nextDisabled()).toBe(true);
  });

  test('a badly-formatted handle shows the format message, keeps Finish disabled, and never hits the network', async () => {
    renderStep();
    fireEvent.changeText(screen.getByTestId('onboarding-handle'), 'ab');
    await settle();

    expect(screen.getByText('Use 3-20 characters')).toBeTruthy();
    expect(nextDisabled()).toBe(true);
    expect(mockRequest).not.toHaveBeenCalled();
  });

  test('a valid, available handle runs a check and enables Finish', async () => {
    renderStep();
    fireEvent.changeText(screen.getByTestId('onboarding-handle'), 'ayesha_rahman');
    await settle();

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/handles/ayesha_rahman/availability', skipAuth: true }),
    );
    expect(screen.getByTestId('onboarding-handle-status')).toHaveTextContent('Available');
    expect(nextDisabled()).toBe(false);
  });

  test('a taken handle keeps Finish disabled and renders suggestion chips', async () => {
    mockRequest.mockReset();
    mockRequest.mockResolvedValue({ available: false, reason: 'taken' });
    renderStep();
    fireEvent.changeText(screen.getByTestId('onboarding-handle'), 'ayesha_rahman');
    await settle();

    expect(screen.getByTestId('onboarding-handle-status')).toHaveTextContent(
      'That handle is taken',
    );
    expect(nextDisabled()).toBe(true);
    expect(screen.getByTestId('onboarding-handle-suggestion-ayesharahman1')).toBeTruthy();
  });

  test('tapping a suggestion refills the input', async () => {
    mockRequest.mockReset();
    mockRequest.mockResolvedValue({ available: false, reason: 'taken' });
    renderStep();
    fireEvent.changeText(screen.getByTestId('onboarding-handle'), 'ayesha_rahman');
    await settle();

    fireEvent.press(screen.getByTestId('onboarding-handle-suggestion-ayesharahman1'));
    await settle();

    expect(screen.getByTestId('onboarding-handle').props.value).toBe('ayesharahman1');
  });

  test('Finish on an available handle submits the profile and completes onboarding', async () => {
    mockNetwork(() => profileResponse);
    const store = renderStep();
    fireEvent.changeText(screen.getByTestId('onboarding-handle'), 'ayesha_rahman');
    await settle();

    fireEvent.press(screen.getByTestId('onboarding-next'));
    await settle(0);
    await settle(0);

    const submitCall = mockRequest.mock.calls.find(
      ([args]) => args.url === '/profiles/onboarding-creator',
    );
    expect(submitCall).toBeTruthy();
    // `request()` itself is mocked here (not just the axios adapter), so
    // `data` is the raw request body object — axios's own JSON
    // serialization never runs.
    expect(submitCall?.[0].data).toMatchObject({ name: 'Ayesha Rahman', handle: 'ayesha_rahman' });

    const state = store.getState().creatorOnboarding;
    expect(state.handle).toBe('ayesha_rahman');
    expect(state.completed).toBe(true);
    expect(state.completedSteps).toContain(10);
  });

  test('a failed submit shows an error, stays on step 10, and does not complete onboarding', async () => {
    const { ApiError } = jest.requireMock('@/services/http') as {
      ApiError: new (body: { code: string; statusCode: number; message: string }) => Error;
    };
    mockNetwork(() => {
      throw new ApiError({ code: 'INTERNAL_ERROR', statusCode: 500, message: 'Server exploded.' });
    });
    const store = renderStep();
    fireEvent.changeText(screen.getByTestId('onboarding-handle'), 'ayesha_rahman');
    await settle();

    fireEvent.press(screen.getByTestId('onboarding-next'));
    await settle(0);
    await settle(0);

    expect(screen.getByTestId('onboarding-submit-error')).toHaveTextContent('Server exploded.');
    expect(store.getState().creatorOnboarding.completed).toBe(false);
  });

  test('a HANDLE_TAKEN conflict on submit lands on the handle field and keeps Finish reachable', async () => {
    const { ApiError } = jest.requireMock('@/services/http') as {
      ApiError: new (body: { code: string; statusCode: number; message: string }) => Error;
    };
    mockNetwork(() => {
      throw new ApiError({ code: 'HANDLE_TAKEN', statusCode: 409, message: 'Taken.' });
    });
    const store = renderStep();
    fireEvent.changeText(screen.getByTestId('onboarding-handle'), 'ayesha_rahman');
    await settle();

    fireEvent.press(screen.getByTestId('onboarding-next'));
    await settle(0);
    await settle(0);

    expect(screen.getByText(/claimed/i)).toBeTruthy();
    expect(nextDisabled()).toBe(true);
    expect(store.getState().creatorOnboarding.completed).toBe(false);

    // Editing the handle clears the conflict and re-enables Finish once available again.
    mockRequest.mockResolvedValue({ available: true });
    fireEvent.changeText(screen.getByTestId('onboarding-handle'), 'ayesha_rahman2');
    await settle();
    expect(nextDisabled()).toBe(false);
  });

  test('the header Back returns to step 9', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByLabelText('Go back'));
    await settle(0);
    expect(store.getState().creatorOnboarding.currentStep).toBe(9);
  });
});
