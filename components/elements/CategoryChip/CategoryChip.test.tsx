import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CategoryChip from './CategoryChip';

describe('<CategoryChip />', () => {
  test('renders the label', () => {
    render(<CategoryChip label="Food" />);
    expect(screen.getByText('Food')).not.toBeNull();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<CategoryChip label="Sports" onPress={onPress} testID="chip-sports" />);
    fireEvent.press(screen.getByTestId('chip-sports'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('exposes selected state for accessibility', () => {
    render(<CategoryChip label="Beauty" selected testID="chip-beauty" />);
    expect(screen.getByTestId('chip-beauty').props.accessibilityState.selected).toBe(true);
  });
});
