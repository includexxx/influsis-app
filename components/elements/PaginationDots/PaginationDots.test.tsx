import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import PaginationDots from './PaginationDots';

describe('<PaginationDots />', () => {
  test('renders one dot per count, with the active dot wider', () => {
    render(<PaginationDots count={3} activeIndex={1} />);
    expect(screen.getByTestId('pagination-dot-0')).not.toBeNull();
    expect(screen.getByTestId('pagination-dot-2')).not.toBeNull();
    expect(screen.getByTestId('pagination-dot-1').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 30 })]),
    );
  });
});
