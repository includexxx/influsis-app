import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CampaignRequestCard from './CampaignRequestCard';

const avatar = { uri: 'business-logo.png' };

describe('<CampaignRequestCard />', () => {
  test('renders the invitation copy and timestamp', () => {
    render(<CampaignRequestCard avatar={avatar} businessName="KFC" time="5 min ago" />);
    expect(screen.getByText('KFC invited you to join a Campaign')).not.toBeNull();
    expect(screen.getByText('5 min ago')).not.toBeNull();
  });

  test('calls onAccept when Accept is tapped', () => {
    const onAccept = jest.fn();
    render(
      <CampaignRequestCard
        avatar={avatar}
        businessName="Bkash"
        time="5 min ago"
        onAccept={onAccept}
        testID="campaign-request"
      />,
    );
    fireEvent.press(screen.getByTestId('campaign-request-accept'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  test('calls onDecline when Decline is tapped', () => {
    const onDecline = jest.fn();
    render(
      <CampaignRequestCard
        avatar={avatar}
        businessName="Pathao"
        time="5 min ago"
        onDecline={onDecline}
        testID="campaign-request"
      />,
    );
    fireEvent.press(screen.getByTestId('campaign-request-decline'));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });
});
