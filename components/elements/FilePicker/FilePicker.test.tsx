import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import FilePicker from './FilePicker';

describe('<FilePicker />', () => {
  test('renders the default copy', () => {
    render(<FilePicker />);
    expect(screen.getByText('Tap to upload images or video')).not.toBeNull();
  });

  test('renders custom label and helper text', () => {
    render(<FilePicker label="Add a file" helperText="PDF up to 10MB" />);
    expect(screen.getByText('Add a file')).not.toBeNull();
    expect(screen.getByText('PDF up to 10MB')).not.toBeNull();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<FilePicker onPress={onPress} testID="file-picker" />);
    fireEvent.press(screen.getByTestId('file-picker'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
