import { describe, expect, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import creatorOnboarding, { goToStep, saveCategories } from '@/slices/creatorOnboarding.slice';
import { CategoriesStepValues } from '@/utils/onboardingSchemas';
import SubcategoriesStep from './SubcategoriesStep';

function renderStep(categories: CategoriesStepValues['categories'], categoryOthersText = '') {
  const store = configureStore({ reducer: { creatorOnboarding } });
  store.dispatch(saveCategories({ categories, categoryOthersText }));
  store.dispatch(goToStep(5));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  render(<SubcategoriesStep />, { wrapper });
  return store;
}

function nextDisabled(): boolean | undefined {
  return screen.getByTestId('onboarding-next').props.accessibilityState?.disabled;
}

describe('<SubcategoriesStep />', () => {
  test('renders "5 of 10" and a checklist for each picked category, Next disabled', () => {
    renderStep([{ value: 'music', subcategories: [] }]);
    expect(screen.getByText('5 of 10')).toBeTruthy();
    expect(screen.getByText('Music')).toBeTruthy();
    expect(screen.getByText('Singing')).toBeTruthy();
    expect(nextDisabled()).toBe(true);
  });

  test('needs at least one subcategory under every real category', async () => {
    renderStep([
      { value: 'music', subcategories: [] },
      { value: 'travel', subcategories: [] },
    ]);

    fireEvent.press(screen.getByTestId('onboarding-subcategory-music-singing'));
    await waitFor(() => expect(nextDisabled()).toBe(true));

    fireEvent.press(screen.getByTestId('onboarding-subcategory-travel-budget-travel'));
    await waitFor(() => expect(nextDisabled()).toBe(false));
  });

  test('the Others category uses a specify field instead of a checklist', async () => {
    renderStep([{ value: 'others', subcategories: [] }], 'Gardening');
    const input = screen.getByTestId('onboarding-subcategory-others-text');
    expect(nextDisabled()).toBe(true);

    fireEvent.changeText(input, 'Balcony gardening');
    await waitFor(() => expect(nextDisabled()).toBe(false));
  });

  test('a valid submit stores the subcategories and advances to step 6', async () => {
    const store = renderStep([{ value: 'music', subcategories: [] }]);

    fireEvent.press(screen.getByTestId('onboarding-subcategory-music-singing'));
    await waitFor(() => expect(nextDisabled()).toBe(false));

    fireEvent.press(screen.getByTestId('onboarding-next'));

    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(6));
    const state = store.getState().creatorOnboarding;
    expect(state.completedSteps).toContain(5);
    expect(state.contentCategories?.categories).toEqual([
      { value: 'music', subcategories: ['singing'] },
    ]);
  });

  test('the header Back returns to step 4', async () => {
    const store = renderStep([{ value: 'music', subcategories: [] }]);
    fireEvent.press(screen.getByLabelText('Go back'));
    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(4));
  });

  test('shows a go-back message and keeps Next disabled with no categories', () => {
    const store = configureStore({ reducer: { creatorOnboarding } });
    store.dispatch(goToStep(5));
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    render(<SubcategoriesStep />, { wrapper });

    expect(screen.getByText('Go back and pick at least one category first.')).toBeTruthy();
    expect(nextDisabled()).toBe(true);
  });
});
