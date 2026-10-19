import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import ItemUnavailable from './ItemUnavailable';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn() },
}));

const mocked = router as unknown as Record<'push' | 'back' | 'replace' | 'canGoBack', jest.Mock>;

beforeEach(() => {
  Object.values(mocked).forEach(fn => fn.mockReset());
});

describe('<ItemUnavailable />', () => {
  test('says the item is no longer available', () => {
    render(<ItemUnavailable />);
    expect(screen.getByText('This item is no longer available')).toBeTruthy();
    expect(
      screen.getByText('It may have been removed, or you no longer have access to it.'),
    ).toBeTruthy();
  });

  test('Go back goes back when there is somewhere to go', () => {
    mocked.canGoBack.mockReturnValue(true);
    render(<ItemUnavailable />);
    fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    expect(mocked.back).toHaveBeenCalled();
    expect(mocked.replace).not.toHaveBeenCalled();
  });

  test('Go back falls back to Home when the screen was opened directly', () => {
    mocked.canGoBack.mockReturnValue(false);
    render(<ItemUnavailable />);
    fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    expect(mocked.replace).toHaveBeenCalledWith('/home');
    expect(mocked.back).not.toHaveBeenCalled();
  });

  test('View notifications opens the notifications screen', () => {
    render(<ItemUnavailable />);
    fireEvent.press(screen.getByText('View notifications'));
    expect(mocked.push).toHaveBeenCalledWith('/notifications');
  });
});
