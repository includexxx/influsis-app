import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import InfluencerCard from './InfluencerCard';

const image = { uri: 'influencer.png' };

describe('<InfluencerCard />', () => {
  test('renders name, location, tags and stats', () => {
    render(
      <InfluencerCard
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
      <InfluencerCard
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
      <InfluencerCard
        image={image}
        name="Salman Muqtadir"
        location="Dhaka, Bangladesh"
        followers="2.5M"
        engagement="4.8%"
        onPress={onPress}
        testID="influencer-card"
      />,
    );
    fireEvent.press(screen.getByTestId('influencer-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
