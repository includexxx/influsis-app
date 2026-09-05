import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SearchBar from './SearchBar';

describe('<SearchBar />', () => {
  test('renders the placeholder', () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText('Search your campaign')).not.toBeNull();
  });

  test('calls onChangeText when editable and typed into', () => {
    const onChangeText = jest.fn();
    render(<SearchBar value="" onChangeText={onChangeText} testID="search-input" />);
    fireEvent.changeText(screen.getByTestId('search-input'), 'Summer');
    expect(onChangeText).toHaveBeenCalledWith('Summer');
  });

  test('calls onPress instead of allowing typing when not editable', () => {
    const onPress = jest.fn();
    const onChangeText = jest.fn();
    render(
      <SearchBar
        editable={false}
        onPress={onPress}
        onChangeText={onChangeText}
        testID="search-trigger"
      />,
    );
    fireEvent.press(screen.getByTestId('search-trigger'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
