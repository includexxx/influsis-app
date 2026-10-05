import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CreatorAgreement } from '../utils/agreement';
import AgreementSheet from './AgreementSheet';

// See OptionSheet.test.tsx: force BottomSheet's plain-View web fallback.
jest.mock('@/utils/deviceInfo', () => ({
  ...(jest.requireActual('@/utils/deviceInfo') as typeof import('@/utils/deviceInfo')),
  isWeb: true,
}));

const confirm: CreatorAgreement = {
  mode: 'confirm',
  offerId: 'offer-2',
  businessName: 'Pathao Ltd.',
  businessAvatarUrl: null,
  campaignTitle: 'Pathao Summer Push',
  scope: [
    { platform: 'instagram', type: 'reels', count: 2 },
    { platform: 'tiktok', type: 'video', count: 1 },
  ],
  contentDeadline: '10 Oct 2026',
  youReceiveMinor: 1_250_000,
  licensingMinor: 250_000,
  licensingPercent: 25,
  currency: 'BDT',
  acceptedAt: null,
  isCompleted: false,
};

const confirmed: CreatorAgreement = {
  ...confirm,
  mode: 'confirmed',
  offerId: null,
  acceptedAt: '30 Sep 2026',
};

// "paid-ad usage rights" is the licensing copy, not a payment status.
const FORBIDDEN = /fee|\bvat\b|processing|total|\bpaid\b(?!-ad)|secured|\bheld\b|escrow/i;

// Every rendered string (text nodes only, not props), so the forbidden-copy
// check sees nested and interpolated text too.
function allText(): string {
  const out: string[] = [];
  const walk = (node: unknown) => {
    if (typeof node === 'string') out.push(node);
    else if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === 'object' && 'children' in node) {
      walk((node as { children: unknown }).children);
    }
  };
  walk(screen.toJSON());
  return out.join(' | ');
}

describe('<AgreementSheet />', () => {
  test('confirm mode shows the terms and what the creator receives', () => {
    render(<AgreementSheet agreement={confirm} onConfirm={jest.fn()} onClose={jest.fn()} />);

    expect(screen.getByText('Review the agreement')).toBeTruthy();
    expect(screen.getByText('Pathao Ltd.')).toBeTruthy();
    expect(screen.getByText('Pathao Summer Push')).toBeTruthy();
    expect(screen.getByText('2 × Instagram Reels')).toBeTruthy();
    expect(screen.getByText('1 × TikTok Video')).toBeTruthy();
    expect(screen.getByText('10 Oct 2026')).toBeTruthy();
    expect(screen.getByText('BDT 12,500')).toBeTruthy();
    expect(screen.getByLabelText("You'll receive 12,500 taka")).toBeTruthy();
    expect(screen.getByText('Includes BDT 2,500 for paid-ad usage rights (+25%)')).toBeTruthy();
    expect(
      screen.getByText("Accepting locks this price and these deliverables. It can't be undone."),
    ).toBeTruthy();
  });

  test('shows no licensing line on tier 1 and no business row when unknown', () => {
    render(
      <AgreementSheet
        agreement={{
          ...confirm,
          businessName: null,
          youReceiveMinor: 1_000_000,
          licensingMinor: 0,
          licensingPercent: 0,
          scope: [],
        }}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText('BDT 10,000')).toBeTruthy();
    expect(screen.queryByTestId('agreement-licensing')).toBeNull();
    expect(screen.queryByTestId('agreement-business')).toBeNull();
    expect(screen.getByText('No deliverables set')).toBeTruthy();
  });

  test('never shows fees, VAT, processing, totals or payment copy', () => {
    const { rerender } = render(
      <AgreementSheet agreement={confirm} onConfirm={jest.fn()} onClose={jest.fn()} />,
    );
    expect(allText()).toContain('paid-ad usage rights');
    expect(allText()).not.toMatch(FORBIDDEN);

    rerender(
      <AgreementSheet agreement={{ ...confirmed, isCompleted: true }} onClose={jest.fn()} />,
    );
    expect(allText()).not.toMatch(FORBIDDEN);
  });

  test('Accept & confirm sends the offer id shown', () => {
    const onConfirm = jest.fn();
    render(<AgreementSheet agreement={confirm} onConfirm={onConfirm} onClose={jest.fn()} />);

    fireEvent.press(screen.getByTestId('agreement-accept'));
    expect(onConfirm).toHaveBeenCalledWith('offer-2');
  });

  test('Back to offer closes without accepting', () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    render(<AgreementSheet agreement={confirm} onConfirm={onConfirm} onClose={onClose} />);

    fireEvent.press(screen.getByTestId('agreement-back'));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('confirmed mode has no Accept and says the agreement is confirmed', () => {
    const onClose = jest.fn();
    render(<AgreementSheet agreement={{ ...confirmed, isCompleted: true }} onClose={onClose} />);

    expect(screen.getByText('Agreement confirmed · 30 Sep 2026')).toBeTruthy();
    expect(screen.getByTestId('agreement-completed')).toBeTruthy();
    expect(screen.queryByTestId('agreement-accept')).toBeNull();
    expect(screen.queryByText(/can't be undone/)).toBeNull();
    fireEvent.press(screen.getByTestId('agreement-close'));
    expect(onClose).toHaveBeenCalled();
  });

  test('shows a loading state', () => {
    render(<AgreementSheet agreement={null} isLoading onClose={jest.fn()} />);
    expect(screen.getByTestId('agreement-loading')).toBeTruthy();
    expect(screen.queryByTestId('agreement-accept')).toBeNull();
  });

  test('a failed campaign load offers Retry and no Accept', () => {
    const onRetry = jest.fn();
    render(<AgreementSheet agreement={null} loadError onRetry={onRetry} onClose={jest.fn()} />);

    expect(screen.getByText("Couldn't load the campaign terms.")).toBeTruthy();
    expect(screen.queryByTestId('agreement-accept')).toBeNull();
    expect(screen.queryByText(/receive/)).toBeNull();
    fireEvent.press(screen.getByTestId('agreement-retry'));
    expect(onRetry).toHaveBeenCalled();
  });

  test('a stale offer disables Accept and shows the server message', () => {
    const onConfirm = jest.fn();
    render(
      <AgreementSheet
        agreement={confirm}
        isStale
        message="This offer is no longer pending."
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />,
    );

    const accept = screen.getByTestId('agreement-accept');
    expect(accept.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    fireEvent.press(accept);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('This offer is no longer pending.')).toBeTruthy();
  });
});
