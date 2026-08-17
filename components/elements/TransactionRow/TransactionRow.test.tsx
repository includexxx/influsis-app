import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TransactionRow from './TransactionRow';

const icon = { uri: 'icon.png' };

describe('<TransactionRow />', () => {
  test('renders the title, date and amount', () => {
    render(<TransactionRow icon={icon} title="Bkash transfer" date="Today" amount="+$750" />);
    expect(screen.getByText('Bkash transfer')).not.toBeNull();
    expect(screen.getByText('Today')).not.toBeNull();
    expect(screen.getByText('+$750')).not.toBeNull();
  });

  test('is inert without onPress', () => {
    render(
      <TransactionRow
        icon={icon}
        title="Paypal transfer"
        date="Yesterday"
        amount="+$750"
        testID="row"
      />,
    );
    expect(screen.getByTestId('row').props.accessibilityRole).toBeUndefined();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <TransactionRow
        icon={icon}
        title="Bkash transfer"
        date="Today"
        amount="+$750"
        onPress={onPress}
        testID="row"
      />,
    );
    fireEvent.press(screen.getByTestId('row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
