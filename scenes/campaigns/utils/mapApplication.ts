import { ImageSourcePropType } from 'react-native';
import { CampaignCardProps } from '@/components/elements/CampaignCard';
import { palette } from '@/theme';
import { resolveMediaKeyOrUrl } from '@/utils/media';
import { EngagementStatus, MyEngagementItem } from '../types/myEngagement';
import { MONTH_LABELS, formatCampaignPrice, formatDisplayDate } from './mapCampaignFeedItem';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

function toRemoteSource(keyOrUrl: string | null | undefined): ImageSourcePropType | null {
  const url = resolveMediaKeyOrUrl(keyOrUrl);
  return url ? { uri: url } : null;
}

const STATUS_BADGES: Record<EngagementStatus, { label: string; color: string; textColor: string }> =
  {
    pending: { label: 'Applied', color: palette.primary[400], textColor: palette.white },
    countered: { label: 'Countered', color: palette.warning[500], textColor: palette.white },
    accepted: { label: 'Accepted', color: palette.success[500], textColor: palette.white },
    completed: { label: 'Completed', color: palette.success[500], textColor: palette.white },
    declined: { label: 'Declined', color: palette.error[500], textColor: palette.white },
    withdrawn: { label: 'Withdrawn', color: palette.gray[300], textColor: palette.white },
    expired: { label: 'Expired', color: palette.gray[300], textColor: palette.white },
    cancelled: { label: 'Cancelled', color: palette.gray[300], textColor: palette.white },
  };

// "Applied 10 Jul" from the engagement's ISO `createdAt`, read in local time.
export function formatAppliedDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Applied';
  return `Applied ${date.getDate()} ${MONTH_LABELS[date.getMonth()]}`;
}

// "Just now" / "5 min ago" / "3 h ago" / "2 d ago", then a plain date after a week.
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const date = new Date(iso);
  const time = date.getTime();
  if (Number.isNaN(time)) return '';
  const elapsed = Math.max(0, now - time);
  if (elapsed < MINUTE_MS) return 'Just now';
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)} min ago`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)} h ago`;
  if (elapsed < WEEK_MS) return `${Math.floor(elapsed / DAY_MS)} d ago`;
  return formatDisplayDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export type AppliedCampaignCardProps = Pick<
  CampaignCardProps,
  'image' | 'title' | 'price' | 'dueDate' | 'status' | 'statusColor' | 'statusTextColor'
>;

// Maps one of the creator's own applications (GET /me/engagements?origin=
// requested row) onto CampaignCard's `applied` variant. The price is the
// most settled amount on the thread: the agreed fee, else the newest offer,
// else the creator's proposal, else the campaign budget.
export function mapApplicationToCard(engagement: MyEngagementItem): AppliedCampaignCardProps {
  const campaign = engagement.campaign;
  const badge = STATUS_BADGES[engagement.status] ?? STATUS_BADGES.pending;
  return {
    image: toRemoteSource(campaign?.coverUrl),
    title: campaign?.title ?? 'Untitled campaign',
    price: formatCampaignPrice(
      engagement.agreedAmountMinor ??
        engagement.latestOfferAmountMinor ??
        engagement.proposedAmountMinor ??
        campaign?.budgetAmountMinor ??
        null,
      engagement.currency,
    ),
    dueDate: formatAppliedDate(engagement.createdAt),
    status: badge.label,
    statusColor: badge.color,
    statusTextColor: badge.textColor,
  };
}

export interface CampaignRequestRowProps {
  avatar: ImageSourcePropType | null;
  /** Used for the avatar initial and the Accept/Decline accessibility labels. */
  name: string;
  message: string;
  time: string;
}

// Maps one business invitation (GET /me/engagements?origin=invited row)
// onto CampaignRequestCard. The row carries no business name, so the copy
// names the campaign instead.
export function mapCampaignRequestToRow(
  engagement: MyEngagementItem,
  now?: number,
): CampaignRequestRowProps {
  const campaign = engagement.campaign;
  const title = campaign?.title ?? 'a campaign';
  return {
    avatar: toRemoteSource(campaign?.avatarUrl ?? campaign?.coverUrl),
    name: campaign?.title ?? 'Campaign',
    message: `You're invited to join ${title}`,
    time: formatRelativeTime(engagement.createdAt, now),
  };
}
