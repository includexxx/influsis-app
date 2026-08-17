import { BalanceSummary, PaymentMethodOption } from '@/types';

// Mock content for the Balance screen (scenes/main/Balance.tsx, Figma
// "Balance" node 6402:5295), standing in for a real payouts API the same
// way every other screen's data file does (see docs/PRD.md §2.2/§4.1) -
// there is no backend, so the amounts below are Figma's own literal values
// rather than anything computed.
//
// See docs/screen/balance/README.md.

export const balanceSummary: BalanceSummary = {
  total: '$450.00',
  change: '3.2%',
  changeDirection: 'up',
  monthlyEarning: '$150.00',
  totalEarning: '$1550.00',
};

export const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'mobile-banking',
    icon: require('@/assets/images/withdraw/method-mobile-banking.png'),
    title: 'Mobile banking',
    description: 'Instant transfer',
  },
  {
    id: 'bank-transfer',
    icon: require('@/assets/images/withdraw/method-bank-transfer.png'),
    title: 'Bank transfer',
    description: '1-3 business days',
    href: '/withdraw/bank',
  },
  {
    id: 'card',
    icon: require('@/assets/images/withdraw/method-card.png'),
    title: 'Credit or Debit card',
    description: 'Various processing times',
  },
  {
    id: 'recent-transaction',
    icon: require('@/assets/images/withdraw/method-recent-transaction.png'),
    title: 'Recent transaction',
    description: 'Various processing times',
    href: '/transactions',
  },
];
