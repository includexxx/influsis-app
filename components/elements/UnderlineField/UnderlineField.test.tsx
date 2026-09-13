import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import UnderlineField from './UnderlineField';

describe('<UnderlineField />', () => {
  test('renders the label and an editable value', () => {
    render(<UnderlineField label="Full Name" value="Andrew Ainsley" testID="field" />);
    expect(screen.getByText('Full Name')).not.toBeNull();
    expect(screen.getByDisplayValue('Andrew Ainsley')).not.toBeNull();
  });

  test('calls onChangeText when the value is edited', () => {
    const onChangeText = jest.fn();
    render(
      <UnderlineField
        label="Full Name"
        value="Andrew"
        onChangeText={onChangeText}
        testID="field"
      />,
    );
    fireEvent.changeText(screen.getByTestId('field'), 'Andrew A.');
    expect(onChangeText).toHaveBeenCalledWith('Andrew A.');
  });

  test('renders a non-editable value as plain text and calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <UnderlineField
        label="Gender"
        value="Male"
        editable={false}
        onPress={onPress}
        testID="field"
      />,
    );
    expect(screen.getByText('Male')).not.toBeNull();
    fireEvent.press(screen.getByTestId('field'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('renders the placeholder when no value is set', () => {
    render(
      <UnderlineField
        label="Country"
        placeholder="Select country"
        editable={false}
        onPress={() => {}}
      />,
    );
    expect(screen.getByText('Select country')).not.toBeNull();
  });
});
