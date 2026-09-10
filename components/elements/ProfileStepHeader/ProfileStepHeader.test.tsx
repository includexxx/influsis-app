import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ProfileStepHeader from './ProfileStepHeader';

describe('<ProfileStepHeader />', () => {
  test('renders the step counter, title and description', () => {
    render(
      <ProfileStepHeader
        step={2}
        totalSteps={5}
        title="What content do you create?"
        description="Businesses seek creators within age ranges for campaign"
      />,
    );
    expect(screen.getByText('2 of 5')).not.toBeNull();
    expect(screen.getByText('What content do you create?')).not.toBeNull();
    expect(
      screen.getByText('Businesses seek creators within age ranges for campaign'),
    ).not.toBeNull();
  });

  test('renders no back control without onBack', () => {
    render(<ProfileStepHeader step={1} totalSteps={8} title="Step one" description="First" />);
    expect(screen.queryByLabelText('Go back')).toBeNull();
  });

  test('renders a back control that fires onBack', () => {
    const onBack = jest.fn();
    render(
      <ProfileStepHeader
        step={2}
        totalSteps={8}
        title="Step two"
        description="Second"
        onBack={onBack}
      />,
    );
    fireEvent.press(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
