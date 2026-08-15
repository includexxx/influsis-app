import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import Checkbox from './Checkbox';

describe('<Checkbox />', () => {
  test('renders unchecked by default', () => {
    render(<Checkbox testID="checkbox" />);
    expect(screen.getByTestId('checkbox').props.accessibilityState.checked).toBe(false);
  });

  test('renders checked when checked is true', () => {
    render(<Checkbox checked testID="checkbox" />);
    expect(screen.getByTestId('checkbox').props.accessibilityState.checked).toBe(true);
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<Checkbox onPress={onPress} testID="checkbox" />);
    fireEvent.press(screen.getByTestId('checkbox'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
