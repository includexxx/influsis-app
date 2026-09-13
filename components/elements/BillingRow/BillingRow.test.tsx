import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import BillingRow from './BillingRow';

const icon = { uri: 'icon.png' };

describe('<BillingRow />', () => {
  test('renders the title and description', () => {
    render(<BillingRow icon={icon} title="Mobile banking" description="Instant transfer" />);
    expect(screen.getByText('Mobile banking')).not.toBeNull();
    expect(screen.getByText('Instant transfer')).not.toBeNull();
  });

  test('marks the row selected when highlighted', () => {
    render(<BillingRow icon={icon} title="Recent transaction" highlighted testID="row" />);
    expect(screen.getByTestId('row').props.accessibilityState.selected).toBe(true);
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<BillingRow icon={icon} title="Bank transfer" onPress={onPress} testID="row" />);
    fireEvent.press(screen.getByTestId('row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
