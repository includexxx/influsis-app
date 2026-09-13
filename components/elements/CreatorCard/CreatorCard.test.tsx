import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CreatorCard from './CreatorCard';

const image = { uri: 'creator.png' };

describe('<CreatorCard />', () => {
  test('renders name, location, tags and stats', () => {
    render(
      <CreatorCard
        image={image}
        name="Sunehra tasnim"
        verified
        topRated
        location="Dhaka, Bangladesh"
        tags={['Dhaka, Bangladesh', 'Dhaka, Bangladesh']}
        followers="2.5M"
        engagement="4.8%"
      />,
    );
    expect(screen.getByText('Sunehra tasnim')).not.toBeNull();
    expect(screen.getByText('Top Rated')).not.toBeNull();
    expect(screen.getAllByText('Dhaka, Bangladesh').length).toBeGreaterThan(0);
    expect(screen.getByText('2.5M')).not.toBeNull();
    expect(screen.getByText('Followers')).not.toBeNull();
    expect(screen.getByText('4.8%')).not.toBeNull();
    expect(screen.getByText('Engagement')).not.toBeNull();
  });

  test('omits the Top Rated badge when topRated is falsy', () => {
    render(
      <CreatorCard
        image={image}
        name="Salman Muqtadir"
        location="Dhaka, Bangladesh"
        followers="2.5M"
        engagement="4.8%"
      />,
    );
    expect(screen.queryByText('Top Rated')).toBeNull();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <CreatorCard
        image={image}
        name="Salman Muqtadir"
        location="Dhaka, Bangladesh"
        followers="2.5M"
        engagement="4.8%"
        onPress={onPress}
        testID="creator-card"
      />,
    );
    fireEvent.press(screen.getByTestId('creator-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
