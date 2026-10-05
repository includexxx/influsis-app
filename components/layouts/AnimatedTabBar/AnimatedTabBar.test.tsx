import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import AnimatedTabBar from './AnimatedTabBar';

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(() => Promise.resolve()) }));

const ROUTES = ['home', 'order', 'create', 'message', 'profile', 'search', 'ballance'].map(
  name => ({ key: `${name}-key`, name, params: undefined }),
);

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const emit = jest.fn((_event: { type: string; target?: string }) => ({ defaultPrevented: false }));
const navigate = jest.fn();

function renderBar(focused: string) {
  const props = {
    state: { index: ROUTES.findIndex(route => route.name === focused), routes: ROUTES },
    navigation: { emit, navigate },
    descriptors: {},
    insets: metrics.insets,
  } as unknown as BottomTabBarProps;
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <AnimatedTabBar {...props} />
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  emit.mockClear();
  emit.mockImplementation(() => ({ defaultPrevented: false }));
  navigate.mockClear();
});

describe('<AnimatedTabBar />', () => {
  test('renders the five main tabs and no button for hidden routes', () => {
    renderBar('home');
    for (const label of ['Home', 'Order', 'Create Gig', 'Message', 'Profile']) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    expect(screen.queryByTestId('main-tab-search')).toBeNull();
    expect(screen.queryByTestId('main-tab-ballance')).toBeNull();
  });

  test('marks only the focused tab as selected', () => {
    renderBar('message');
    expect(screen.getByTestId('main-tab-message').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId('main-tab-home').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  test('raises the active tab into the circle with its label once laid out', () => {
    renderBar('order');
    expect(screen.queryByTestId('main-tab-active-circle')).toBeNull();

    fireEvent(screen.getByTestId('main-tab-row'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 70 } },
    });

    expect(screen.getByTestId('main-tab-active-circle')).toBeTruthy();
    expect(screen.getByTestId('main-tab-active-label').props.children).toBe('Order');
  });

  test('shows no raised tab on a screen without a tab button', () => {
    renderBar('search');
    fireEvent(screen.getByTestId('main-tab-row'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 70 } },
    });
    expect(screen.queryByTestId('main-tab-active-circle')).toBeNull();
  });

  test('pressing another tab emits tabPress and navigates', () => {
    renderBar('home');
    fireEvent.press(screen.getByTestId('main-tab-profile'));
    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'tabPress', target: 'profile-key' }),
    );
    expect(navigate).toHaveBeenCalledWith('profile', undefined);
  });

  test('pressing the focused tab does not navigate again', () => {
    renderBar('home');
    fireEvent.press(screen.getByTestId('main-tab-home'));
    expect(emit).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  test('Create Gig is a regular tab that opens the wizard', () => {
    renderBar('home');
    fireEvent.press(screen.getByTestId('main-tab-create'));
    expect(navigate).toHaveBeenCalledWith('create', undefined);
  });

  test('a prevented tabPress does not navigate', () => {
    emit.mockImplementation(() => ({ defaultPrevented: true }));
    renderBar('home');
    fireEvent.press(screen.getByTestId('main-tab-message'));
    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'tabPress', target: 'message-key' }),
    );
    expect(navigate).not.toHaveBeenCalled();
  });
});
