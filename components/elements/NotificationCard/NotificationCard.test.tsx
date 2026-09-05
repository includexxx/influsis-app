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
});
