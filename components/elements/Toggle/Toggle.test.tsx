import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import Toggle from './Toggle';

describe('<Toggle />', () => {
  test('renders off state', () => {
    render(<Toggle value={false} testID="toggle" />);
    expect(screen.getByTestId('toggle').props.accessibilityState.checked).toBe(false);
  });

  test('renders on state', () => {
    render(<Toggle value testID="toggle" />);
    expect(screen.getByTestId('toggle').props.accessibilityState.checked).toBe(true);
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<Toggle value={false} onPress={onPress} testID="toggle" />);
    fireEvent.press(screen.getByTestId('toggle'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
