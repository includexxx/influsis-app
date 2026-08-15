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

  test('renders the rounded variant shorter and squarer than the pill', () => {
    // Walk up from the input to the styled root - the only ancestor
    // carrying the variant's height/borderRadius.
    const rootStyleOf = (variant: 'pill' | 'rounded') => {
      const { getByPlaceholderText, unmount } = render(
        <SearchBar variant={variant} placeholder={variant} />,
      );
      let node = getByPlaceholderText(variant).parent;
      let merged: Record<string, unknown> = {};
      while (node) {
        merged = Object.assign({}, ...([] as object[]).concat(node.props.style ?? {}));
        if (merged.height) break;
        node = node.parent;
      }
      unmount();
      return merged;
    };
    expect(rootStyleOf('pill').height).toBe(54);
    expect(rootStyleOf('pill').borderRadius).toBe(67);
    expect(rootStyleOf('rounded').height).toBe(50);
    expect(rootStyleOf('rounded').borderRadius).toBe(8);
  });
});
