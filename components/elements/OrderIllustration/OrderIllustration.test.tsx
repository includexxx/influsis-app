import { test, expect } from '@jest/globals';
import { render } from '@testing-library/react-native';
import OrderIllustration from './OrderIllustration';

describe('<OrderIllustration />', () => {
  test('renders the outer 107x107 circle', () => {
    const { getByTestId } = render(<OrderIllustration testID="order-illustration" />);
    const flatStyle = ([] as object[]).concat(getByTestId('order-illustration').props.style);
    const merged = Object.assign({}, ...flatStyle);
    expect(merged.width).toBe(107);
    expect(merged.height).toBe(107);
  });
});
