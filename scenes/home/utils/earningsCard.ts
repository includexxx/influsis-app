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

// "Creator since Sep 2026" from the account's `createdAt` ISO timestamp,
// or null when it's missing or unparseable.
export function formatMemberSince(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return `Creator since ${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

// The badge in the card's bottom-right corner. There's no creator tier in
// the backend, so it reflects verification status instead.
export function getCreatorBadge(verificationStatus: string | null | undefined): {
  label: string;
  verified: boolean;
} {
  return verificationStatus === 'verified'
    ? { label: 'Verified Creator', verified: true }
    : { label: 'Unverified', verified: false };
}
