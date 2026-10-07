import { CONTENT_CATEGORY_OPTIONS } from '@/data/contentCategories';
import { resolveMediaUrl } from '@/utils/media';
import {
  CampaignDeliverable,
  CampaignFeedDetail,
  CampaignRequirementSection,
} from '../types/campaignFeed';
import { formatCampaignDueDate } from './mapCampaignFeedItem';

export const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  ugc: 'UGC',
};

export const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
  video: 'Video',
  shorts: 'Shorts',
  reels: 'Reels',
  story: 'Story',
  post: 'Post',
  photo: 'Photo',
};

const GENDER_LABELS: Record<CampaignFeedDetail['preferredGender'], string> = {
  any: 'Any',
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

// The avatar next to the business name. Prefers the campaign's own
// `avatarUrl` (resolved to an absolute URL by the backend). The nested
// `business.avatarUrl` isn't resolved server-side and can be a bare storage
// key, which isn't loadable, so it's only used when it's already absolute.
// `null` lets FallbackImage show the business initial.
export function getCampaignDetailsAvatarUrl(campaign: CampaignFeedDetail): string | null {
  const own = resolveMediaUrl(campaign.avatarUrl);
  if (own) return own;
  const businessAvatar = campaign.business.avatarUrl;
  return businessAvatar && /^https?:\/\//i.test(businessAvatar)
    ? resolveMediaUrl(businessAvatar)
    : null;
}

// One "What you need to create" card: "3 × Reels" on Instagram.
export function formatDeliverable(deliverable: CampaignDeliverable): {
  title: string;
  description: string;
} {
  const type = DELIVERABLE_TYPE_LABELS[deliverable.type] ?? deliverable.type;
  return {
    title: `${deliverable.count} × ${type}`,
    description: PLATFORM_LABELS[deliverable.platform] ?? deliverable.platform,
  };
}

export function formatPreferredGender(gender: CampaignFeedDetail['preferredGender']): string {
  return GENDER_LABELS[gender] ?? gender;
}

// "Dhaka, Bangladesh" from whichever location parts are set, or null.
export function formatCampaignLocation(
  campaign: Pick<CampaignFeedDetail, 'city' | 'state' | 'country'>,
): string | null {
  const parts = [campaign.city, campaign.state, campaign.country].filter(
    (part): part is string => !!part,
  );
  return parts.length ? parts.join(', ') : null;
}

// The brief sections to render as titled bullet lists, in the backend's
// order. The projected `deliverables` section is skipped because the screen
// shows `deliverables` as cards instead, and empty sections are dropped.
export function getBriefSections(
  requirements: CampaignRequirementSection[],
): CampaignRequirementSection[] {
  return [...requirements]
    .filter(section => section.sectionKey !== 'deliverables' && section.items.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export type DeadlineState = 'open' | 'soon' | 'today' | 'closed';

// The countdown next to "Apply by": "12 days left", "Closes today" or
// "Closed", plus a state the screen colors by ("soon" is 3 days or fewer).
// Compares calendar days in local time - the `YYYY-MM-DD` deadline is parsed
// by hand for the same reason as `formatCampaignDueDate`. `null` when there
// is no (valid) deadline.
export function getDeadlineCountdown(
  date: string | null,
  today: Date = new Date(),
): { label: string; state: DeadlineState } | null {
  if (!date) return null;
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return null;
  const deadline = Date.UTC(year, month - 1, day);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const daysLeft = Math.round((deadline - now) / 86_400_000);

  if (daysLeft < 0) return { label: 'Closed', state: 'closed' };
  if (daysLeft === 0) return { label: 'Closes today', state: 'today' };
  return {
    label: daysLeft === 1 ? '1 day left' : `${daysLeft} days left`,
    state: daysLeft <= 3 ? 'soon' : 'open',
  };
}

// "26 Sep 2026" from the ISO `publishedAt` timestamp (its date part), or
// null when the campaign has none.
export function formatPostedDate(publishedAt: string | null): string | null {
  if (!publishedAt) return null;
  const formatted = formatCampaignDueDate(publishedAt.slice(0, 10));
  return formatted === 'No deadline' ? null : formatted;
}

// Content-category keys to display labels ("food" -> "Food & Beverage"); a
// key the app doesn't know is capitalized as-is.
export function formatCategoryLabel(value: string): string {
  const match = CONTENT_CATEGORY_OPTIONS.find(option => option.value === value);
  return match ? match.label : value.charAt(0).toUpperCase() + value.slice(1);
}

// The "Audience" card's tag groups, from whichever targeting fields the
// business filled in. Empty groups are dropped; an empty result hides the card.
export function getAudienceGroups(
  campaign: Pick<
    CampaignFeedDetail,
    'audienceLocation' | 'ageRanges' | 'interests' | 'subCategories' | 'objectives'
  >,
): { label: string; items: string[] }[] {
  const groups = [
    { label: 'Location', items: campaign.audienceLocation ? [campaign.audienceLocation] : [] },
    { label: 'Age range', items: campaign.ageRanges },
    { label: 'Interests', items: campaign.interests.map(formatCategoryLabel) },
    { label: 'Niches', items: campaign.subCategories.map(formatCategoryLabel) },
    { label: 'Objectives', items: campaign.objectives },
  ];
  return groups.filter(group => group.items.length > 0);
}
