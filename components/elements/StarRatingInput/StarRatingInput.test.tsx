import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import StarRatingInput, { ratingText } from './StarRatingInput';

function accessibilityAction(actionName: 'increment' | 'decrement') {
  fireEvent(screen.getByTestId('rating'), 'accessibilityAction', { nativeEvent: { actionName } });
}

describe('<StarRatingInput />', () => {
  test('the left half of a star sets n - 0.5, the right half n', () => {
    const onChange = jest.fn();
    render(<StarRatingInput value={null} onChange={onChange} testID="rating" />);

    fireEvent.press(screen.getByTestId('rating-2.5'));
    expect(onChange).toHaveBeenLastCalledWith(2.5);
    fireEvent.press(screen.getByTestId('rating-3'));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  test('is one adjustable control whose value text follows the rating', () => {
    const { rerender } = render(
      <StarRatingInput value={null} onChange={jest.fn()} testID="rating" />,
    );
    const control = screen.getByTestId('rating');
    expect(control.props.accessibilityRole).toBe('adjustable');
    expect(control.props.accessibilityValue).toEqual({
      min: 0,
      max: 5,
      now: 0,
      text: 'No rating',
    });

    rerender(<StarRatingInput value={4.5} onChange={jest.fn()} testID="rating" />);
    expect(screen.getByTestId('rating').props.accessibilityValue.text).toBe('4.5 out of 5 stars');
  });

  test('increment and decrement step by 0.5', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <StarRatingInput value={null} onChange={onChange} testID="rating" />,
    );
    accessibilityAction('increment');
    expect(onChange).toHaveBeenLastCalledWith(0.5);

    rerender(<StarRatingInput value={0.5} onChange={onChange} testID="rating" />);
    accessibilityAction('decrement');
    expect(onChange).toHaveBeenLastCalledWith(0);

    rerender(<StarRatingInput value={3} onChange={onChange} testID="rating" />);
    accessibilityAction('increment');
    expect(onChange).toHaveBeenLastCalledWith(3.5);
  });

  test('clamps to 0-5 and ignores decrement before a rating is picked', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <StarRatingInput value={null} onChange={onChange} testID="rating" />,
    );
    accessibilityAction('decrement');
    expect(onChange).not.toHaveBeenCalled();

    rerender(<StarRatingInput value={5} onChange={onChange} testID="rating" />);
    accessibilityAction('increment');
    expect(onChange).toHaveBeenLastCalledWith(5);

    rerender(<StarRatingInput value={0} onChange={onChange} testID="rating" />);
    accessibilityAction('decrement');
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  test('ignores taps and actions while disabled', () => {
    const onChange = jest.fn();
    render(<StarRatingInput value={2} onChange={onChange} disabled testID="rating" />);

    fireEvent.press(screen.getByTestId('rating-4'));
    accessibilityAction('increment');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('rating').props.accessibilityState).toEqual({ disabled: true });
  });

  test('ratingText', () => {
    expect(ratingText(null)).toBe('No rating');
    expect(ratingText(0)).toBe('0 out of 5 stars');
    expect(ratingText(3.5)).toBe('3.5 out of 5 stars');
  });
});
