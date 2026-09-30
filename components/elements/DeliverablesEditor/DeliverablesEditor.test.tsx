import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import DeliverablesEditor, { DeliverablesEditorItem } from './DeliverablesEditor';

const items: DeliverablesEditorItem[] = [
  { key: 'instagram:reels', label: 'Instagram Reels', count: 2 },
  { key: 'tiktok:video', label: 'TikTok Video', count: 1 },
];

function renderEditor(overrides: Partial<Parameters<typeof DeliverablesEditor>[0]> = {}) {
  const props = {
    items,
    onCountChange: jest.fn(),
    onRemove: jest.fn(),
    onAddPress: jest.fn(),
    ...overrides,
  };
  render(<DeliverablesEditor {...props} />);
  return props;
}

describe('<DeliverablesEditor />', () => {
  test('renders one row per deliverable with its count', () => {
    renderEditor();
    expect(screen.getByText('Instagram Reels')).not.toBeNull();
    expect(screen.getByText('TikTok Video')).not.toBeNull();
    expect(screen.getByText('2')).not.toBeNull();
  });

  test('+ and - report the next count for that row', () => {
    const props = renderEditor();
    fireEvent.press(screen.getByLabelText('Increase Instagram Reels'));
    fireEvent.press(screen.getByLabelText('Decrease Instagram Reels'));
    expect(props.onCountChange).toHaveBeenNthCalledWith(1, 0, 3);
    expect(props.onCountChange).toHaveBeenNthCalledWith(2, 0, 1);
  });

  test('clamps at min and max', () => {
    const props = renderEditor({
      items: [
        { key: 'a', label: 'At min', count: 1 },
        { key: 'b', label: 'At max', count: 50 },
      ],
    });
    fireEvent.press(screen.getByLabelText('Decrease At min'));
    fireEvent.press(screen.getByLabelText('Increase At max'));
    expect(props.onCountChange).not.toHaveBeenCalled();
  });

  test('remove reports the row index', () => {
    const props = renderEditor();
    fireEvent.press(screen.getByLabelText('Remove TikTok Video'));
    expect(props.onRemove).toHaveBeenCalledWith(1);
  });

  test('"Add deliverable" asks the scene to open its picker', () => {
    const props = renderEditor();
    fireEvent.press(screen.getByText('Add deliverable'));
    expect(props.onAddPress).toHaveBeenCalledTimes(1);
  });

  test('"Add deliverable" does nothing while disabled', () => {
    const props = renderEditor({ addDisabled: true });
    fireEvent.press(screen.getByText('Add deliverable'));
    expect(props.onAddPress).not.toHaveBeenCalled();
  });

  test('shows the empty state, row errors and the list error', () => {
    renderEditor({ items: [], error: 'Add at least one deliverable.' });
    expect(screen.getAllByText('Add at least one deliverable.')).toHaveLength(2);

    renderEditor({ rowErrors: { 1: 'This deliverable is already in the list.' } });
    expect(screen.getByText('This deliverable is already in the list.')).not.toBeNull();
  });
});
