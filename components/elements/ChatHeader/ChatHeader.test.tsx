import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ChatHeader from './ChatHeader';

const avatar = { uri: 'https://example.com/avatar.png' };

describe('<ChatHeader />', () => {
  test('renders the name and online status', () => {
    render(<ChatHeader avatar={avatar} name="Kathryn Murphy" online />);
    expect(screen.getByText('Kathryn Murphy')).not.toBeNull();
    expect(screen.getByText('Online')).not.toBeNull();
  });

  test('shows Offline when not online', () => {
    render(<ChatHeader avatar={avatar} name="Arlene McCoy" />);
    expect(screen.getByText('Offline')).not.toBeNull();
  });

  test('calls onBack when the back button is tapped', () => {
    const onBack = jest.fn();
    render(<ChatHeader avatar={avatar} name="Robert Fox" onBack={onBack} />);
    fireEvent.press(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
