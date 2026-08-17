import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import BankRow from './BankRow';

const logo = { uri: 'logo.png' };

describe('<BankRow />', () => {
  test('renders the bank name', () => {
    render(<BankRow logo={logo} name="City Bank Limited" />);
    expect(screen.getByText('City Bank Limited')).not.toBeNull();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<BankRow logo={logo} name="Dhaka Bank Limited" onPress={onPress} testID="bank" />);
    fireEvent.press(screen.getByTestId('bank'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
