import { describe, expect, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import creatorOnboarding, { goToStep } from '@/slices/creatorOnboarding.slice';
import ContentCategoriesStep from './ContentCategoriesStep';

function renderStep() {
  const store = configureStore({ reducer: { creatorOnboarding } });
  store.dispatch(goToStep(3));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  render(<ContentCategoriesStep />, { wrapper });
  return store;
}

function nextDisabled(): boolean | undefined {
  return screen.getByTestId('onboarding-next').props.accessibilityState?.disabled;
}

describe('<ContentCategoriesStep />', () => {
  test('renders "3 of 8" and Next starts disabled', () => {
    renderStep();
    expect(screen.getByText('3 of 8')).toBeTruthy();
    expect(nextDisabled()).toBe(true);
  });

  test('selecting a category reveals its subcategories but keeps Next disabled', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-category-music-checkbox'));

    expect(await screen.findByText('Singing')).toBeTruthy();
    expect(nextDisabled()).toBe(true);
  });

  test('picking one subcategory per selected category enables and re-disables Next', async () => {
    renderStep();

    fireEvent.press(screen.getByTestId('onboarding-category-music-checkbox'));
    fireEvent.press(await screen.findByTestId('onboarding-category-music-sub-singing'));
    await waitFor(() => expect(nextDisabled()).toBe(false));

    // A second category with no subcategory blocks Next again.
    fireEvent.press(screen.getByTestId('onboarding-category-travel-checkbox'));
    await waitFor(() => expect(nextDisabled()).toBe(true));

    fireEvent.press(await screen.findByTestId('onboarding-category-travel-sub-budget-travel'));
    await waitFor(() => expect(nextDisabled()).toBe(false));
  });

  test('deselecting a category drops its subcategories and unblocks Next', async () => {
    renderStep();

    fireEvent.press(screen.getByTestId('onboarding-category-music-checkbox'));
    fireEvent.press(await screen.findByTestId('onboarding-category-music-sub-singing'));
    fireEvent.press(screen.getByTestId('onboarding-category-travel-checkbox'));
    await waitFor(() => expect(nextDisabled()).toBe(true));

    fireEvent.press(screen.getByTestId('onboarding-category-travel-checkbox'));
    await waitFor(() => expect(nextDisabled()).toBe(false));
  });

  test('the Others branch enables Next once specify text is entered', async () => {
    renderStep();

    fireEvent.press(screen.getByTestId('onboarding-category-others-checkbox'));
    const input = await screen.findByTestId('onboarding-category-others-text');
    expect(nextDisabled()).toBe(true);

    fireEvent.changeText(input, 'Gardening');
    await waitFor(() => expect(nextDisabled()).toBe(false));
  });

  test('a valid submit stores the selection and advances to step 4', async () => {
    const store = renderStep();

    fireEvent.press(screen.getByTestId('onboarding-category-music-checkbox'));
    fireEvent.press(await screen.findByTestId('onboarding-category-music-sub-singing'));
    await waitFor(() => expect(nextDisabled()).toBe(false));

    fireEvent.press(screen.getByTestId('onboarding-next'));

    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(4));
    const state = store.getState().creatorOnboarding;
    expect(state.completedSteps).toContain(3);
    expect(state.contentCategories).toEqual({
      categories: [{ value: 'music', subcategories: ['singing'] }],
      othersText: '',
    });
  });

  test('the header Back returns to step 2', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByLabelText('Go back'));
    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(2));
  });
});
