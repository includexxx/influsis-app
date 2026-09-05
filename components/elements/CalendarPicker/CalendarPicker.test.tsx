import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CalendarPicker from './CalendarPicker';

// See SuccessSheet.test.tsx: BottomSheet's native path mounts
// @gorhom/bottom-sheet, whose internals are incompatible with
// react-native-reanimated's jest mock. Force the plain-View web fallback.
jest.mock('@/utils/deviceInfo', () => ({
  ...(jest.requireActual('@/utils/deviceInfo') as typeof import('@/utils/deviceInfo')),
  isWeb: true,
}));

describe('<CalendarPicker />', () => {
  test('renders the month and year for the given value', () => {
    render(<CalendarPicker value={new Date(2023, 7, 17)} onSelect={() => {}} />);
    expect(screen.getByText('Aug')).not.toBeNull();
    expect(screen.getByText('2023')).not.toBeNull();
  });

  test('calls onSelect with the tapped date', () => {
    const onSelect = jest.fn();
    render(<CalendarPicker value={new Date(2023, 7, 17)} onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId('calendar-day-2023-08-17'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    const calledWith = onSelect.mock.calls[0][0] as Date;
    expect(calledWith.getDate()).toBe(17);
    expect(calledWith.getMonth()).toBe(7);
  });

  test('navigates to the previous month', () => {
    render(<CalendarPicker value={new Date(2023, 7, 17)} onSelect={() => {}} />);
    fireEvent.press(screen.getByLabelText('Previous month'));
    expect(screen.getByText('Jul')).not.toBeNull();
  });
});
