import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import ImageUploader from './ImageUploader';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

describe('<ImageUploader />', () => {
  test('renders the empty drop-zone copy when no image is set', () => {
    render(<ImageUploader onChange={jest.fn()} />);
    expect(screen.getByText('Tap to upload images or video')).not.toBeNull();
  });

  test('renders the preview and Change Image button when an image is set', () => {
    render(<ImageUploader imageUri="file:///photo.jpg" onChange={jest.fn()} />);
    expect(screen.getByText('Change Image')).not.toBeNull();
  });

  test('calls onChange with the picked image uri', async () => {
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({
      granted: true,
    } as ImagePicker.MediaLibraryPermissionResponse);
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    } as ImagePicker.ImagePickerResult);
    const onChange = jest.fn();
    render(<ImageUploader onChange={onChange} testID="uploader" />);

    fireEvent.press(screen.getByTestId('uploader'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('file:///photo.jpg'));
  });
});
