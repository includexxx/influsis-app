import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

import { router } from 'expo-router';
import OnboardingComplete from './OnboardingComplete';

const mockReplace = router.replace as jest.MockedFunction<typeof router.replace>;

beforeEach(() => {
  mockReplace.mockReset();
});

describe('<OnboardingComplete />', () => {
  test('renders the success hero copy', () => {
    render(<OnboardingComplete />);
    expect(screen.getByText("You're all set")).toBeTruthy();
    expect(screen.getByText('Your creator profile is ready to go')).toBeTruthy();
  });

  test('the CTA routes into the main app', () => {
    render(<OnboardingComplete />);
    fireEvent.press(screen.getByTestId('onboarding-complete-cta'));
    expect(mockReplace).toHaveBeenCalledWith('/home');
  });
});
