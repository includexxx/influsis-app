import { describe, expect, test, jest } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));
jest.mock('@/services/http', () => ({ __esModule: true, request: jest.fn(), ApiError: Error }));

import creatorOnboarding, { goToStep, completeOnboarding } from '@/slices/creatorOnboarding.slice';
import CreatorOnboarding from './CreatorOnboarding';

function renderShell(setup?: (dispatch: ReturnType<typeof configureStore>['dispatch']) => void) {
  const store = configureStore({ reducer: { creatorOnboarding } });
  setup?.(store.dispatch);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  render(<CreatorOnboarding />, { wrapper });
  return store;
}

describe('<CreatorOnboarding />', () => {
  test('renders the active step while onboarding is in progress', () => {
    renderShell(dispatch => dispatch(goToStep(10)));
    expect(screen.getByText('10 of 10')).toBeTruthy();
    expect(screen.queryByText("You're all set")).toBeNull();
  });

  test('swaps the wizard for the completion screen once completed', () => {
    renderShell(dispatch => {
      dispatch(goToStep(10));
      dispatch(completeOnboarding());
    });
    expect(screen.getByText("You're all set")).toBeTruthy();
    expect(screen.queryByText('10 of 10')).toBeNull();
  });
});
