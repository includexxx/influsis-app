import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import OrderCard from './OrderCard';

const image = { uri: 'order.png' };

describe('<OrderCard />', () => {
  test('renders the short "Campaign" tab card with no footer', () => {
    render(
      <OrderCard
        image={image}
        title="Social Media Management"
        orderedFrom="Ordered from Bkash"
        price="$130"
        status="In Progress"
      />,
    );
    expect(screen.getByText('Social Media Management')).not.toBeNull();
    expect(screen.getByText('Ordered from Bkash')).not.toBeNull();
    expect(screen.getByText('$130')).not.toBeNull();
    expect(screen.getByText('In Progress')).not.toBeNull();
    expect(screen.queryByText('Due in 12 days')).toBeNull();
  });

  test('renders the divider + footer row when dueDate and orderedDate are given', () => {
    render(
      <OrderCard
        image={image}
        title="Social Media Management"
        orderedFrom="Ordered from Jhon Smith"
        price="$130"
        status="Completed"
        dueDate="Due in 12 days"
        orderedDate="Ordered Feb 12, 2025"
      />,
    );
    expect(screen.getByText('Due in 12 days')).not.toBeNull();
    expect(screen.getByText('Ordered Feb 12, 2025')).not.toBeNull();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <OrderCard
        image={image}
        title="Social Media Management"
        orderedFrom="Ordered from Bkash"
        price="$130"
        status="In Progress"
        onPress={onPress}
        testID="order-card"
      />,
    );
    fireEvent.press(screen.getByTestId('order-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
