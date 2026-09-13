import { SavedPaymentMethod, WithdrawMethodOption } from '@/types';

// Mock content for the Mobile Banking flow (Figma nodes 6212:7700 /
// 6212:7767 / 6212:7543 / 6212:7574), standing in for a real payouts API
// the same way every other screen's data file does (see docs/PRD.md
// §2.2/§4.1).

const bkashBirdIcon = require('@/assets/images/withdraw/bkash-bird.png');

// The five rows of the Withdraw Method picker. The three wallets are
// logo-only in Figma; the last two pair a 3D glyph with a label and lead
// into the already-built Withdraw to Bank flow.
export const withdrawMethods: WithdrawMethodOption[] = [
  {
    id: 'bkash',
    href: '/withdraw/amount',
    logo: require('@/assets/images/withdraw/logo-bkash.png'),
    logoWidth: 57,
    logoHeight: 32,
  },
  {
    id: 'nagad',
    href: '/withdraw/amount',
    logo: require('@/assets/images/withdraw/logo-nagad.png'),
    logoWidth: 51,
    logoHeight: 32,
  },
  {
    id: 'rocket',
    href: '/withdraw/amount',
    logo: require('@/assets/images/withdraw/logo-rocket.png'),
    logoWidth: 49,
    logoHeight: 34,
  },
];

// The saved wallet pre-selected on the review step (Figma node 6212:7971).
export const savedPaymentMethod: SavedPaymentMethod = {
  id: 'bkash-01521702480',
  icon: bkashBirdIcon,
  iconSize: 18,
  account: '01521702480',
  description: 'Save by bkash',
};

// The payer shown on the bKash checkout hand-off (Figma node 6212:7797).
export const bkashPayer = {
  name: 'Aliya Leon',
  avatar: require('@/assets/images/withdraw/avatar-36.png'),
};
