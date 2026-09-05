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

  test('renders without crashing at maxStars', () => {
    const { getByTestId } = render(
      <StarRating rating={5} maxStars={5} icon={icon} testID="rating" />,
    );
    expect(getByTestId('rating')).not.toBeNull();
  });
});
