import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import InAppBanner from './InAppBanner';

describe('<InAppBanner />', () => {
  test('shows the title and body', () => {
    render(
      <InAppBanner
        title="Offer accepted"
        body="Terms are locked at ৳5,000."
        onPress={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    expect(screen.getByText('Offer accepted')).toBeTruthy();
    expect(screen.getByText('Terms are locked at ৳5,000.')).toBeTruthy();
  });

  test('pressing the banner calls onPress; it is labelled for screen readers', () => {
    const onPress = jest.fn();
    render(
      <InAppBanner
        title="Offer accepted"
        body="Terms locked."
        onPress={onPress}
        onDismiss={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByLabelText('Offer accepted. Terms locked.'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('the close button calls onDismiss, not onPress', () => {
    const onPress = jest.fn();
    const onDismiss = jest.fn();
    render(<InAppBanner title="Offer accepted" body="" onPress={onPress} onDismiss={onDismiss} />);
    fireEvent.press(screen.getByLabelText('Dismiss notification'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });
});
