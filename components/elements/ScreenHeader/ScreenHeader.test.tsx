import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ScreenHeader from './ScreenHeader';

describe('<ScreenHeader />', () => {
  test('renders the title', () => {
    render(<ScreenHeader title="Notification" />);
    expect(screen.getByText('Notification')).not.toBeNull();
  });

  test('does not render a back button when onBack is omitted', () => {
    render(<ScreenHeader title="Notification" />);
    expect(screen.queryByLabelText('Go back')).toBeNull();
  });

  test('calls onBack when the back button is pressed', () => {
    const onBack = jest.fn();
    render(<ScreenHeader title="Notification" onBack={onBack} />);
    fireEvent.press(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
