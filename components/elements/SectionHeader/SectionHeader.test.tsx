import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SectionHeader from './SectionHeader';

describe('<SectionHeader />', () => {
  test('renders the title, subtitle and "See all" button', () => {
    render(
      <SectionHeader
        title="Active Campaigns"
        subtitle="Work you've agreed to deliver"
        onSeeAllPress={jest.fn()}
      />,
    );
    expect(screen.getByText('Active Campaigns')).not.toBeNull();
    expect(screen.getByText("Work you've agreed to deliver")).not.toBeNull();
    expect(screen.getByLabelText('See all Active Campaigns')).not.toBeNull();
  });

  test('calls onSeeAllPress when "See all" is pressed', () => {
    const onSeeAllPress = jest.fn();
    render(<SectionHeader title="Business" onSeeAllPress={onSeeAllPress} />);
    fireEvent.press(screen.getByText('See all'));
    expect(onSeeAllPress).toHaveBeenCalledTimes(1);
  });

  test('hides "See all" when there is nowhere to go', () => {
    render(<SectionHeader title="Business" />);
    expect(screen.queryByText('See all')).toBeNull();
  });
});
