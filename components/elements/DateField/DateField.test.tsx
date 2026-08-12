import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import DateField from './DateField';

describe('<DateField />', () => {
  test('renders the placeholder when no value is set', () => {
    render(<DateField label="Date" onPress={() => {}} />);
    expect(screen.getByText('Select date')).not.toBeNull();
  });

  test('renders the formatted value when provided', () => {
    render(<DateField label="Date" value="08/17/2023" onPress={() => {}} />);
    expect(screen.getByText('08/17/2023')).not.toBeNull();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<DateField label="Date" onPress={onPress} testID="date-field" />);
    fireEvent.press(screen.getByTestId('date-field'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
