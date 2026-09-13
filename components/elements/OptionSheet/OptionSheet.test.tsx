import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import OptionSheet from './OptionSheet';

// See SuccessSheet.test.tsx: BottomSheet's native path mounts
// @gorhom/bottom-sheet, whose internals are incompatible with
// react-native-reanimated's jest mock. Force the plain-View web fallback.
jest.mock('@/utils/deviceInfo', () => ({
  ...(jest.requireActual('@/utils/deviceInfo') as typeof import('@/utils/deviceInfo')),
  isWeb: true,
}));

const options = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

describe('<OptionSheet />', () => {
  test('renders every option label', () => {
    render(<OptionSheet options={options} onSelect={jest.fn()} />);
    expect(screen.getByText('Male')).not.toBeNull();
    expect(screen.getByText('Female')).not.toBeNull();
  });

  test('renders a leading icon only for options that have one', () => {
    render(
      <OptionSheet
        options={[
          { label: 'Bangladesh', value: 'bd', icon: { uri: 'https://example.com/bd.svg' } },
          { label: 'Canada', value: 'ca' },
        ]}
        onSelect={jest.fn()}
      />,
    );
    expect(screen.getByTestId('option-icon-bd')).not.toBeNull();
    expect(screen.queryByTestId('option-icon-ca')).toBeNull();
  });

  test('calls onSelect with the tapped option value', () => {
    const onSelect = jest.fn();
    render(<OptionSheet options={options} onSelect={onSelect} />);
    fireEvent.press(screen.getByText('Female'));
    expect(onSelect).toHaveBeenCalledWith('female');
  });
});
