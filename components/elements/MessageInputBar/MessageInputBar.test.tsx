import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import MessageInputBar from './MessageInputBar';

describe('<MessageInputBar />', () => {
  test('renders the current value and placeholder', () => {
    render(<MessageInputBar value="Hello" onChangeText={jest.fn()} onSend={jest.fn()} />);
    expect(screen.getByDisplayValue('Hello')).not.toBeNull();
    expect(screen.getByPlaceholderText('Type your message')).not.toBeNull();
  });

  test('calls onChangeText when typing', () => {
    const onChangeText = jest.fn();
    render(<MessageInputBar value="" onChangeText={onChangeText} onSend={jest.fn()} />);
    fireEvent.changeText(screen.getByPlaceholderText('Type your message'), 'Hi');
    expect(onChangeText).toHaveBeenCalledWith('Hi');
  });

  test('calls onSend when the send button is tapped', () => {
    const onSend = jest.fn();
    render(<MessageInputBar value="Hi" onChangeText={jest.fn()} onSend={onSend} />);
    fireEvent.press(screen.getByLabelText('Send message'));
    expect(onSend).toHaveBeenCalledTimes(1);
  });
});
