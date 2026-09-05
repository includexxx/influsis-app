import { test, expect } from '@jest/globals';
import { render } from '@testing-library/react-native';
import SearchIllustration from './SearchIllustration';

describe('<SearchIllustration />', () => {
  test('renders the outer 107x107 circle', () => {
    const { getByTestId } = render(<SearchIllustration testID="search-illustration" />);
    const flatStyle = ([] as object[]).concat(getByTestId('search-illustration').props.style);
    const merged = Object.assign({}, ...flatStyle);
    expect(merged.width).toBe(107);
    expect(merged.height).toBe(107);
  });
});
