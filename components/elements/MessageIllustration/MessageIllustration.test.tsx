import { test, expect } from '@jest/globals';
import { render } from '@testing-library/react-native';
import MessageIllustration from './MessageIllustration';

describe('<MessageIllustration />', () => {
  test('renders the outer 107x107 circle', () => {
    const { getByTestId } = render(<MessageIllustration testID="message-illustration" />);
    const flatStyle = ([] as object[]).concat(getByTestId('message-illustration').props.style);
    const merged = Object.assign({}, ...flatStyle);
    expect(merged.width).toBe(107);
    expect(merged.height).toBe(107);
  });
});
