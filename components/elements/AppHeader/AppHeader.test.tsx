import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AppHeader from './AppHeader';

describe('<AppHeader />', () => {
  test('renders the wordmark and notification button', () => {
    render(<AppHeader />);
    expect(screen.getByText('Influsis.')).not.toBeNull();
    expect(screen.getByLabelText('Notifications')).not.toBeNull();
  });

  test('calls onNotificationPress when the bell is pressed', () => {
    const onNotificationPress = jest.fn();
    render(<AppHeader onNotificationPress={onNotificationPress} />);
    fireEvent.press(screen.getByLabelText('Notifications'));
    expect(onNotificationPress).toHaveBeenCalledTimes(1);
  });
});
