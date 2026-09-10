import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SelectableRow from './SelectableRow';

describe('<SelectableRow />', () => {
  test('renders the label and reflects the selected state', () => {
    const { rerender } = render(
      <SelectableRow label="English" selected={false} onPress={jest.fn()} testID="row-english" />,
    );
    expect(screen.getByText('English')).not.toBeNull();
    expect(screen.getByTestId('row-english').props.accessibilityState?.checked).toBe(false);

    rerender(<SelectableRow label="English" selected onPress={jest.fn()} testID="row-english" />);
    expect(screen.getByTestId('row-english').props.accessibilityState?.checked).toBe(true);
  });

  test('calls onPress once per tap', () => {
    const onPress = jest.fn();
    render(<SelectableRow label="Reel" selected={false} onPress={onPress} testID="row-reel" />);
    fireEvent.press(screen.getByTestId('row-reel'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
