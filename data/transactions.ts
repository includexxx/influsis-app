import { WalletTransaction } from '@/types';

// Mock content for the Transaction screen (scenes/main/Transactions.tsx,
// Figma "Transaction" node 6212:7410), standing in for a real payouts API
// the same way every other screen's data file does (see docs/PRD.md
// §2.2/§4.1).
//
// Figma cycles three row templates to fill its 11 rows and gives every one
// of them the same `+$750` - mirrored verbatim rather than inventing varied
// amounts or dates, the convention data/orders.ts already follows for
// Figma's own repeated card content.

const bkashIcon = require('@/assets/images/withdraw/bkash-bird.png');
const paypalIcon = require('@/assets/images/withdraw/paypal.png');

const bkash = { icon: bkashIcon, iconSize: 18, date: 'Today', amount: '+$750' };
const paypal = { icon: paypalIcon, iconSize: 20, date: 'Yesterday', amount: '+$750' };

const templates: Omit<WalletTransaction, 'id'>[] = [
  { ...bkash, title: 'Bkash transfer' },
  { ...paypal, title: 'Paypal transfer' },
  { ...bkash, title: 'Get payment from Bkash' },
  { ...bkash, title: 'Bkash transfer' },
  { ...bkash, title: 'Get payment from Bkash' },
  { ...bkash, title: 'Bkash transfer' },
  { ...paypal, title: 'Paypal transfer' },
  { ...bkash, title: 'Bkash transfer' },
  { ...paypal, title: 'Paypal transfer' },
  { ...bkash, title: 'Bkash transfer' },
  { ...paypal, title: 'Paypal transfer' },
];

export const transactions: WalletTransaction[] = templates.map((template, index) => ({
  id: `transaction-${index + 1}`,
  ...template,
}));
