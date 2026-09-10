import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CustomSelectField from './CustomSelectField';

// No `@/utils/deviceInfo` mock is needed here: this component only renders the
// trigger row - the option list it opens (an OptionSheet, which does mount the
// @gorhom/bottom-sheet wrapper) belongs to the calling scene.

const options = [
  { label: 'Instagram Reels', value: 'instagram-reels' },
  { label: 'TikTok Video', value: 'tiktok-video' },
];

describe('<CustomSelectField />', () => {
  test('renders the placeholder when no value is selected', () => {
    render(
      <CustomSelectField placeholder="Select category" options={options} onPress={jest.fn()} />,
    );
    expect(screen.getByText('Select category')).not.toBeNull();
  });

  test('renders the selected option label', () => {
    render(
      <CustomSelectField
        placeholder="Select category"
        value="tiktok-video"
        options={options}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('TikTok Video')).not.toBeNull();
  });

  test('renders the label above the field', () => {
    render(
      <CustomSelectField
        label="Category"
        placeholder="Select category"
        options={options}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('Category')).not.toBeNull();
  });

  test('never renders the option list itself', () => {
    render(
      <CustomSelectField placeholder="Select category" options={options} onPress={jest.fn()} />,
    );
    expect(screen.queryByText('Instagram Reels')).toBeNull();
  });

  test('calls onPress when the field is pressed', () => {
    const onPress = jest.fn();
    render(
      <CustomSelectField
        placeholder="Select category"
        options={options}
        onPress={onPress}
        testID="category-field"
      />,
    );

    fireEvent.press(screen.getByTestId('category-field'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('when disabled, ignores the press and exposes a disabled state', () => {
    const onPress = jest.fn();
    render(
      <CustomSelectField
        placeholder="Select category"
        options={options}
        onPress={onPress}
        disabled
        testID="category-field"
      />,
    );

    fireEvent.press(screen.getByTestId('category-field'));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('category-field').props.accessibilityState?.disabled).toBe(true);
  });

  test('renders an inline error message', () => {
    render(
      <CustomSelectField
        placeholder="Select category"
        options={options}
        onPress={jest.fn()}
        error="Select a category"
      />,
    );
    expect(screen.getByText('Select a category')).not.toBeNull();
  });
});
