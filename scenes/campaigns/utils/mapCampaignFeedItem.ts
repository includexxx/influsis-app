import { ImageSourcePropType } from 'react-native';
import { CampaignCardProps } from '@/components/elements/CampaignCard';
import { resolveMediaUrl } from '@/utils/media';
import { CampaignFeedEngagementSummary, CampaignFeedItem } from '../types/campaignFeed';

export const MONTH_LABELS = [
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

// "01 Jan, 2026" - the one format every full campaign date uses (deadlines,
// offer and agreement dates, older activity). `monthIndex` is 0-based.
export function formatDisplayDate(year: number, monthIndex: number, day: number): string {
  return `${String(day).padStart(2, '0')} ${MONTH_LABELS[monthIndex]}, ${year}`;
}

// Parses the `YYYY-MM-DD` field manually instead of `new Date(string)` +
// `Intl.DateTimeFormat`, which reads a date-only string as UTC midnight and
// can render a day early in negative-UTC-offset timezones.
export function formatCampaignDueDate(date: string | null): string {
  if (!date) return 'No deadline';
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return 'No deadline';
  return formatDisplayDate(year, month - 1, day);
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

// The status pill for a campaign this creator is already engaged with, so
// the feed shows "Applied"/"Invited" without opening the campaign. The feed
// only returns live engagements (pending, countered, accepted); anything
// else, or no engagement, shows no pill.
export function formatCampaignEngagementStatus(
  engagement: CampaignFeedEngagementSummary | null,
): string | undefined {
  switch (engagement?.status) {
    case 'pending':
      return engagement.origin === 'invited' ? 'Invited' : 'Applied';
    case 'countered':
      return 'Countered';
    case 'accepted':
      return 'Accepted';
    default:
      return undefined;
  }
}

// Remote media from the backend, with a dev-only `localhost` origin
// rewritten to the app's API host (utils/media.ts) - without that, every
// image URL the local backend returns is unreachable from a device or
// emulator. `null` lets CampaignCard fall back on its own.
function toRemoteSource(url: string | null): ImageSourcePropType | null {
  const resolved = resolveMediaUrl(url);
  return resolved ? { uri: resolved } : null;
}

export type CampaignFeedItemCardProps = Pick<
  CampaignCardProps,
  'image' | 'businessAvatar' | 'businessName' | 'title' | 'price' | 'dueDate' | 'status'
>;

// Maps a campaign feed row (CB1 or CB4 - both share the same shape) onto
// CampaignCard's props. Neither feed has `tags`/`servicesDescription`/
// `verified` fields (those are campaign-authoring concepts the creator-
// facing feeds don't project), so they're left out rather than guessed.
// The row's `avatarUrl` is the campaign's own avatar image; when it's missing
// or broken, the card falls back to the business name's initial.
export function mapCampaignFeedItemToCard(campaign: CampaignFeedItem): CampaignFeedItemCardProps {
  return {
    image: toRemoteSource(campaign.coverUrl),
    businessAvatar: toRemoteSource(campaign.avatarUrl),
    businessName: campaign.businessName,
    title: campaign.title,
    price: formatCampaignPrice(campaign.budgetAmountMinor, campaign.currency),
    dueDate: formatCampaignDueDate(campaign.applicationDeadline),
    status: formatCampaignEngagementStatus(campaign.myEngagement),
  };
}
