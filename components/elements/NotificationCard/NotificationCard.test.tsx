import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import NotificationCard from './NotificationCard';

describe('<NotificationCard />', () => {
  test('renders title, description and time', () => {
    render(
      <NotificationCard
        icon="money-tick"
        title="Transfer Success"
        description="you have successfully sent johnatan $10.00"
        time="12:45 am"
      />,
    );
    expect(screen.getByText('Transfer Success')).not.toBeNull();
    expect(screen.getByText('you have successfully sent johnatan $10.00')).not.toBeNull();
    expect(screen.getByText('12:45 am')).not.toBeNull();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <NotificationCard
        icon="wallet"
        title="Receive payment"
        description="You received a payment"
        time="12:55 am"
        onPress={onPress}
        testID="notification-card"
      />,
    );
    fireEvent.press(screen.getByTestId('notification-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('the generic icon draws a bell instead of an image', () => {
    render(
      <NotificationCard icon="generic" title="Review published" description="" time="2 h ago" />,
    );
    expect(screen.getByTestId('notification-icon-generic')).toBeTruthy();
  });

  test('an unread card shows the dot and says so to screen readers', () => {
    render(
      <NotificationCard
        icon="wallet"
        title="Offer accepted"
        description="Terms are locked."
        time="5 min ago"
        unread
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByTestId('notification-unread-dot')).toBeTruthy();
    expect(
      screen.getByLabelText('Unread, Offer accepted. Terms are locked. 5 min ago'),
    ).toBeTruthy();
  });

  test('a read card has no dot', () => {
    render(
      <NotificationCard icon="wallet" title="Offer accepted" description="Done" time="1 d ago" />,
    );
    expect(screen.queryByTestId('notification-unread-dot')).toBeNull();
    expect(screen.getByLabelText('Offer accepted. Done. 1 d ago')).toBeTruthy();
  });
});
