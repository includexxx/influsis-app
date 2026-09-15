import { describe, expect, test, jest } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import creatorOnboarding, { saveBasics } from '@/slices/creatorOnboarding.slice';

import BasicInformationStep from './BasicInformationStep';

// The real gender sheet / calendar are BottomSheet-based and exercised
// elsewhere; here they're stand-ins that just emit a value, keeping this
// test about BasicInformationStep's own wiring (validity gate + save +
// advance). The age rule itself is covered in utils/onboardingSchemas.test.ts.
jest.mock('@/components/elements/OptionSheet', () => ({
  __esModule: true,
  default: ({ onSelect }: { onSelect: (v: string) => void }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable testID="pick-female" onPress={() => onSelect('female')}>
        <Text>Female</Text>
      </Pressable>
    );
  },
}));

jest.mock('@/components/elements/CalendarPicker', () => ({
  __esModule: true,
  default: ({ onSelect }: { onSelect: (d: Date) => void }) => {
    const { Pressable, Text } = require('react-native');
    const adult = new Date();
    adult.setFullYear(adult.getFullYear() - 20);
    const minor = new Date();
    minor.setFullYear(minor.getFullYear() - 10);
    return (
      <>
        <Pressable testID="pick-adult-dob" onPress={() => onSelect(adult)}>
          <Text>adult</Text>
        </Pressable>
        <Pressable testID="pick-minor-dob" onPress={() => onSelect(minor)}>
          <Text>minor</Text>
        </Pressable>
      </>
    );
  },
}));

function renderStep(
  props?: { name?: string },
  setup?: (dispatch: ReturnType<typeof configureStore>['dispatch']) => void,
) {
  const store = configureStore({ reducer: { creatorOnboarding } });
  setup?.(store.dispatch);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  render(<BasicInformationStep {...props} />, { wrapper });
  return store;
}

function nextDisabled(): boolean | undefined {
  return screen.getByTestId('onboarding-next').props.accessibilityState?.disabled;
}

async function completeForm() {
  fireEvent.changeText(screen.getByTestId('onboarding-name'), 'Ayesha Rahman');
  fireEvent.press(screen.getByTestId('onboarding-gender'));
  fireEvent.press(await screen.findByTestId('pick-female'));
  fireEvent.press(screen.getByTestId('onboarding-dob'));
  fireEvent.press(await screen.findByTestId('pick-adult-dob'));
  await waitFor(() => expect(nextDisabled()).toBe(false));
}

describe('<BasicInformationStep />', () => {
  test('shows the 1-of-10 progress and disables Next until the form is valid', async () => {
    renderStep();
    expect(screen.getByText('1 of 10')).toBeTruthy();
    expect(nextDisabled()).toBe(true);

    await completeForm();

    expect(nextDisabled()).toBe(false);
  });

  test('saves Step 1 values and advances to step 2 on Next', async () => {
    const store = renderStep();
    await completeForm();

    fireEvent.press(screen.getByTestId('onboarding-next'));

    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(2));
    const state = store.getState().creatorOnboarding;
    expect(state.completedSteps).toEqual([1]);
    expect(state.basics).toMatchObject({ name: 'Ayesha Rahman', gender: 'female' });
    expect(typeof state.basics?.dateOfBirth).toBe('string');
  });

  test('an underage date of birth keeps Next disabled and shows the age error', async () => {
    renderStep();
    fireEvent.changeText(screen.getByTestId('onboarding-name'), 'Young Creator');
    fireEvent.press(screen.getByTestId('onboarding-gender'));
    fireEvent.press(await screen.findByTestId('pick-female'));
    fireEvent.press(screen.getByTestId('onboarding-dob'));
    fireEvent.press(await screen.findByTestId('pick-minor-dob'));

    expect(await screen.findByText(/at least 14/i)).toBeTruthy();
    expect(nextDisabled()).toBe(true);
  });

  test('pre-fills the name field from the `name` prop when no draft is saved', async () => {
    renderStep({ name: 'Ayesha Rahman' });
    expect(await screen.findByDisplayValue('Ayesha Rahman')).toBeTruthy();
  });

  test('the `name` prop takes precedence over a saved draft name', async () => {
    renderStep({ name: 'Fetched Name' }, dispatch => {
      dispatch(
        saveBasics({
          name: 'Drafted Name',
          gender: 'female',
          dateOfBirth: '2000-01-01T00:00:00.000Z',
        }),
      );
    });
    expect(await screen.findByDisplayValue('Fetched Name')).toBeTruthy();
    expect(screen.queryByDisplayValue('Drafted Name')).toBeNull();
  });

  test('keeps the saved draft name when no `name` prop is given', async () => {
    renderStep(undefined, dispatch => {
      dispatch(
        saveBasics({
          name: 'Drafted Name',
          gender: 'female',
          dateOfBirth: '2000-01-01T00:00:00.000Z',
        }),
      );
    });
    expect(await screen.findByDisplayValue('Drafted Name')).toBeTruthy();
  });
});
