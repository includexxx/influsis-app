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
  test('renders "3 of 9", Next disabled, and no subcategory checklist', () => {
    renderStep();
    expect(screen.getByText('3 of 9')).toBeTruthy();
    expect(nextDisabled()).toBe(true);
    // Subcategories moved to their own step 4.
    expect(screen.queryByText('Singing')).toBeNull();
  });

  test('selecting one category enables Next', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-category-music'));
    await waitFor(() => expect(nextDisabled()).toBe(false));

    fireEvent.press(screen.getByTestId('onboarding-category-music'));
    await waitFor(() => expect(nextDisabled()).toBe(true));
  });

  test('the Others branch needs specify text before Next enables', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-category-others'));

    const input = await screen.findByTestId('onboarding-category-others-text');
    expect(nextDisabled()).toBe(true);

    fireEvent.changeText(input, 'Gardening');
    await waitFor(() => expect(nextDisabled()).toBe(false));
  });

  test('deselecting Others hides and clears its specify field', async () => {
    renderStep();
    fireEvent.press(screen.getByTestId('onboarding-category-others'));
    fireEvent.changeText(await screen.findByTestId('onboarding-category-others-text'), 'Gardening');
    await waitFor(() => expect(nextDisabled()).toBe(false));

    fireEvent.press(screen.getByTestId('onboarding-category-others'));
    await waitFor(() => expect(screen.queryByTestId('onboarding-category-others-text')).toBeNull());

    fireEvent.press(screen.getByTestId('onboarding-category-others'));
    expect(nextDisabled()).toBe(true);
  });

  test('a valid submit stores the picks with empty subcategories and advances to step 4', async () => {
    const store = renderStep();

    fireEvent.press(screen.getByTestId('onboarding-category-music'));
    await waitFor(() => expect(nextDisabled()).toBe(false));

    fireEvent.press(screen.getByTestId('onboarding-next'));

    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(4));
    const state = store.getState().creatorOnboarding;
    expect(state.completedSteps).toContain(3);
    expect(state.contentCategories).toEqual({
      categories: [{ value: 'music', subcategories: [] }],
      categoryOthersText: '',
    });
  });

  test('the header Back returns to step 2', async () => {
    const store = renderStep();
    fireEvent.press(screen.getByLabelText('Go back'));
    await waitFor(() => expect(store.getState().creatorOnboarding.currentStep).toBe(2));
  });
});
