import { test, expect } from '@jest/globals';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import OnboardingSlide from './OnboardingSlide';

describe('<OnboardingSlide />', () => {
  test('renders the visual, title and description', () => {
    render(
      <OnboardingSlide
        width={400}
        visual={<Text>Visual</Text>}
        title="Discover and Collaborate with Businesses"
        description="Working with Salman Muktadir was an absolute pleasure!"
      />,
    );
    expect(screen.getByText('Visual')).not.toBeNull();
    expect(screen.getByText('Discover and Collaborate with Businesses')).not.toBeNull();
    expect(
      screen.getByText('Working with Salman Muktadir was an absolute pleasure!'),
    ).not.toBeNull();
  });
});
