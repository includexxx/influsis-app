import { describe, expect, jest, test } from '@jest/globals';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import HomeGreeting from './HomeGreeting';
import QuickActions, { QUICK_ACTION_TINTS } from './QuickActions';
import AvatarTile from './AvatarTile';

describe('<HomeGreeting />', () => {
  test('greets by time of day and name', () => {
    render(<HomeGreeting name="Rafi" now={new Date(2026, 9, 5, 9, 0)} />);
    expect(screen.getByText('Good morning 👋')).toBeTruthy();
    expect(screen.getByText('Rafi')).toBeTruthy();
  });
});

describe('<QuickActions />', () => {
  test('renders a labelled button per action and calls it', () => {
    const onApplications = jest.fn();
    const onWork = jest.fn();
    render(
      <QuickActions
        actions={[
          {
            key: 'applications',
            label: 'Applications',
            icon: 'send',
            tint: QUICK_ACTION_TINTS.primary,
            onPress: onApplications,
          },
          {
            key: 'work',
            label: 'My work',
            icon: 'briefcase',
            tint: QUICK_ACTION_TINTS.navy,
            onPress: onWork,
          },
        ]}
      />,
    );

    fireEvent.press(screen.getByLabelText('My work'));
    expect(onWork).toHaveBeenCalledTimes(1);
    expect(onApplications).not.toHaveBeenCalled();
    expect(screen.getByText('Applications')).toBeTruthy();
  });
});

describe('<AvatarTile />', () => {
  test('shows the name, announces verification and handles presses', () => {
    const onPress = jest.fn();
    render(
      <AvatarTile
        avatar={<Text>avatar</Text>}
        name="Pathao Ltd."
        verified
        onPress={onPress}
        testID="tile"
      />,
    );

    expect(screen.getByText('Pathao Ltd.')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Pathao Ltd., verified'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('an unverified tile is labelled by name only', () => {
    render(<AvatarTile avatar={<Text>avatar</Text>} name="Dhaka Delights" />);
    expect(screen.getByLabelText('Dhaka Delights')).toBeTruthy();
  });
});
