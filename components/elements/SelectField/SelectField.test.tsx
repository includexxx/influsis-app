import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SelectField from './SelectField';

// See SuccessSheet.test.tsx: BottomSheet's native path mounts
// @gorhom/bottom-sheet, whose internals are incompatible with
// react-native-reanimated's jest mock. Force the plain-View web fallback.
jest.mock('@/utils/deviceInfo', () => ({
  ...(jest.requireActual('@/utils/deviceInfo') as typeof import('@/utils/deviceInfo')),
  isWeb: true,
}));

const options = [
  { label: 'Instagram Reels', value: 'instagram-reels' },
  { label: 'TikTok Video', value: 'tiktok-video' },
];

describe('<SelectField />', () => {
  test('renders the placeholder when no value is selected', () => {
    render(<SelectField placeholder="Select category" options={options} onSelect={jest.fn()} />);
    expect(screen.getByText('Select category')).not.toBeNull();
  });

  test('renders the selected option label', () => {
    render(
      <SelectField
        placeholder="Select category"
        value="tiktok-video"
        options={options}
        onSelect={jest.fn()}
      />,
    );
    expect(screen.getByText('TikTok Video')).not.toBeNull();
  });

  test('calls onSelect with the tapped option value', () => {
    const onSelect = jest.fn();
    render(
      <SelectField
        placeholder="Select category"
        options={options}
        onSelect={onSelect}
        testID="category-field"
      />,
    );
    fireEvent.press(screen.getByTestId('category-field'));
    fireEvent.press(screen.getByText('Instagram Reels'));
    expect(onSelect).toHaveBeenCalledWith('instagram-reels');
  });
});
