import { ImageSourcePropType } from 'react-native';

// Types for the Mobile Banking flow (Figma nodes 6212:7700 picker,
// 6212:7767 bKash hand-off, 6212:7543 amount, 6212:7574 review).
// See docs/screen/mobile-banking/README.md.

// A row on the Withdraw Method picker. Figma mixes two shapes in one list:
// the three mobile-wallet rows are a bare provider logo (no text), while
// "Bank Account" and "Visa Debit Card" are an icon + label pair.
// `logoWidth`/`logoHeight` are per-provider because each logo is a
// different aspect ratio in the design.
export interface WithdrawMethodOption {
  id: string;
  href: string;
  logo?: ImageSourcePropType;
  logoWidth?: number;
  logoHeight?: number;
  icon?: ImageSourcePropType;
  iconSize?: number;
  label?: string;
}

// The already-saved wallet pre-selected on the Payment review screen
// (Figma node 6212:7971) - a masked account number plus which provider
// saved it.
export interface SavedPaymentMethod {
  id: string;
  icon: ImageSourcePropType;
  iconSize: number;
  account: string;
  description: string;
}
