import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AuthHeader from './AuthHeader';

describe('<AuthHeader />', () => {
  test('renders the title', () => {
    render(<AuthHeader title="Sign In" />);
    expect(screen.getByText('Sign In')).not.toBeNull();
  });

  test('calls onBack when the back button is pressed', () => {
    const onBack = jest.fn();
    render(<AuthHeader title="Sign Up" onBack={onBack} />);
    fireEvent.press(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test('omits the back button when onBack is not provided', () => {
    render(<AuthHeader title="Verification Code" />);
    expect(screen.queryByLabelText('Go back')).toBeNull();
  });
});
