import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import FileUploadItem from './FileUploadItem';

describe('<FileUploadItem />', () => {
  test('renders the file name, size, and progress', () => {
    render(<FileUploadItem name="Image SVG" sizeLabel="200 KB" progress={100} />);
    expect(screen.getByText('Image SVG')).not.toBeNull();
    expect(screen.getByText('200 KB')).not.toBeNull();
    expect(screen.getByText('100%')).not.toBeNull();
  });

  test('clamps out-of-range progress values', () => {
    render(<FileUploadItem name="Image SVG" sizeLabel="200 KB" progress={150} />);
    expect(screen.getByText('100%')).not.toBeNull();
  });

  test('calls onToggleIncluded when the checkbox is tapped', () => {
    const onToggleIncluded = jest.fn();
    render(
      <FileUploadItem
        name="Image SVG"
        sizeLabel="200 KB"
        onToggleIncluded={onToggleIncluded}
        testID="file-item"
      />,
    );
    fireEvent.press(screen.getByTestId('file-item-checkbox'));
    expect(onToggleIncluded).toHaveBeenCalledTimes(1);
  });
});
