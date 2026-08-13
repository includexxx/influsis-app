import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import CircleAvatar from './CircleAvatar';

const source = { uri: 'avatar.png' };

describe('<CircleAvatar />', () => {
  test('renders with a fully-rounded border radius', () => {
    const { getByTestId } = render(<CircleAvatar source={source} size={80} testID="avatar" />);
    const flatStyle = ([] as object[]).concat(getByTestId('avatar').props.style);
    const merged = Object.assign({}, ...flatStyle);
    expect(merged.width).toBe(80);
    expect(merged.height).toBe(80);
    expect(merged.borderRadius).toBe(40);
  });

  test('renders no label by default', () => {
    render(<CircleAvatar source={source} testID="avatar" />);
    expect(screen.queryByText(/./)).toBeNull();
  });

  test('renders a label below the circle when given', () => {
    render(<CircleAvatar source={source} label="Bkash" testID="avatar" />);
    expect(screen.getByText('Bkash')).not.toBeNull();
  });
});
