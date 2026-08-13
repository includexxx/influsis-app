import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import GigCard from './GigCard';

const image = { uri: 'gig.png' };

describe('<GigCard />', () => {
  test('renders platforms, price and description', () => {
    render(
      <GigCard
        image={image}
        platforms="TikTok, Facebook, Youtube"
        price="$350"
        description="I will create facebook promotion"
      />,
    );
    expect(screen.getByText('TikTok, Facebook, Youtube')).not.toBeNull();
    expect(screen.getByText('$350')).not.toBeNull();
    expect(screen.getByText('I will create facebook promotion')).not.toBeNull();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <GigCard
        image={image}
        platforms="TikTok"
        price="$350"
        description="desc"
        onPress={onPress}
        testID="gig-card"
      />,
    );
    fireEvent.press(screen.getByTestId('gig-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
