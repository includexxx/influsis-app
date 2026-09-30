import { Linking } from 'react-native';

/** A stored option value back to its display label, or the raw value
 * capitalized when it's free text from an "Others" branch. */
export function labelFor(value: string, options: { value: string; label: string }[]): string {
  const match = options.find(option => option.value === value);
  if (match) return match.label;
  return capitalize(value);
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function openLink(url: string) {
  const target = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  Linking.canOpenURL(target)
    .then(supported => {
      if (supported) return Linking.openURL(target);
    })
    // Best-effort — an unopenable link (malformed, no handler) shouldn't crash the screen.
    .catch(() => undefined);
}

const SOCIAL_PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

// Profile URL for a bare social handle (backend CREATOR_SOCIAL_PLATFORMS).
const SOCIAL_PROFILE_URLS: Record<string, (handle: string) => string> = {
  facebook: handle => `https://facebook.com/${handle}`,
  instagram: handle => `https://instagram.com/${handle}`,
  youtube: handle => `https://youtube.com/@${handle}`,
  tiktok: handle => `https://tiktok.com/@${handle}`,
};

export function socialPlatformLabel(platform: string): string {
  return SOCIAL_PLATFORM_LABELS[platform] ?? capitalize(platform);
}

/** The creator's profile URL on that platform, or null when the platform is
 * unknown or there's no handle. */
export function socialProfileUrl(platform: string, handle: string | null): string | null {
  const cleaned = handle?.trim().replace(/^@/, '');
  if (!cleaned) return null;
  return SOCIAL_PROFILE_URLS[platform]?.(cleaned) ?? null;
}

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

/** "Aug 2026" from an ISO timestamp, or "—" when missing/unparseable. */
export function formatMonthYear(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}
