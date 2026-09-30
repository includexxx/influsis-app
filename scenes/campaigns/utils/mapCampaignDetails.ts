import { resolveMediaUrl } from '@/utils/media';
import {
  CampaignDeliverable,
  CampaignFeedDetail,
  CampaignRequirementSection,
} from '../types/campaignFeed';

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
