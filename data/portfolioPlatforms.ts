// Platform taxonomy and link helpers for the creator onboarding Portfolio
// step (build-plan 20f, creator-onboarding-requirements.md §3 "Portfolio").
// There is no backend link-preview service, so the platform tag is derived
// from the URL string and the link check is a client-side format check only.

export const PORTFOLIO_PLATFORM_VALUES = ['instagram', 'youtube', 'tiktok', 'others'] as const;

export type PortfolioPlatform = (typeof PORTFOLIO_PLATFORM_VALUES)[number];

export interface PortfolioPlatformOption {
  value: PortfolioPlatform;
  label: string;
}

export const PORTFOLIO_PLATFORM_OPTIONS: PortfolioPlatformOption[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'others', label: 'Others' },
];

// Accepts a bare host (`instagram.com/p/x`) or a full `https://` URL; rejects
// free text and empty strings. Not a reachability check.
const URL_PATTERN = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i;

export function isLikelyPortfolioUrl(value: string): boolean {
  return URL_PATTERN.test(value.trim());
}

// Comparison key for the non-blocking duplicate-link warning.
export function normalizePortfolioUrl(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
}

export function detectPlatform(value: string): PortfolioPlatform {
  const s = value.toLowerCase();
  if (s.includes('instagram.')) return 'instagram';
  if (s.includes('youtube.') || s.includes('youtu.be')) return 'youtube';
  if (s.includes('tiktok.')) return 'tiktok';
  return 'others';
}
