import { Bank, WithdrawReceipt } from '@/types';

// Mock content for the Withdraw to Bank flow (Figma nodes 6212:7623 /
// 7801 / 7849) and its confirmation screen (6407:5772), standing in for a
// real payouts API the same way every other screen's data file does (see
// docs/PRD.md §2.2/§4.1).
//
// Figma repeats "Socail Islami Bank Limited" (typo included) for three
// visually different logos - kept verbatim rather than renamed or
// de-duplicated, the convention data/orders.ts already follows for Figma's
// own repeated content.

export const banks: Bank[] = [
  {
    id: 'city-bank',
    name: 'City Bank Limited',
    logo: require('@/assets/images/withdraw/banks/city-bank.png'),
  },
  {
    id: 'social-islami-1',
    name: 'Socail Islami Bank Limited',
    logo: require('@/assets/images/withdraw/banks/social-islami-1.png'),
  },
  {
    id: 'social-islami-2',
    name: 'Socail Islami Bank Limited',
    logo: require('@/assets/images/withdraw/banks/social-islami-2.png'),
  },
  {
    id: 'social-islami-3',
    name: 'Socail Islami Bank Limited',
    logo: require('@/assets/images/withdraw/banks/social-islami-3.png'),
  },
  {
    id: 'eastern-bank',
    name: 'Eastern Bank Limited',
    logo: require('@/assets/images/withdraw/banks/eastern-bank.png'),
  },
  {
    id: 'dhaka-bank',
    name: 'Dhaka Bank Limited',
    logo: require('@/assets/images/withdraw/banks/dhaka-bank.png'),
  },
  {
    id: 'first-security-islami',
    name: 'First Security Islami Bank Limited',
    logo: require('@/assets/images/withdraw/banks/first-security-islami.png'),
  },
  {
    id: 'uttora-bank',
    name: 'Uttora Bank Limited',
    logo: require('@/assets/images/withdraw/banks/uttora-bank.png'),
  },
  {
    id: 'bangladesh-agriculture',
    name: 'Bangladesh Agriculture Bank Limited',
    logo: require('@/assets/images/withdraw/banks/bangladesh-agriculture.png'),
  },
  {
    id: 'rupali-bank',
    name: 'Rupali Bank Limited',
    logo: require('@/assets/images/withdraw/banks/rupali-bank.png'),
  },
  {
    id: 'sonali-bank',
    name: 'Sonali Bank Limited',
    logo: require('@/assets/images/withdraw/banks/sonali-bank.png'),
  },
  {
    id: 'janata-bank',
    name: 'Janata Bank Limited',
    logo: require('@/assets/images/withdraw/banks/janata-bank.png'),
  },
  {
    id: 'pubali-bank',
    name: 'Pubali Bank Limited',
    logo: require('@/assets/images/withdraw/banks/pubali-bank.png'),
  },
  {
    id: 'agrani-bank',
    name: 'Agrani Bank Limited',
    logo: require('@/assets/images/withdraw/banks/agrani-bank.png'),
  },
];

export const withdrawReceipt: WithdrawReceipt = {
  recipient: 'Aliya Leon',
  avatar: require('@/assets/images/withdraw/avatar-48.png'),
  amount: '$750',
  transactionId: '#1234567889909',
  dateTime: 'Oct 12, 15.87 PM',
};
