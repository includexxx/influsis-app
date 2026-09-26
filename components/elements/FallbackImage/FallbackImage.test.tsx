import { test, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import FallbackImage, { getNameInitial } from './FallbackImage';

describe('<FallbackImage />', () => {
  test('renders the image when a source is given', () => {
    render(<FallbackImage source={{ uri: 'cover.png' }} name="Bkash" testID="img" />);
    expect(screen.getByTestId('img')).not.toBeNull();
    expect(screen.queryByText('B')).toBeNull();
  });

  test('renders the name initial when the source is null', () => {
    render(<FallbackImage source={null} name="bkash" testID="img" />);
    expect(screen.getByText('B')).not.toBeNull();
  });

  test('falls back to the name initial when the image fails to load', () => {
    render(<FallbackImage source={{ uri: 'broken.png' }} name="Daraz" testID="img" />);
    fireEvent(screen.getByTestId('img'), 'error', { nativeEvent: { error: 'not found' } });
    expect(screen.getByText('D')).not.toBeNull();
  });

  test('getNameInitial handles blank names', () => {
    expect(getNameInitial('  ')).toBe('?');
    expect(getNameInitial(' zed')).toBe('Z');
  });
});
