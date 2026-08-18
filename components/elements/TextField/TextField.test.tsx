import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TextField from './TextField';

describe('<TextField />', () => {
  test('renders label and placeholder', () => {
    render(<TextField label="Email" placeholder="you@example.com" />);
    expect(screen.getByText('Email')).not.toBeNull();
    expect(screen.getByPlaceholderText('you@example.com')).not.toBeNull();
  });

  test('renders error message when provided', () => {
    render(<TextField label="Password" error="Wrong password" secureTextEntry />);
    expect(screen.getByText('Wrong password')).not.toBeNull();
  });

  test('toggles secure text entry via the eye icon', () => {
    render(
      <TextField label="Password" placeholder="Password" secureTextEntry testID="password-input" />,
    );
    const input = screen.getByTestId('password-input');
    expect(input.props.secureTextEntry).toBe(true);

    fireEvent.press(screen.getByLabelText('Show password'));
    expect(input.props.secureTextEntry).toBe(false);
  });

  test('opens a picker instead of a keyboard when onPress is given', () => {
    const onPress = jest.fn();
    render(
      <TextField
        label="Gender"
        value="Male"
        editable={false}
        onPress={onPress}
        testID="gender-field"
      />,
    );

    fireEvent.press(screen.getByTestId('gender-field'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
