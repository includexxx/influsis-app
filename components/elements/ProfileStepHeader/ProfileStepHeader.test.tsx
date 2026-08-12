import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import ProfileStepHeader from './ProfileStepHeader';

describe('<ProfileStepHeader />', () => {
  test('renders the step counter, title and description', () => {
    render(
      <ProfileStepHeader
        step={2}
        totalSteps={5}
        title="What content do you create?"
        description="Brands seek creators within age ranges for campaign"
      />,
    );
    expect(screen.getByText('2 of 5')).not.toBeNull();
    expect(screen.getByText('What content do you create?')).not.toBeNull();
    expect(screen.getByText('Brands seek creators within age ranges for campaign')).not.toBeNull();
  });
});
