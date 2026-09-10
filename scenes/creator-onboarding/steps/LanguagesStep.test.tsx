import { describe, expect, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import creatorOnboarding, { goToStep } from '@/slices/creatorOnboarding.slice';
import LanguagesStep from './LanguagesStep';

function renderStep() {
  const store = configureStore({ reducer: { creatorOnboarding } });
  store.dispatch(goToStep(4));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  render(<LanguagesStep />, { wrapper });
  return store;
}

function nextDisabled(): boolean | undefined {
  return screen.getByTestId('onboarding-next').props.accessibilityState?.disabled;
}

describe('<LanguagesStep />', () => {
  test('renders "4 of 8" and Next starts disabled', () => {
    renderStep();
    expect(screen.getByText('4 of 8')).toBeTruthy();
    expect(nextDisabled()).toBe(true);
  });

  test('selecting then deselecting the only language toggles Next', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-language-english'));
    await waitFor(() => expect(nextDisabled()).toBe(false));

    fireEvent.press(screen.getByTestId('onboarding-language-english'));
    await waitFor(() => expect(nextDisabled()).toBe(true));
  });

  test('the Others row reveals a text field that must be filled', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-language-others'));

    const input = await screen.findByTestId('onboarding-language-other-text');
    expect(nextDisabled()).toBe(true);

    fireEvent.changeText(input, 'Bengali');
    await waitFor(() => expect(nextDisabled()).toBe(false));
  });

  test('deselecting Others hides and clears its text field', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-language-others'));
    fireEvent.changeText(await screen.findByTestId('onboarding-language-other-text'), 'Bengali');
    await waitFor(() => expect(nextDisabled()).toBe(false));

    fireEvent.press(screen.getByTestId('onboarding-language-others'));
    await waitFor(() => expect(screen.queryByTestId('onboarding-language-other-text')).toBeNull());

    fireEvent.press(screen.getByTestId('onboarding-language-others'));
    // The previously typed value did not persist through the toggle.
    expect(nextDisabled()).toBe(true);
  });

  test('a valid submit stores the selection and advances to step 5', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByTestId('onboarding-language-english'));
    await waitFor(() => expect(nextDisabled()).toBe(false));

    fireEvent.press(screen.getByTestId('onboarding-next'));

    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(5));
    const state = store.getState().creatorOnboarding;
    expect(state.completedSteps).toContain(4);
    expect(state.languages).toEqual({ selected: ['english'], othersText: '' });
  });

  test('the header Back returns to step 3', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByLabelText('Go back'));
    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(3));
  });
});
