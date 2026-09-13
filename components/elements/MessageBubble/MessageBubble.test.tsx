import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import MessageBubble from './MessageBubble';

describe('<MessageBubble />', () => {
  test('renders the message text and time', () => {
    render(<MessageBubble sender="them" text="Hi there" time="4:26 Am" />);
    expect(screen.getByText('Hi there')).not.toBeNull();
    expect(screen.getByText('4:26 Am')).not.toBeNull();
  });

  test('right-aligns messages sent by me', () => {
    render(<MessageBubble sender="me" text="Thanks!" time="5:22 Am" testID="bubble" />);
    const flatStyle = ([] as object[]).concat(screen.getByTestId('bubble').props.style);
    const merged = Object.assign({}, ...flatStyle);
    expect(merged.alignSelf).toBe('flex-end');
  });

  test('left-aligns messages received from them', () => {
    render(<MessageBubble sender="them" text="Hi" time="4:26 Am" testID="bubble" />);
    const flatStyle = ([] as object[]).concat(screen.getByTestId('bubble').props.style);
    const merged = Object.assign({}, ...flatStyle);
    expect(merged.alignSelf).toBe('flex-start');
  });
});
