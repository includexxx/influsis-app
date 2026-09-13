import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { router } from 'expo-router';
import creatorOnboarding, { goToStep, saveHandle } from '@/slices/creatorOnboarding.slice';
import OnboardingComplete from './OnboardingComplete';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

const mockReplace = router.replace as jest.MockedFunction<typeof router.replace>;

function renderWithStore() {
  const store = configureStore({ reducer: { creatorOnboarding } });
  store.dispatch(goToStep(10));
  store.dispatch(saveHandle('ayesha_rahman'));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  render(<OnboardingComplete />, { wrapper });
  return store;
}

beforeEach(() => {
  mockReplace.mockReset();
});

describe('<OnboardingComplete />', () => {
  test('renders the success hero copy', () => {
    renderWithStore();
    expect(screen.getByText("You're all set")).toBeTruthy();
    expect(screen.getByText('Your creator profile is ready to go')).toBeTruthy();
  });

  test('the CTA clears the onboarding draft and routes into the main app', () => {
    const store = renderWithStore();
    fireEvent.press(screen.getByTestId('onboarding-complete-cta'));

    expect(mockReplace).toHaveBeenCalledWith('/home');
    const state = store.getState().creatorOnboarding;
    expect(state.handle).toBeUndefined();
    expect(state.currentStep).toBe(1);
  });
});
