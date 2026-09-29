import { ScopeItem } from '../types/myEngagement';
import { DELIVERABLE_TYPE_LABELS, PLATFORM_LABELS } from './mapCampaignDetails';

// Backend 18l - an engagement's own deliverables list ("scope"), negotiated
// with the price. These helpers mirror the backend's rules
// (../backend/src/campaign-engagement/domain/scope-rules.ts and the
// EngagementScopeItemDto bounds) and web's features/campaigns/utils/scope.ts,
// so the app refuses what the server would. The server still has the final
// word.

export const SCOPE_MAX_ITEMS = 30;
export const SCOPE_MIN_COUNT = 1;
export const SCOPE_MAX_COUNT = 50;

export const SCOPE_MESSAGES = {
  empty: 'Add at least one deliverable.',
  tooMany: `Keep it to ${SCOPE_MAX_ITEMS} deliverables or fewer.`,
  count: `Choose between ${SCOPE_MIN_COUNT} and ${SCOPE_MAX_COUNT}.`,
  duplicate: 'This deliverable is already in the list.',
} as const;

// The deliverables a creator can add, matching the web campaign wizard's
// catalog. The backend accepts any platform x type pair; this keeps the
// picker to combinations that exist on each platform.
export const SCOPE_CATALOG: { platform: string; type: string }[] = [
  { platform: 'facebook', type: 'video' },
  { platform: 'facebook', type: 'post' },
  { platform: 'facebook', type: 'story' },
  { platform: 'instagram', type: 'reels' },
  { platform: 'instagram', type: 'post' },
  { platform: 'instagram', type: 'story' },
  { platform: 'tiktok', type: 'video' },
  { platform: 'tiktok', type: 'story' },
  { platform: 'youtube', type: 'shorts' },
  { platform: 'youtube', type: 'video' },
  { platform: 'ugc', type: 'video' },
  { platform: 'ugc', type: 'photo' },
];

export function scopePairKey(item: { platform: string; type: string }): string {
  return `${item.platform}:${item.type}`;
}

// "Instagram Reels". Unknown values fall back to the raw strings - a
// counter from the business can hold a pair this app doesn't list.
export function scopeItemLabel(item: { platform: string; type: string }): string {
  const platform = PLATFORM_LABELS[item.platform] ?? item.platform;
  const type = DELIVERABLE_TYPE_LABELS[item.type] ?? item.type;
  return `${platform} ${type}`;
}

// Editor rows from any list that carries ids (campaign deliverables, the
// engagement's scope).
export function scopeFromList(
  items: readonly { platform: string; type: string; count: number }[],
): ScopeItem[] {
  return items.map(({ platform, type, count }) => ({ platform, type, count }));
}

export type ScopeValidation =
  | { ok: true; scope: ScopeItem[] }
  | { ok: false; error: string | null; rowErrors: Record<number, string> };

export function validateScope(rows: readonly ScopeItem[]): ScopeValidation {
  if (rows.length === 0) return { ok: false, error: SCOPE_MESSAGES.empty, rowErrors: {} };
  if (rows.length > SCOPE_MAX_ITEMS) {
    return { ok: false, error: SCOPE_MESSAGES.tooMany, rowErrors: {} };
  }

  const rowErrors: Record<number, string> = {};
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    if (
      !Number.isInteger(row.count) ||
      row.count < SCOPE_MIN_COUNT ||
      row.count > SCOPE_MAX_COUNT
    ) {
      rowErrors[index] = SCOPE_MESSAGES.count;
    }
    const key = scopePairKey(row);
    if (seen.has(key)) rowErrors[index] = SCOPE_MESSAGES.duplicate;
    seen.add(key);
  });

  if (Object.keys(rowErrors).length) return { ok: false, error: null, rowErrors };
  return { ok: true, scope: scopeFromList(rows) };
}

// Order-insensitive (platform, type, count) equality - the backend's rule
// for `scopeChanged`. Used to leave `scope` out of a request when the creator
// didn't actually change anything.
export function isSameScope(a: readonly ScopeItem[], b: readonly ScopeItem[]): boolean {
  if (a.length !== b.length) return false;
  const counts = new Map(a.map(item => [scopePairKey(item), item.count]));
  return b.every(item => counts.get(scopePairKey(item)) === item.count);
}

// Backend 422 -> row index -> message. The service's duplicate check reports
// flat keys (`errors["scope[2]"]`). class-validator's nested `errors.scope`
// tree never reaches the screens: services/http.ts's ApiError keeps only
// string-valued error maps. Client validation already blocks those shape
// errors, and anything else falls back to the error message.
export function scopeErrorsFromApi(
  errors: Record<string, string> | null | undefined,
): Record<number, string> {
  const rowErrors: Record<number, string> = {};
  for (const [key, value] of Object.entries(errors ?? {})) {
    const match = /^scope\[(\d+)\]$/.exec(key);
    if (match) rowErrors[Number(match[1])] = value;
  }
  return rowErrors;
}

// A list-level scope message from a 422 (e.g. "scope must contain at least 1
// elements"), when the backend sent one as a string.
export function scopeListErrorFromApi(
  errors: Record<string, string> | null | undefined,
): string | null {
  return errors?.scope ?? null;
}

// Options for the "Add deliverable" OptionSheet: catalog pairs not already
// listed. The scene owns the sheet (it must be a sibling of its ScrollView -
// see CustomSelectField), so these helpers live here rather than in the
// editor element.
export function addableScopeOptions(
  rows: readonly ScopeItem[],
): { label: string; value: string }[] {
  const listed = new Set(rows.map(scopePairKey));
  return SCOPE_CATALOG.filter(item => !listed.has(scopePairKey(item))).map(item => ({
    label: scopeItemLabel(item),
    value: scopePairKey(item),
  }));
}

// Appends the picked catalog pair with count 1. Unchanged when the value is
// unknown, already listed, or the list is full.
export function addScopeItem(rows: readonly ScopeItem[], value: string): ScopeItem[] {
  const item = SCOPE_CATALOG.find(candidate => scopePairKey(candidate) === value);
  if (!item || rows.length >= SCOPE_MAX_ITEMS) return [...rows];
  if (rows.some(row => scopePairKey(row) === value)) return [...rows];
  return [...rows, { platform: item.platform, type: item.type, count: 1 }];
}
