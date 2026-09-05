import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SelectableListItem from './SelectableListItem';

const icon = { uri: 'icon.png' };

describe('<SelectableListItem />', () => {
  test('renders the label', () => {
    render(<SelectableListItem icon={icon} label="Education" />);
    expect(screen.getByText('Education')).not.toBeNull();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<SelectableListItem icon={icon} label="Travel" onPress={onPress} />);
    fireEvent.press(screen.getByText('Travel'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('exposes selected state via accessibilityState', () => {
    render(<SelectableListItem icon={icon} label="Music" selected testID="music-item" />);
    expect(screen.getByTestId('music-item').props.accessibilityState.selected).toBe(true);
  });
});
