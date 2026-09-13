import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import StepTracker from './StepTracker';

describe('<StepTracker />', () => {
  test('renders a title and description per step', () => {
    render(
      <StepTracker
        steps={[
          {
            title: 'Your details',
            description: 'Please provide your name and email',
            completed: true,
          },
          { title: 'Company details', description: 'A few details about your company' },
        ]}
        testID="step-tracker"
      />,
    );
    expect(screen.getByText('Your details')).not.toBeNull();
    expect(screen.getByText('Please provide your name and email')).not.toBeNull();
    expect(screen.getByText('Company details')).not.toBeNull();
    expect(screen.getByText('A few details about your company')).not.toBeNull();
  });
});
