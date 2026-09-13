import { ImageSourcePropType } from 'react-native';

// A row on the Transaction screen (Figma "Transaction", node 6212:7410) -
// a tinted circle holding a provider glyph, the transfer's title and
// relative date, and the signed amount.
//
// `amount` is a pre-formatted string rather than a number: Figma shows
// every row as a signed, currency-prefixed literal ("+$750"), and there is
// no payouts API supplying a currency or locale to format against yet.
// See docs/screen/transactions/README.md.
export interface WalletTransaction {
  id: string;
  icon: ImageSourcePropType;
  iconSize: number;
  title: string;
  date: string;
  amount: string;
}
