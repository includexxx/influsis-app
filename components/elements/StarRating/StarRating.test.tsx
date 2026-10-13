import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import StarRating from './StarRating';

const icon = { uri: 'star.png' };

describe('<StarRating />', () => {
  test('renders the label when given', () => {
    render(<StarRating rating={4.5} maxStars={1} icon={icon} label="4.5" />);
    expect(screen.getByText('4.5')).not.toBeNull();
  });

  test('renders no label when omitted', () => {
    render(<StarRating rating={5} maxStars={5} icon={icon} />);
    expect(screen.queryByText(/./)).toBeNull();
  });

  test('renders whole stars for a whole rating', () => {
    render(<StarRating rating={4} icon={icon} />);
    expect(screen.getAllByTestId('star-full')).toHaveLength(4);
    expect(screen.queryByTestId('star-half')).toBeNull();
  });

  test('adds a half star for a half rating', () => {
    render(<StarRating rating={4.5} icon={icon} />);
    expect(screen.getAllByTestId('star-full')).toHaveLength(4);
    expect(screen.getByTestId('star-half')).not.toBeNull();
  });

  test('rounds to the nearest half', () => {
    render(<StarRating rating={2.3} icon={icon} />);
    expect(screen.getAllByTestId('star-full')).toHaveLength(2);
    expect(screen.getByTestId('star-half')).not.toBeNull();
  });

  test('renders no stars for 0', () => {
    render(<StarRating rating={0} icon={icon} />);
    expect(screen.queryByTestId('star-full')).toBeNull();
    expect(screen.queryByTestId('star-half')).toBeNull();
  });

  test('a single-star rating stays one full star', () => {
    render(<StarRating rating={4.5} maxStars={1} icon={icon} />);
    expect(screen.getAllByTestId('star-full')).toHaveLength(1);
    expect(screen.queryByTestId('star-half')).toBeNull();
  });

  test('renders without crashing at maxStars', () => {
    const { getByTestId } = render(
      <StarRating rating={5} maxStars={5} icon={icon} testID="rating" />,
    );
    expect(getByTestId('rating')).not.toBeNull();
  });
});
