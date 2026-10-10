import { CampaignObjective } from '../types/campaignFeed';

// Backend 18q - every campaign has one objective, and the objective decides
// which deliverables a campaign or engagement may ask for. Mirrors the
// backend's OBJECTIVE_OPTIONS (../backend/src/campaigns/domain/deliverable-options.ts,
// the `campaign_objective_option` seed), so the editor offers only what the
// server accepts. The server still has the final word.

export const OBJECTIVE_LABELS: Record<CampaignObjective, string> = {
  ugc_content: 'UGC Content',
  brand_awareness: 'Brand Awareness',
};

export interface ObjectiveOption {
  platform: string;
  type: string;
  label: string;
}

const options = (rows: readonly [string, string, string][]): ObjectiveOption[] =>
  rows.map(([platform, type, label]) => ({ platform, type, label }));

// The custom deliverable is allowed for every objective by rule, so it isn't
// listed here (backend `isCustomPair`).
export const OBJECTIVE_OPTIONS: Record<CampaignObjective, readonly ObjectiveOption[]> = {
  ugc_content: options([
    ['facebook', 'video', 'Video for Facebook (Reel)'],
    ['facebook', 'photo', 'Image for Facebook'],
    ['instagram', 'reels', 'Video for Instagram (Reel)'],
    ['instagram', 'photo', 'Image for Instagram'],
    ['youtube', 'video', 'Video for YouTube (long)'],
    ['youtube', 'shorts', 'Video for YouTube (Shorts)'],
    ['tiktok', 'video', 'Video for TikTok (Reel)'],
  ]),
  brand_awareness: options([
    ['facebook', 'video', 'Post video on Facebook (Reel)'],
    ['facebook', 'post', 'Post on Facebook'],
    ['facebook', 'story', 'Story on Facebook'],
    ['instagram', 'reels', 'Post video on Instagram (Reel)'],
    ['instagram', 'post', 'Post on Instagram'],
    ['instagram', 'story', 'Story on Instagram'],
    ['tiktok', 'video', 'Post video on TikTok (Reel)'],
    ['tiktok', 'post', 'Post on TikTok'],
    ['tiktok', 'story', 'Story on TikTok'],
    ['youtube', 'shorts', 'Post video on YouTube (Shorts)'],
  ]),
};

// A campaign created before 18q has no objective, and the backend then
// accepts any offered, non-retired pair: every pair above, once. The retired
// `ugc` pairs are left out - they may stay in a scope that already holds
// them, but are never picked again.
export const LEGACY_PAIRS: readonly { platform: string; type: string }[] = [
  { platform: 'facebook', type: 'video' },
  { platform: 'facebook', type: 'photo' },
  { platform: 'facebook', type: 'post' },
  { platform: 'facebook', type: 'story' },
  { platform: 'instagram', type: 'reels' },
  { platform: 'instagram', type: 'photo' },
  { platform: 'instagram', type: 'post' },
  { platform: 'instagram', type: 'story' },
  { platform: 'tiktok', type: 'video' },
  { platform: 'tiktok', type: 'post' },
  { platform: 'tiktok', type: 'story' },
  { platform: 'youtube', type: 'video' },
  { platform: 'youtube', type: 'shorts' },
];

export function objectiveLabel(objective: CampaignObjective | null | undefined): string | null {
  return objective ? (OBJECTIVE_LABELS[objective] ?? null) : null;
}

// A custom deliverable is stored as `platform: 'custom', type: 'custom'`
// with a business-written title and rich-text description.
export function isCustomItem(item: { platform: string }): boolean {
  return item.platform === 'custom';
}

// The objective's own name for a pair ("Image for Instagram"), or null when
// the objective doesn't list it (a retired or legacy pair).
export function objectiveOptionLabel(
  objective: CampaignObjective | null | undefined,
  item: { platform: string; type: string },
): string | null {
  if (!objective) return null;
  const match = OBJECTIVE_OPTIONS[objective]?.find(
    option => option.platform === item.platform && option.type === item.type,
  );
  return match?.label ?? null;
}
