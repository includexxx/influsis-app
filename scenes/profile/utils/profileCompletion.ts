import { CreatorProfile } from '@/types';

// The profile-strength meter on the Profile tab. Each check is one field a
// business looks at when deciding whether to hire a creator; every check
// weighs the same, so the percentage is simply checks passed / total.
const COMPLETION_CHECKS: { label: string; isDone: (profile: CreatorProfile) => boolean }[] = [
  { label: 'profile photo', isDone: profile => !!profile.avatarUrl },
  { label: 'cover photo', isDone: profile => !!profile.coverUrl },
  { label: 'bio', isDone: profile => !!profile.bio?.trim() },
  { label: 'content categories', isDone: profile => profile.categories.length > 0 },
  { label: 'languages', isDone: profile => profile.languages.length > 0 },
  { label: 'deliverables', isDone: profile => profile.deliverables.length > 0 },
  { label: 'social platforms', isDone: profile => profile.platforms.length > 0 },
  { label: 'portfolio', isDone: profile => profile.portfolio.length > 0 },
  { label: 'location', isDone: profile => !!(profile.city || profile.country) },
  {
    label: 'contact details',
    isDone: profile => !!(profile.contactEmail || profile.contactPhone),
  },
];

export interface ProfileCompletion {
  /** 0-100, rounded to a whole number. */
  percent: number;
  /** Labels of the checks still missing, in display order. */
  missing: string[];
}

export function getProfileCompletion(profile: CreatorProfile): ProfileCompletion {
  const missing = COMPLETION_CHECKS.filter(check => !check.isDone(profile)).map(
    check => check.label,
  );
  const done = COMPLETION_CHECKS.length - missing.length;
  return { percent: Math.round((done / COMPLETION_CHECKS.length) * 100), missing };
}

/** A one-line nudge naming up to two missing fields, e.g. "Add your bio and
 * portfolio" or "Add your bio, portfolio and 3 more". */
export function completionHint(missing: string[]): string {
  if (!missing.length) return 'Your profile is complete';
  const [first, second, ...rest] = missing;
  if (!second) return `Add your ${first}`;
  if (!rest.length) return `Add your ${first} and ${second}`;
  return `Add your ${first}, ${second} and ${rest.length} more`;
}

export type VerificationTone = 'verified' | 'pending' | 'unverified';

/** Maps `verificationStatus` (`unverified | pending | verified | rejected`,
 * typed as a plain string on `CreatorProfile`) to a pill tone + label. */
export function verificationBadge(status: string): { tone: VerificationTone; label: string } {
  if (status === 'verified') return { tone: 'verified', label: 'Verified' };
  if (status === 'pending') return { tone: 'pending', label: 'Verification pending' };
  return { tone: 'unverified', label: 'Not verified' };
}
