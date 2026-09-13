import { ImageSourcePropType } from 'react-native';

// Types for the Withdraw to Bank flow (Figma nodes 6212:7623 / 7801 / 7849)
// and its confirmation screen (6407:5772).
// See docs/screen/withdraw-bank/README.md.

// One entry in the "All Banks" directory. Every logo renders inside the
// same 30x30 box - the raw exports were trimmed of their whitespace margins
// (scripts/rasterize-withdraw-bank-assets.py) so a plain
// `contentFit="contain"` reproduces Figma's cropped fills.
export interface Bank {
  id: string;
  name: string;
  logo: ImageSourcePropType;
}

// The receipt played back on the confirmation screen. Every field is a
// pre-formatted string: Figma shows literals and there is no payouts API
// supplying an amount, id or timestamp to format against yet.
export interface WithdrawReceipt {
  recipient: string;
  avatar: ImageSourcePropType;
  amount: string;
  transactionId: string;
  dateTime: string;
}
