import { describe, expect, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import creatorOnboarding, { goToStep } from '@/slices/creatorOnboarding.slice';
import DeliverablesStep from './DeliverablesStep';

function renderStep() {
  const store = configureStore({ reducer: { creatorOnboarding } });
  store.dispatch(goToStep(6));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  render(<DeliverablesStep />, { wrapper });
  return store;
}

function nextDisabled(): boolean | undefined {
  return screen.getByTestId('onboarding-next').props.accessibilityState?.disabled;
}

describe('<DeliverablesStep />', () => {
  test('renders "6 of 9" and Next starts disabled', () => {
    renderStep();
    expect(screen.getByText('6 of 9')).toBeTruthy();
    expect(nextDisabled()).toBe(true);
    expect(screen.queryByTestId('onboarding-deliverable-others')).toBeNull();
  });

  test('selecting then deselecting the only deliverable toggles Next', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-deliverable-reel'));
    await waitFor(() => expect(nextDisabled()).toBe(false));

    fireEvent.press(screen.getByTestId('onboarding-deliverable-reel'));
    await waitFor(() => expect(nextDisabled()).toBe(true));
  });

  test('a valid submit stores the selection and advances to step 7', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByTestId('onboarding-deliverable-reel'));
    fireEvent.press(screen.getByTestId('onboarding-deliverable-story'));
    await waitFor(() => expect(nextDisabled()).toBe(false));

    fireEvent.press(screen.getByTestId('onboarding-next'));

    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(7));
    const state = store.getState().creatorOnboarding;
    expect(state.completedSteps).toContain(6);
    expect(state.deliverables).toEqual({ selected: ['reel', 'story'], othersText: '' });
  });

  test('the header Back returns to step 5', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByLabelText('Go back'));
    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(5));
  });
});
