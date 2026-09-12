import { test, expect, jest } from '@jest/globals';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import OnboardingStepScreen from './OnboardingStepScreen';

function renderScreen(props: Partial<React.ComponentProps<typeof OnboardingStepScreen>> = {}) {
  const onNext = jest.fn();
  const onBack = jest.fn();
  render(
    <OnboardingStepScreen
      step={3}
      totalSteps={10}
      title="Where are you based?"
      description="Your city is used to match you with campaigns"
      onBack={onBack}
      onNext={onNext}
      {...props}>
      <Text>field body</Text>
    </OnboardingStepScreen>,
  );
  return { onNext, onBack };
}

function nextDisabled(): boolean | undefined {
  return screen.getByTestId('onboarding-next').props.accessibilityState?.disabled;
}

describe('<OnboardingStepScreen />', () => {
  test('renders the header counter, title, description and body', () => {
    renderScreen();
    expect(screen.getByText('3 of 10')).toBeTruthy();
    expect(screen.getByText('Where are you based?')).toBeTruthy();
    expect(screen.getByText('field body')).toBeTruthy();
  });

  test('the CTA reads "Next" by default and fires onNext', () => {
    const { onNext } = renderScreen();
    fireEvent.press(screen.getByText('Next'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  test('honours nextLabel and nextTestID', () => {
    renderScreen({ nextLabel: 'Finish', nextTestID: 'onboarding-next' });
    expect(screen.getByText('Finish')).toBeTruthy();
  });

  test('nextDisabled greys the CTA and blocks onNext', () => {
    const { onNext } = renderScreen({ nextDisabled: true });
    expect(nextDisabled()).toBe(true);
    fireEvent.press(screen.getByTestId('onboarding-next'));
    expect(onNext).not.toHaveBeenCalled();
  });

  test('the header Back fires onBack, and is absent without it', () => {
    const { onBack } = renderScreen();
    fireEvent.press(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);

    screen.unmount();
    renderScreen({ onBack: undefined });
    expect(screen.queryByLabelText('Go back')).toBeNull();
  });

  test('renders a footerSlot above the CTA', () => {
    renderScreen({ footerSlot: <Text>skip for now</Text> });
    expect(screen.getByText('skip for now')).toBeTruthy();
  });
});
