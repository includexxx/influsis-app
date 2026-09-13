import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CampaignCard from './CampaignCard';

const image = { uri: 'campaign.png' };
const avatar = { uri: 'avatar.png' };

describe('<CampaignCard />', () => {
  test('renders hero variant with business avatar and gender tags', () => {
    render(
      <CampaignCard
        variant="hero"
        image={image}
        businessAvatar={avatar}
        title="KFC Branding Campaign"
        verified
        tags={['Male', 'Female']}
        price="$2,000"
        dueDate="21 Oct 2022"
      />,
    );
    expect(screen.getByText('KFC Branding Campaign')).not.toBeNull();
    expect(screen.getByText('Male')).not.toBeNull();
    expect(screen.getByText('Female')).not.toBeNull();
    expect(screen.getByText('$2,000')).not.toBeNull();
    expect(screen.getByText('21 Oct 2022')).not.toBeNull();
  });

  test('renders list variant with business name and services description', () => {
    render(
      <CampaignCard
        variant="list"
        image={image}
        title="Bkash Branding Campaign"
        businessName="Bkash Ltd."
        servicesDescription="3 Tiktok Video, 1 Youtube Reel, 2 Facebook Post"
        tags={['Male', 'Female']}
        price="$2,000"
        dueDate="21 Oct 2022"
      />,
    );
    expect(screen.getByText('Bkash Ltd.')).not.toBeNull();
    expect(screen.getByText('3 Tiktok Video, 1 Youtube Reel, 2 Facebook Post')).not.toBeNull();
  });

  test('renders a status badge when status is given', () => {
    render(
      <CampaignCard
        variant="list"
        image={image}
        title="Bkash Branding Campaign"
        businessName="Bkash Ltd."
        status="Ongoing"
        price="$2,000"
        dueDate="21 Oct 2022"
      />,
    );
    expect(screen.getByText('Ongoing')).not.toBeNull();
  });

  test('renders applied variant with applied date and price, no business name', () => {
    render(
      <CampaignCard
        variant="applied"
        image={image}
        title="Bkash Branding Campaign"
        status="Applied"
        statusColor="#F42E9E"
        statusTextColor="#FFFFFF"
        price="$299.99"
        dueDate="Applied 10 July"
      />,
    );
    expect(screen.getByText('Bkash Branding Campaign')).not.toBeNull();
    expect(screen.getByText('Applied 10 July')).not.toBeNull();
    expect(screen.getByText('$299.99')).not.toBeNull();
    expect(screen.getAllByText('Applied').length).toBeGreaterThan(0);
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <CampaignCard
        image={image}
        title="Campaign"
        price="$100"
        dueDate="1 Jan 2024"
        onPress={onPress}
        testID="campaign-card"
      />,
    );
    fireEvent.press(screen.getByTestId('campaign-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
