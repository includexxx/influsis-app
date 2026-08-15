import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ConversationCard from './ConversationCard';

const avatar = { uri: 'https://example.com/avatar.png' };

describe('<ConversationCard />', () => {
  test('renders name, preview, time and unread badge', () => {
    render(
      <ConversationCard
        avatar={avatar}
        name="Kathryn Murphy"
        lastMessage="Hi, nice to meet you. How can i..."
        time="5 min ago"
        unreadCount={2}
      />,
    );
    expect(screen.getByText('Kathryn Murphy')).not.toBeNull();
    expect(screen.getByText('Hi, nice to meet you. How can i...')).not.toBeNull();
    expect(screen.getByText('5 min ago')).not.toBeNull();
    expect(screen.getByText('2')).not.toBeNull();
  });

  test('omits the badge when unreadCount is not set', () => {
    render(
      <ConversationCard avatar={avatar} name="Arlene McCoy" lastMessage="Hey" time="1 min ago" />,
    );
    expect(screen.queryByText('0')).toBeNull();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <ConversationCard
        avatar={avatar}
        name="Robert Fox"
        lastMessage="Hey"
        time="1 min ago"
        onPress={onPress}
        testID="conversation-card"
      />,
    );
    fireEvent.press(screen.getByTestId('conversation-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
