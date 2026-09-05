import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SectionHeader from './SectionHeader';

describe('<SectionHeader />', () => {
  test('renders the title and "See all" link', () => {
    render(<SectionHeader title="Active Campaigns" />);
    expect(screen.getByText('Active Campaigns')).not.toBeNull();
    expect(screen.getByText('See all')).not.toBeNull();
  });

  test('calls onSeeAllPress when "See all" is pressed', () => {
    const onSeeAllPress = jest.fn();
    render(<SectionHeader title="Brand" onSeeAllPress={onSeeAllPress} />);
    fireEvent.press(screen.getByText('See all'));
    expect(onSeeAllPress).toHaveBeenCalledTimes(1);
  });
});
