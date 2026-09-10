import { describe, expect, test, jest } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import creatorOnboarding, { goToStep } from '@/slices/creatorOnboarding.slice';
import PortfolioStep from './PortfolioStep';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

function renderStep() {
  const store = configureStore({ reducer: { creatorOnboarding } });
  store.dispatch(goToStep(7));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  render(<PortfolioStep />, { wrapper });
  return store;
}

function nextDisabled(): boolean | undefined {
  return screen.getByTestId('onboarding-next').props.accessibilityState?.disabled;
}

function platformSelected(cardIndex: number, platform: string): boolean | undefined {
  return screen.getByTestId(`onboarding-portfolio-${cardIndex}-platform-${platform}`).props
    .accessibilityState?.selected;
}

describe('<PortfolioStep />', () => {
  test('renders "7 of 8" with the zero-entry nudge and Next enabled', () => {
    renderStep();
    expect(screen.getByText('7 of 8')).toBeTruthy();
    expect(screen.getByText(/Adding at least one sample/)).toBeTruthy();
    expect(nextDisabled()).toBe(false);
  });

  test('adding a blank card disables Next until a valid link is typed', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-portfolio-add'));

    await waitFor(() => expect(nextDisabled()).toBe(true));

    fireEvent.changeText(screen.getByTestId('onboarding-portfolio-0-url'), 'instagram.com/p/abc');
    await waitFor(() => expect(nextDisabled()).toBe(false));
    expect(platformSelected(0, 'instagram')).toBe(true);
  });

  test('a manual platform tap overrides auto-detection and survives a later edit', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-portfolio-add'));
    fireEvent.changeText(
      await screen.findByTestId('onboarding-portfolio-0-url'),
      'instagram.com/p/abc',
    );
    await waitFor(() => expect(platformSelected(0, 'instagram')).toBe(true));

    fireEvent.press(screen.getByTestId('onboarding-portfolio-0-platform-youtube'));
    await waitFor(() => expect(platformSelected(0, 'youtube')).toBe(true));

    fireEvent.changeText(screen.getByTestId('onboarding-portfolio-0-url'), 'instagram.com/p/def');
    await waitFor(() => expect(platformSelected(0, 'youtube')).toBe(true));
  });

  test('a duplicate link warns but does not block Next', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-portfolio-add'));
    fireEvent.press(screen.getByTestId('onboarding-portfolio-add'));

    fireEvent.changeText(
      await screen.findByTestId('onboarding-portfolio-0-url'),
      'instagram.com/p/abc',
    );
    fireEvent.changeText(
      screen.getByTestId('onboarding-portfolio-1-url'),
      'https://instagram.com/p/abc/',
    );

    expect(await screen.findByText("You've already added this link")).toBeTruthy();
    await waitFor(() => expect(nextDisabled()).toBe(false));
  });

  test('delete removes a card', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-portfolio-add'));
    expect(await screen.findByTestId('onboarding-portfolio-0')).toBeTruthy();

    fireEvent.press(screen.getByTestId('onboarding-portfolio-0-delete'));
    await waitFor(() => expect(screen.queryByTestId('onboarding-portfolio-0')).toBeNull());
  });

  test('a valid submit stores the entries and advances to step 8', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByTestId('onboarding-portfolio-add'));
    fireEvent.changeText(
      await screen.findByTestId('onboarding-portfolio-0-url'),
      'instagram.com/p/abc',
    );
    await waitFor(() => expect(nextDisabled()).toBe(false));

    fireEvent.press(screen.getByTestId('onboarding-next'));

    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(8));
    const state = store.getState().creatorOnboarding;
    expect(state.completedSteps).toContain(7);
    expect(state.portfolio).toMatchObject([{ url: 'instagram.com/p/abc', platform: 'instagram' }]);
  });

  test('the header Back returns to step 6', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByLabelText('Go back'));
    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(6));
  });
});
