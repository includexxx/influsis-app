import { describe, expect, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import creatorOnboarding, { goToStep } from '@/slices/creatorOnboarding.slice';
import BioStep from './BioStep';

const VALID_BIO = 'Skincare creator in Dhaka sharing honest, budget-friendly routines.';

function renderStep() {
  const store = configureStore({ reducer: { creatorOnboarding } });
  store.dispatch(goToStep(2));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  render(<BioStep />, { wrapper });
  return store;
}

function nextDisabled(): boolean | undefined {
  return screen.getByTestId('onboarding-next').props.accessibilityState?.disabled;
}

describe('<BioStep />', () => {
  test('renders "2 of 10", the full counter, and a disabled Next', () => {
    renderStep();
    expect(screen.getByText('2 of 10')).toBeTruthy();
    expect(screen.getByText('300 characters left')).toBeTruthy();
    expect(nextDisabled()).toBe(true);
  });

  test('Next stays disabled below the 20-character minimum', async () => {
    renderStep();
    fireEvent.changeText(screen.getByTestId('onboarding-bio'), 'too short');
    await waitFor(() => expect(nextDisabled()).toBe(true));
  });

  test('a 20+ character bio enables Next and updates the counter', async () => {
    renderStep();
    fireEvent.changeText(screen.getByTestId('onboarding-bio'), VALID_BIO);

    await waitFor(() => expect(nextDisabled()).toBe(false));
    expect(screen.getByText(`${300 - VALID_BIO.length} characters left`)).toBeTruthy();
  });

  test('a valid submit stores the trimmed bio and advances to step 3', async () => {
    const store = renderStep();
    fireEvent.changeText(screen.getByTestId('onboarding-bio'), `  ${VALID_BIO}  `);
    await waitFor(() => expect(nextDisabled()).toBe(false));

    fireEvent.press(screen.getByTestId('onboarding-next'));

    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(3));
    const state = store.getState().creatorOnboarding;
    expect(state.completedSteps).toContain(2);
    expect(state.bio).toBe(VALID_BIO);
  });

  test('the header Back returns to step 1', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByLabelText('Go back'));
    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(1));
  });
});
