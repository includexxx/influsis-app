import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import ReviewCard from './ReviewCard';

const avatar = { uri: 'reviewer.png' };

describe('<ReviewCard />', () => {
  test('renders name, rating, timestamp and comment', () => {
    render(
      <ReviewCard
        avatar={avatar}
        name="Salman Muktadir"
        rating={5}
        timeAgo="about 1 hour ago"
        comment="Great to work with!"
      />,
    );
    expect(screen.getByText('Salman Muktadir')).not.toBeNull();
    expect(screen.getByText('(5/5)')).not.toBeNull();
    expect(screen.getByText('about 1 hour ago')).not.toBeNull();
    expect(screen.getByText('Great to work with!')).not.toBeNull();
  });
});
