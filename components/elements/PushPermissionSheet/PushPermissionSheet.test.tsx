import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import PushPermissionSheet from './PushPermissionSheet';

// See OptionSheet.test.tsx: force BottomSheet's plain-View web fallback.
jest.mock('@/utils/deviceInfo', () => ({
  ...(jest.requireActual('@/utils/deviceInfo') as typeof import('@/utils/deviceInfo')),
  isWeb: true,
}));

describe('<PushPermissionSheet />', () => {
  test('explains the value before asking', () => {
    render(<PushPermissionSheet onTurnOn={jest.fn()} onNotNow={jest.fn()} />);
    expect(screen.getByText('Turn on notifications?')).toBeTruthy();
    expect(
      screen.getByText(
        'Get a heads-up when a business invites you, replies to your request or accepts your offer, even when Influsis is closed.',
      ),
    ).toBeTruthy();
  });

  test('Turn on and Not now call their handlers', () => {
    const onTurnOn = jest.fn();
    const onNotNow = jest.fn();
    render(<PushPermissionSheet onTurnOn={onTurnOn} onNotNow={onNotNow} />);

    fireEvent.press(screen.getByText('Turn on'));
    fireEvent.press(screen.getByText('Not now'));

    expect(onTurnOn).toHaveBeenCalledTimes(1);
    expect(onNotNow).toHaveBeenCalledTimes(1);
  });

  test.each<['unavailable' | 'settings', string]>([
    ['unavailable', 'Push unavailable on this device'],
    ['settings', 'You can turn notifications on later in your phone settings'],
  ])('the %s status line', (status, text) => {
    render(<PushPermissionSheet status={status} onTurnOn={jest.fn()} onNotNow={jest.fn()} />);
    expect(screen.getByText(text)).toBeTruthy();
  });

  test('no status line by default', () => {
    render(<PushPermissionSheet onTurnOn={jest.fn()} onNotNow={jest.fn()} />);
    expect(screen.queryByText('Push unavailable on this device')).toBeNull();
  });
});
