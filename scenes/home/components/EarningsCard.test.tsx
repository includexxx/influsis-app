import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import EarningsCard from './EarningsCard';

describe('<EarningsCard />', () => {
  test('renders the total, identity, and badge', () => {
    render(
      <EarningsCard
        totalEarned="BDT 6,000"
        displayName="@u15q9"
        memberSince="Creator since Aug 2026"
        badgeLabel="Verified Creator"
        badgeVerified
      />,
    );
    expect(screen.getByText('Total earned')).toBeTruthy();
    expect(screen.getByText('BDT 6,000')).toBeTruthy();
    expect(screen.getByText('@u15q9')).toBeTruthy();
    expect(screen.getByText('Creator since Aug 2026')).toBeTruthy();
    expect(screen.getByText('Verified Creator')).toBeTruthy();
  });

  test('shows a placeholder while the total is loading', () => {
    render(<EarningsCard totalEarned={null} displayName="@u15q9" badgeLabel="Unverified" />);
    expect(screen.getByTestId('earnings-card-amount-loading')).toBeTruthy();
  });

  test('wires the CTA, withdraw and help actions', () => {
    const onCtaPress = jest.fn();
    const onWithdrawPress = jest.fn();
    const onHelpPress = jest.fn();
    render(
      <EarningsCard
        totalEarned="BDT 0"
        displayName="@u15q9"
        badgeLabel="Unverified"
        onCtaPress={onCtaPress}
        onWithdrawPress={onWithdrawPress}
        onHelpPress={onHelpPress}
      />,
    );
    fireEvent.press(screen.getByText('Find campaigns to earn'));
    fireEvent.press(screen.getByText('Withdraw now'));
    fireEvent.press(screen.getByText('Need help?'));
    expect(onCtaPress).toHaveBeenCalledTimes(1);
    expect(onWithdrawPress).toHaveBeenCalledTimes(1);
    expect(onHelpPress).toHaveBeenCalledTimes(1);
  });

  test('hides actions that have no handler', () => {
    render(<EarningsCard totalEarned="BDT 0" displayName="@u15q9" badgeLabel="Unverified" />);
    expect(screen.queryByText('Withdraw now')).toBeNull();
    expect(screen.queryByText('Need help?')).toBeNull();
    expect(screen.queryByText('Find campaigns to earn')).toBeNull();
  });
});
