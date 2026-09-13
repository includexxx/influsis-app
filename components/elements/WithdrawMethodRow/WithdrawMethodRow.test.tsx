import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import WithdrawMethodRow from './WithdrawMethodRow';

const asset = { uri: 'asset.png' };

describe('<WithdrawMethodRow />', () => {
  test('renders a label in the icon + label shape', () => {
    render(<WithdrawMethodRow icon={asset} label="Bank Account" />);
    expect(screen.getByText('Bank Account')).not.toBeNull();
  });

  test('renders no label in the logo-only shape', () => {
    render(<WithdrawMethodRow logo={asset} logoWidth={57} logoHeight={32} testID="row" />);
    expect(screen.queryByText('Bank Account')).toBeNull();
  });

  test('marks the row selected', () => {
    render(<WithdrawMethodRow logo={asset} selected testID="row" />);
    expect(screen.getByTestId('row').props.accessibilityState.selected).toBe(true);
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <WithdrawMethodRow icon={asset} label="Visa Debit Card" onPress={onPress} testID="row" />,
    );
    fireEvent.press(screen.getByTestId('row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
