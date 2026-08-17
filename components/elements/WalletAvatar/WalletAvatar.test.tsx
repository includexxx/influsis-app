import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import WalletAvatar from './WalletAvatar';

const icon = { uri: 'icon.png' };

describe('<WalletAvatar />', () => {
  test('renders a 32px disc by default', () => {
    render(<WalletAvatar icon={icon} testID="avatar" />);
    const style = StyleSheet.flatten(screen.getByTestId('avatar').props.style);
    expect(style.width).toBe(32);
    expect(style.height).toBe(32);
  });

  test('honours a custom size', () => {
    render(<WalletAvatar icon={icon} size={48} testID="avatar" />);
    expect(StyleSheet.flatten(screen.getByTestId('avatar').props.style).width).toBe(48);
  });
});
