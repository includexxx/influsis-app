import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CountryCodeSheet from './CountryCodeSheet';

// See OptionSheet.test.tsx: BottomSheet's native path mounts
// @gorhom/bottom-sheet, whose internals are incompatible with
// react-native-reanimated's jest mock. Force the plain-View web fallback.
jest.mock('@/utils/deviceInfo', () => ({
  ...(jest.requireActual('@/utils/deviceInfo') as typeof import('@/utils/deviceInfo')),
  isWeb: true,
}));

const options = [
  {
    code: 'us',
    country: 'United States',
    dialCode: '+1',
    flag: 'https://example.com/us.svg',
  },
  {
    code: 'gb',
    country: 'United Kingdom',
    dialCode: '+44',
    flag: 'https://example.com/gb.svg',
  },
  {
    code: 'bd',
    country: 'Bangladesh',
    dialCode: '+880',
    flag: 'https://example.com/bd.svg',
  },
];

describe('<CountryCodeSheet />', () => {
  test('renders every country with its dial code', () => {
    render(<CountryCodeSheet options={options} onSelect={jest.fn()} />);
    expect(screen.getByText('Bangladesh')).not.toBeNull();
    expect(screen.getByText('+880')).not.toBeNull();
    expect(screen.getByText('United Kingdom')).not.toBeNull();
  });

  test('filters by country name', () => {
    render(<CountryCodeSheet options={options} onSelect={jest.fn()} />);
    fireEvent.changeText(screen.getByTestId('country-code-search'), 'bang');
    expect(screen.getByText('Bangladesh')).not.toBeNull();
    expect(screen.queryByText('United States')).toBeNull();
  });

  test('filters by dial code, with or without the leading plus', () => {
    render(<CountryCodeSheet options={options} onSelect={jest.fn()} />);
    fireEvent.changeText(screen.getByTestId('country-code-search'), '880');
    expect(screen.getByText('Bangladesh')).not.toBeNull();
    expect(screen.queryByText('United Kingdom')).toBeNull();

    fireEvent.changeText(screen.getByTestId('country-code-search'), '+44');
    expect(screen.getByText('United Kingdom')).not.toBeNull();
    expect(screen.queryByText('Bangladesh')).toBeNull();
  });

  test('shows an empty state when nothing matches', () => {
    render(<CountryCodeSheet options={options} onSelect={jest.fn()} />);
    fireEvent.changeText(screen.getByTestId('country-code-search'), 'zzz');
    expect(screen.getByText('No country found')).not.toBeNull();
  });

  test('calls onSelect with the tapped country code', () => {
    const onSelect = jest.fn();
    render(<CountryCodeSheet options={options} onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId('country-code-gb'));
    expect(onSelect).toHaveBeenCalledWith('gb');
  });

  test('marks the selected country', () => {
    render(<CountryCodeSheet options={options} value="bd" onSelect={jest.fn()} />);
    expect(screen.getByTestId('country-code-bd').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('country-code-us').props.accessibilityState.selected).toBe(false);
  });
});
