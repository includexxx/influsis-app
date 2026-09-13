import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ConfirmDialog from './ConfirmDialog';

describe('<ConfirmDialog />', () => {
  test('renders the title, primary and secondary labels', () => {
    render(
      <ConfirmDialog
        title="Are you sure you want to logout?"
        primaryLabel="Cancel"
        onPrimaryPress={jest.fn()}
        secondaryLabel="Log Out"
        onSecondaryPress={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText('Are you sure you want to logout?')).not.toBeNull();
    expect(screen.getByText('Cancel')).not.toBeNull();
    expect(screen.getByText('Log Out')).not.toBeNull();
  });

  test('calls onPrimaryPress when the primary button is tapped', () => {
    const onPrimaryPress = jest.fn();
    render(
      <ConfirmDialog
        title="Title"
        primaryLabel="Cancel"
        onPrimaryPress={onPrimaryPress}
        secondaryLabel="Log Out"
        onSecondaryPress={jest.fn()}
        onClose={jest.fn()}
        testID="confirm-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId('confirm-dialog-primary'));
    expect(onPrimaryPress).toHaveBeenCalledTimes(1);
  });

  test('calls onSecondaryPress when the secondary link is tapped', () => {
    const onSecondaryPress = jest.fn();
    render(
      <ConfirmDialog
        title="Title"
        primaryLabel="Cancel"
        onPrimaryPress={jest.fn()}
        secondaryLabel="Log Out"
        onSecondaryPress={onSecondaryPress}
        onClose={jest.fn()}
        testID="confirm-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId('confirm-dialog-secondary'));
    expect(onSecondaryPress).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when the close button is tapped', () => {
    const onClose = jest.fn();
    render(
      <ConfirmDialog
        title="Title"
        primaryLabel="Cancel"
        onPrimaryPress={jest.fn()}
        secondaryLabel="Log Out"
        onSecondaryPress={jest.fn()}
        onClose={onClose}
        testID="confirm-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId('confirm-dialog-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
