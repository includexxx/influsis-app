import { z } from 'zod';

const MAX_PITCH_LENGTH = 2000;

// The creator's asking rate as typed: digits with optional thousands
// separators and up to two decimals ("4500", "4,500.50").
const AMOUNT_PATTERN = /^\d[\d,]*(\.\d{1,2})?$/;
// Roughly what the backend's class-validator `@IsUrl()` accepts: an optional
// http(s) scheme, a dotted host, and an optional path.
const URL_PATTERN = /^(https?:\/\/)?[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/i;

function parseAmount(value: string): number {
  return Number(value.replace(/,/g, ''));
}

const portfolioLink = z
  .string()
  .trim()
  .refine(value => !value || URL_PATTERN.test(value), 'Enter a valid link');

export const applySchema = z.object({
  pitch: z
    .string()
    .trim()
    .min(1, 'Tell the business why you are a good fit')
    .max(MAX_PITCH_LENGTH, `Keep it under ${MAX_PITCH_LENGTH} characters`),
  amount: z
    .string()
    .trim()
    .min(1, 'Enter your rate')
    .refine(value => AMOUNT_PATTERN.test(value), 'Enter a number, like 4500')
    .refine(value => parseAmount(value) > 0, 'Your rate must be more than 0'),
  linkOne: portfolioLink,
  linkTwo: portfolioLink,
});

export type ApplyValues = z.infer<typeof applySchema>;

export const applyDefaultValues: ApplyValues = {
  pitch: '',
  amount: '',
  linkOne: '',
  linkTwo: '',
};

function withScheme(link: string): string {
  return /^https?:\/\//i.test(link) ? link : `https://${link}`;
}

// Turns validated form values into CF1's body: the rate in minor units
// (poisha) and the non-empty links with an https:// scheme.
export function toApplyPayload(values: ApplyValues) {
  const portfolioUrls = [values.linkOne, values.linkTwo]
    .map(link => link.trim())
    .filter(Boolean)
    .map(withScheme);
  return {
    pitch: values.pitch.trim(),
    proposedAmountMinor: Math.round(parseAmount(values.amount) * 100),
    ...(portfolioUrls.length ? { portfolioUrls } : {}),
  };
}
