import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SocialAuthButton from './SocialAuthButton';

const icon = require('@/assets/images/icons/google.png');

describe('<SocialAuthButton />', () => {
  test('renders the label', () => {
    render(<SocialAuthButton label="Continue with Google" icon={icon} />);
    expect(screen.getByText('Continue with Google')).not.toBeNull();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<SocialAuthButton label="Continue with Google" icon={icon} onPress={onPress} />);
    fireEvent.press(screen.getByText('Continue with Google'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
