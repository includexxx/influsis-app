import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import BalanceCard from './BalanceCard';

describe('<BalanceCard />', () => {
  test('renders the default label, total and change', () => {
    render(<BalanceCard total="$450.00" change="3.2%" />);
    expect(screen.getByText('Total Balance')).not.toBeNull();
    expect(screen.getByText('$450.00')).not.toBeNull();
    expect(screen.getByText('3.2%')).not.toBeNull();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<BalanceCard total="$450.00" change="3.2%" onPress={onPress} testID="balance-card" />);
    fireEvent.press(screen.getByTestId('balance-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
