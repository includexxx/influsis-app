import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import ViewModeToggle from './ViewModeToggle';

describe('<ViewModeToggle />', () => {
  test('marks the current mode and reports a change', () => {
    const onChange = jest.fn();
    render(<ViewModeToggle value="stack" onChange={onChange} testIDPrefix="list" />);

    expect(screen.getByLabelText('Stack view').props.accessibilityState).toEqual({
      checked: true,
    });
    expect(screen.getByTestId('list-grid').props.accessibilityState).toEqual({ checked: false });

    fireEvent.press(screen.getByLabelText('Grid view'));
    expect(onChange).toHaveBeenCalledWith('grid');
  });
});
