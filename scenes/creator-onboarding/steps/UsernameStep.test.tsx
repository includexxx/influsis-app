import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

jest.mock('@/services/http', () => {
  class ApiError extends Error {
    statusCode: number;
    constructor(body: { statusCode: number; message?: string }) {
      super(body.message ?? 'api error');
      this.name = 'ApiError';
      this.statusCode = body.statusCode;
    }
  }
  return { __esModule: true, request: jest.fn(), ApiError };
});

import { request } from '@/services/http';
import creatorOnboarding, {
  goToStep,
  saveBasics,
  saveLocation,
} from '@/slices/creatorOnboarding.slice';
import UsernameStep from './UsernameStep';

const mockRequest = request as jest.MockedFunction<typeof request>;

function renderStep() {
  const store = configureStore({ reducer: { creatorOnboarding } });
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

  test('Finish on an available handle logs the submission and completes onboarding', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const store = renderStep();
    fireEvent.changeText(screen.getByTestId('onboarding-handle'), 'ayesha_rahman');
    await settle();

    fireEvent.press(screen.getByTestId('onboarding-next'));
    await settle(0);

    const state = store.getState().creatorOnboarding;
    expect(state.handle).toBe('ayesha_rahman');
    expect(state.completed).toBe(true);
    expect(state.completedSteps).toContain(10);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('[creator-onboarding] submission', expect.any(Object));
    logSpy.mockRestore();
  });

  test('the header Back returns to step 9', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByLabelText('Go back'));
    await settle(0);
    expect(store.getState().creatorOnboarding.currentStep).toBe(9);
  });
});
