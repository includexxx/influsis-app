import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AddItemButton from './AddItemButton';

describe('<AddItemButton />', () => {
  test('renders the label', () => {
    render(<AddItemButton label="Add feature" />);
    expect(screen.getByText('Add feature')).not.toBeNull();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<AddItemButton label="Add feature" onPress={onPress} />);
    fireEvent.press(screen.getByText('Add feature'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
