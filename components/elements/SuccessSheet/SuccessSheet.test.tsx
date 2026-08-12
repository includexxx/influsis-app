import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SuccessSheet from './SuccessSheet';

// BottomSheet's native path mounts @gorhom/bottom-sheet, whose internals are
// incompatible with react-native-reanimated's jest mock (see jest.setup.js).
// Force the plain-View web fallback so this test exercises real render
// output instead of a library internals crash unrelated to this component.
jest.mock('@/utils/deviceInfo', () => ({
  ...(jest.requireActual('@/utils/deviceInfo') as typeof import('@/utils/deviceInfo')),
  isWeb: true,
}));

describe('<SuccessSheet />', () => {
  test('renders title, description and button label', () => {
    render(
      <SuccessSheet
        title="Reset Succesfully"
        description="Please re-login to get started"
        buttonLabel="Log in"
        onButtonPress={() => {}}
      />,
    );
    expect(screen.getByText('Reset Succesfully')).not.toBeNull();
    expect(screen.getByText('Please re-login to get started')).not.toBeNull();
    expect(screen.getByText('Log in')).not.toBeNull();
  });

  test('calls onButtonPress when the CTA is pressed', () => {
    const onButtonPress = jest.fn();
    render(
      <SuccessSheet
        title="Account Created Successfully"
        description="Enjoy your Experience"
        buttonLabel="Next"
        onButtonPress={onButtonPress}
      />,
    );
    fireEvent.press(screen.getByText('Next'));
    expect(onButtonPress).toHaveBeenCalledTimes(1);
  });
});
