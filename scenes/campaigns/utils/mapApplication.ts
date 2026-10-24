import { ImageSourcePropType } from 'react-native';
import { resolveMediaUrl } from '@/utils/media';
import { MyEngagementItem } from '../types/myEngagement';
import {
  MONTH_LABELS,
  formatCampaignDueDate,
  formatDisplayDate,
  formatEngagementPrice,
} from './mapCampaignFeedItem';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

function toRemoteSource(keyOrUrl: string | null | undefined): ImageSourcePropType | null {
  const url = resolveMediaUrl(keyOrUrl);
  return url ? { uri: url } : null;
}

// "Applied 10 Jul" from the engagement's ISO `createdAt`, read in local time.
// `label` is "Invited" for a business invitation (the Completed tab mixes both).
export function formatAppliedDate(createdAt: string, label = 'Applied'): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return label;
  return `${label} ${date.getDate()} ${MONTH_LABELS[date.getMonth()]}`;
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

export interface ApplicationCardModel {
  /** Cover photo; `null` shows the generic campaign cover. */
  image: ImageSourcePropType | null;
  title: string;
  /** "Applied 10 Jul" / "Invited 10 Jul". */
  date: string;
  /** What `amount` is: "Agreed fee", "Latest offer", "Your rate" or "Budget". */
  amountLabel: string;
  amount: string;
}

// Maps one of the creator's engagements (a GET /me/engagements row) onto
// the Applications screen's ApplicationCard. The amount is the most settled
// one on the thread: the agreed fee, else the newest offer, else the
// creator's proposal, else the campaign's per-creator budget range - and
// `amountLabel` names which one it is. The status is read off the row
// itself (see components/applications/applicationStatus.ts).
export function mapApplicationToCard(engagement: MyEngagementItem): ApplicationCardModel {
  const campaign = engagement.campaign;
  const [amountLabel, amountMinor] =
    engagement.agreedAmountMinor != null
      ? ['Agreed fee', engagement.agreedAmountMinor]
      : engagement.latestOfferAmountMinor != null
        ? ['Latest offer', engagement.latestOfferAmountMinor]
        : engagement.proposedAmountMinor != null
          ? ['Your rate', engagement.proposedAmountMinor]
          : ['Budget', null];
  return {
    image: toRemoteSource(campaign?.coverUrl),
    title: campaign?.title ?? 'Untitled campaign',
    date: formatAppliedDate(
      engagement.createdAt,
      engagement.origin === 'invited' ? 'Invited' : 'Applied',
    ),
    amountLabel,
    amount: formatEngagementPrice(amountMinor, campaign, engagement.currency),
  };
}

export interface InvitationCardModel {
  /** Campaign avatar (else cover); `null` shows the title's initial. */
  avatar: ImageSourcePropType | null;
  title: string;
  /** "Offer" when the business named a fee, else "Budget". */
  amountLabel: string;
  amount: string;
  /** "01 Oct, 2026", or `null` when the campaign has no application deadline. */
  deadline: string | null;
  /** Relative time the invitation arrived, e.g. "2 h ago". */
  time: string;
}

// Maps one business invitation (a GET /me/engagements?origin=invited row)
// onto InvitationCard. The row carries no business name, so the card leads
// with the campaign. The amount is the newest offer on the thread (the
// business's opening offer, or the latest counter), else the budget range.
export function mapInvitationToCard(
  engagement: MyEngagementItem,
  now?: number,
): InvitationCardModel {
  const campaign = engagement.campaign;
  const offer = engagement.latestOfferAmountMinor;
  return {
    avatar: toRemoteSource(campaign?.avatarUrl ?? campaign?.coverUrl),
    title: campaign?.title ?? 'Campaign invitation',
    amountLabel: offer != null ? 'Offer' : 'Budget',
    amount: formatEngagementPrice(offer, campaign, engagement.currency),
    deadline: campaign?.applicationDeadline
      ? formatCampaignDueDate(campaign.applicationDeadline)
      : null,
    time: formatRelativeTime(engagement.createdAt, now),
  };
}
