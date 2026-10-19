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

  test('shows no badge when nothing is unread', () => {
    render(<AppHeader unreadCount={0} />);
    expect(screen.queryByTestId('app-header-unread')).toBeNull();
    expect(screen.getByLabelText('Notifications')).not.toBeNull();
  });

  test.each([
    [5, '5'],
    [99, '99'],
    [100, '99+'],
  ])('shows %d unread as "%s" and says so to screen readers', (count, text) => {
    render(<AppHeader unreadCount={count} />);
    expect(screen.getByTestId('app-header-unread')).not.toBeNull();
    expect(screen.getByText(text)).not.toBeNull();
    expect(screen.getByLabelText(`Notifications, ${text} unread`)).not.toBeNull();
  });
});
