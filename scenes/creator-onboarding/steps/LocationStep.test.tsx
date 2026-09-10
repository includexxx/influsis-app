import { describe, expect, test, jest } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import creatorOnboarding, { goToStep } from '@/slices/creatorOnboarding.slice';

// The real Division/City pickers are BottomSheet-based (covered by
// OptionSheet's own test); here a stand-in renders one pressable per option
// so the test can drive the dependent cascade.
jest.mock('@/components/elements/OptionSheet', () => ({
  __esModule: true,
  default: ({
    options,
    onSelect,
  }: {
    options: { value: string; label: string }[];
    onSelect: (v: string) => void;
  }) => {
    const { Pressable, Text } = require('react-native');
    return options.map(option => (
      <Pressable
        key={option.value}
        testID={`opt-${option.value}`}
        onPress={() => onSelect(option.value)}>
        <Text>{option.label}</Text>
      </Pressable>
    ));
  },
}));

import LocationStep from './LocationStep';

function renderStep() {
  const store = configureStore({ reducer: { creatorOnboarding } });
  store.dispatch(goToStep(2));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  render(<LocationStep />, { wrapper });
  return store;
}

function nextDisabled(): boolean | undefined {
  return screen.getByTestId('onboarding-next').props.accessibilityState?.disabled;
}

function fieldDisabled(testID: string): boolean | undefined {
  return screen.getByTestId(testID).props.accessibilityState?.disabled;
}

async function pickDhakaDhaka() {
  fireEvent.press(screen.getByTestId('onboarding-division'));
  fireEvent.press(await screen.findByTestId('opt-dhaka'));
  fireEvent.press(screen.getByTestId('onboarding-city'));
  fireEvent.press(await screen.findByTestId('opt-Dhaka'));
  await waitFor(() => expect(nextDisabled()).toBe(false));
}

describe('<LocationStep />', () => {
  test('renders "2 of 9"; Next and City start disabled', () => {
    renderStep();
    expect(screen.getByText('2 of 9')).toBeTruthy();
    expect(nextDisabled()).toBe(true);
    expect(fieldDisabled('onboarding-city')).toBe(true);
    expect(fieldDisabled('onboarding-country')).toBe(true);
  });

  test('picking a Division enables the City field', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-division'));
    fireEvent.press(await screen.findByTestId('opt-sylhet'));
    await waitFor(() => expect(fieldDisabled('onboarding-city')).toBe(false));
    expect(nextDisabled()).toBe(true); // city not picked yet
  });

  test('a full Division + City selection stores location and advances to step 3', async () => {
    const store = renderStep();
    await pickDhakaDhaka();

    fireEvent.press(screen.getByTestId('onboarding-next'));

    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(3));
    const state = store.getState().creatorOnboarding;
    expect(state.completedSteps).toContain(2);
    expect(state.location).toMatchObject({
      country: 'bangladesh',
      division: 'dhaka',
      city: 'Dhaka',
    });
  });

  test('changing the Division after a City was picked clears the City', async () => {
    renderStep();
    await pickDhakaDhaka();

    fireEvent.press(screen.getByTestId('onboarding-division'));
    fireEvent.press(await screen.findByTestId('opt-sylhet'));

    await waitFor(() => expect(nextDisabled()).toBe(true));
  });

  test('the header Back returns to step 1', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByLabelText('Go back'));
    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(1));
  });
});
