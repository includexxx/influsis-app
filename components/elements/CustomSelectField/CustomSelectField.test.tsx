import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CustomSelectField from './CustomSelectField';

// Unlike SelectField, no `@/utils/deviceInfo` mock is needed here: this
// component uses react-native's Modal rather than the @gorhom/bottom-sheet
// wrapper, so there's no reanimated incompatibility to work around.

const options = [
  { label: 'Instagram Reels', value: 'instagram-reels' },
  { label: 'TikTok Video', value: 'tiktok-video' },
];

describe('<CustomSelectField />', () => {
  test('renders the placeholder when no value is selected', () => {
    render(
      <CustomSelectField placeholder="Select category" options={options} onSelect={jest.fn()} />,
    );
    expect(screen.getByText('Select category')).not.toBeNull();
  });

  test('renders the selected option label', () => {
    render(
      <CustomSelectField
        placeholder="Select category"
        value="tiktok-video"
        options={options}
        onSelect={jest.fn()}
      />,
    );
    expect(screen.getByText('TikTok Video')).not.toBeNull();
  });

  test('keeps the option list closed until the field is pressed', () => {
    render(
      <CustomSelectField
        placeholder="Select category"
        options={options}
        onSelect={jest.fn()}
        testID="category-field"
      />,
    );
    expect(screen.queryByText('Instagram Reels')).toBeNull();

    fireEvent.press(screen.getByTestId('category-field'));
    expect(screen.getByText('Instagram Reels')).not.toBeNull();
  });

  test('calls onSelect with the tapped option value and closes the overlay', () => {
    const onSelect = jest.fn();
    render(
      <CustomSelectField
        placeholder="Select category"
        options={options}
        onSelect={onSelect}
        testID="category-field"
      />,
    );

    fireEvent.press(screen.getByTestId('category-field'));
    fireEvent.press(screen.getByText('Instagram Reels'));

    expect(onSelect).toHaveBeenCalledWith('instagram-reels');
    expect(screen.queryByText('TikTok Video')).toBeNull();
  });

  test('closes without selecting when the backdrop is pressed', () => {
    const onSelect = jest.fn();
    render(
      <CustomSelectField
        placeholder="Select category"
        options={options}
        onSelect={onSelect}
        testID="category-field"
      />,
    );

    fireEvent.press(screen.getByTestId('category-field'));
    fireEvent.press(screen.getByTestId('category-field-backdrop'));

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByText('Instagram Reels')).toBeNull();
  });

  test('renders the overlay heading from the title prop', () => {
    render(
      <CustomSelectField
        label="Category"
        title="Choose a category"
        placeholder="Select category"
        options={options}
        onSelect={jest.fn()}
        testID="category-field"
      />,
    );

    fireEvent.press(screen.getByTestId('category-field'));
    expect(screen.getByText('Choose a category')).not.toBeNull();
  });
});
