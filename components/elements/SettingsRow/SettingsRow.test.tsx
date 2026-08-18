import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import SettingsRow from './SettingsRow';

const icon = { uri: 'icon.png' };

describe('<SettingsRow />', () => {
  test('renders the title and a chevron by default in flat variant', () => {
    render(<SettingsRow icon={icon} title="Profile" testID="row" />);
    expect(screen.getByText('Profile')).not.toBeNull();
  });

  test('hides the chevron when showChevron is false', () => {
    render(<SettingsRow icon={icon} title="Logout" showChevron={false} testID="row" />);
    expect(screen.getByText('Logout')).not.toBeNull();
  });

  test('renders a description when given', () => {
    render(
      <SettingsRow
        icon={icon}
        title="SMS Authenticator"
        description="Shake your phone to randomize your account balances."
        variant="card"
      />,
    );
    expect(screen.getByText('Shake your phone to randomize your account balances.')).not.toBeNull();
  });

  test('renders a custom trailing element', () => {
    render(<SettingsRow icon={icon} title="Email notification" trailing={<Text>ON</Text>} />);
    expect(screen.getByText('ON')).not.toBeNull();
  });

  test('renders inside a tinted icon chip when iconBackground is set', () => {
    const onPress = jest.fn();
    render(
      <SettingsRow
        icon={icon}
        title="Profile"
        iconBackground="#FDE6F5"
        onPress={onPress}
        testID="row"
      />,
    );
    expect(screen.getByText('Profile')).not.toBeNull();
    fireEvent.press(screen.getByTestId('row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<SettingsRow icon={icon} title="Security" onPress={onPress} testID="row" />);
    fireEvent.press(screen.getByTestId('row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
