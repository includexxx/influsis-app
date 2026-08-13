import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CampaignMiniCard from './CampaignMiniCard';

const image = { uri: 'thumb.png' };

describe('<CampaignMiniCard />', () => {
  test('renders the started label and title', () => {
    render(
      <CampaignMiniCard image={image} startedLabel="Started 10 July" title="Bkash Campaign" />,
    );
    expect(screen.getByText('Started 10 July')).not.toBeNull();
    expect(screen.getByText('Bkash Campaign')).not.toBeNull();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <CampaignMiniCard
        image={image}
        startedLabel="Started 10 July"
        title="Bkash Campaign"
        onPress={onPress}
        testID="mini-card"
      />,
    );
    fireEvent.press(screen.getByTestId('mini-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
