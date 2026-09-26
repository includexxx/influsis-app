import { ImageSourcePropType } from 'react-native';
import { CampaignCardProps } from '@/components/elements/CampaignCard';
import { CampaignFeedItem } from '../types/campaignFeed';

// Shown in place of a campaign's cover photo when the business hasn't
// uploaded one yet (`coverUrl: null`) - the same generic campaign hero image
// the mock Home data used for this slot before real backend wiring started.
export const FALLBACK_CAMPAIGN_COVER: ImageSourcePropType = require('@/assets/images/home/hero-campaign.jpg');

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// Parses the `YYYY-MM-DD` field manually instead of `new Date(string)` +
// `Intl.DateTimeFormat`, which reads a date-only string as UTC midnight and
// can render a day early in negative-UTC-offset timezones.
export function formatCampaignDueDate(date: string | null): string {
  if (!date) return 'No deadline';
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return 'No deadline';
  return `${day} ${MONTH_LABELS[month - 1]} ${year}`;
}

export function formatCampaignPrice(budgetAmountMinor: number | null, currency: string): string {
  if (budgetAmountMinor === null) return 'Negotiable';
  const amount = budgetAmountMinor / 100;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${currency} ${formattedAmount}`;
}

export type CampaignFeedItemCardProps = Pick<
  CampaignCardProps,
  'image' | 'businessAvatar' | 'businessName' | 'title' | 'price' | 'dueDate'
>;

// Maps a campaign feed row (CB1 or CB4 - both share the same shape) onto
// CampaignCard's props. Neither feed has `tags`/`servicesDescription`/
// `verified` fields (those are campaign-authoring concepts the creator-
// facing feeds don't project), so they're left out rather than guessed.
export function mapCampaignFeedItemToCard(campaign: CampaignFeedItem): CampaignFeedItemCardProps {
  return {
    image: campaign.coverUrl ? { uri: campaign.coverUrl } : FALLBACK_CAMPAIGN_COVER,
    businessAvatar: campaign.avatarUrl ? { uri: campaign.avatarUrl } : undefined,
    businessName: campaign.businessName,
    title: campaign.title,
    price: formatCampaignPrice(campaign.budgetAmountMinor, campaign.currency),
    dueDate: formatCampaignDueDate(campaign.applicationDeadline),
  };
}
