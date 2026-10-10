import { CampaignObjective } from '../types/campaignFeed';
import { ScopeItem } from '../types/myEngagement';
import { DELIVERABLE_TYPE_LABELS, PLATFORM_LABELS } from './mapCampaignDetails';
import { isCustomItem, LEGACY_PAIRS, OBJECTIVE_OPTIONS, objectiveOptionLabel } from './objectives';

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

export function scopePairKey(item: { platform: string; type: string }): string {
  return `${item.platform}:${item.type}`;
}

// A React key for one row of a rendered list. Custom items (18q) all share
// the `custom:custom` pair and may repeat, so they're keyed by position.
export function scopeRowKey(item: { platform: string; type: string }, index: number): string {
  return isCustomItem(item) ? `custom:${index}` : scopePairKey(item);
}

// A custom item's own title; otherwise the objective's name for the pair
// ("Image for Instagram") when given and listed, else "Instagram Reels".
// Unknown values fall back to the raw strings - a counter from the business
// can hold a pair this app doesn't list, and a retired `ugc` pair keeps its
// generic name.
export function scopeItemLabel(
  item: { platform: string; type: string; title?: string | null },
  objective?: CampaignObjective | null,
): string {
  if (isCustomItem(item)) return item.title || 'Custom deliverable';
  const objectiveLabel = objectiveOptionLabel(objective, item);
  if (objectiveLabel) return objectiveLabel;
  const platform = PLATFORM_LABELS[item.platform] ?? item.platform;
  const type = DELIVERABLE_TYPE_LABELS[item.type] ?? item.type;
  return `${platform} ${type}`;
}

// Editor rows from any list that carries ids (campaign deliverables, the
// engagement's scope). Custom items keep their title and description
// untouched - the server compares them byte for byte for `scopeChanged` and
// rejects either field on a catalogue item, so catalogue rows drop them.
export function scopeFromList(
  items: readonly {
    platform: string;
    type: string;
    count: number;
    title?: string | null;
    description?: string | null;
  }[],
): ScopeItem[] {
  return items.map(({ platform, type, count, title, description }) =>
    isCustomItem({ platform })
      ? { platform, type, count, title: title ?? null, description: description ?? null }
      : { platform, type, count },
  );
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
    // Custom items may repeat (the backend's unique pair index skips them).
    if (isCustomItem(row)) return;
    const key = scopePairKey(row);
    if (seen.has(key)) rowErrors[index] = SCOPE_MESSAGES.duplicate;
    seen.add(key);
  });

  if (Object.keys(rowErrors).length) return { ok: false, error: null, rowErrors };
  return { ok: true, scope: scopeFromList(rows) };
}

// Order-insensitive equality over (platform, type, count, title,
// description) - the backend's rule for `scopeChanged` (18q: editing only a
// custom title or description is a change). Used to leave `scope` out of a
// request when the creator didn't actually change anything. A multiset
// compare, because custom items may repeat.
export function isSameScope(a: readonly ScopeItem[], b: readonly ScopeItem[]): boolean {
  if (a.length !== b.length) return false;
  const signature = (item: ScopeItem) =>
    JSON.stringify([
      item.platform,
      item.type,
      item.count,
      item.title ?? null,
      item.description ?? null,
    ]);
  const remaining = new Map<string, number>();
  for (const item of a) {
    const key = signature(item);
    remaining.set(key, (remaining.get(key) ?? 0) + 1);
  }
  for (const item of b) {
    const key = signature(item);
    const left = remaining.get(key) ?? 0;
    if (left === 0) return false;
    remaining.set(key, left - 1);
  }
  return true;
}

// Backend 422 -> row index -> message. The service's rule checks report
// flat keys: `errors["scope[2]"]`, and for a custom item (18q)
// `errors["scope[2].title"]` / `errors["scope[2].description"]`. The first
// message per row wins. class-validator's nested `errors.scope` tree never
// reaches the screens: services/http.ts's ApiError keeps only string-valued
// error maps. Client validation already blocks those shape errors, and
// anything else falls back to the error message.
export function scopeErrorsFromApi(
  errors: Record<string, string> | null | undefined,
): Record<number, string> {
  const rowErrors: Record<number, string> = {};
  for (const [key, value] of Object.entries(errors ?? {})) {
    const match = /^scope\[(\d+)\](?:\.(?:title|description))?$/.exec(key);
    if (match && !(Number(match[1]) in rowErrors)) rowErrors[Number(match[1])] = value;
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

// The pairs a campaign may ask for: its objective's options, or every
// non-retired pair for a campaign created before 18q (no objective).
function catalogFor(
  objective: CampaignObjective | null,
): readonly { platform: string; type: string }[] {
  return objective ? (OBJECTIVE_OPTIONS[objective] ?? []) : LEGACY_PAIRS;
}

// Options for the "Add deliverable" OptionSheet: the campaign objective's
// pairs not already listed, under the objective's labels. The scene owns the
// sheet (it must be a sibling of its ScrollView - see CustomSelectField), so
// these helpers live here rather than in the editor element. Creators can't
// write a new custom item here; they only keep or adjust the business's.
export function addableScopeOptions(
  rows: readonly ScopeItem[],
  objective: CampaignObjective | null,
): { label: string; value: string }[] {
  const listed = new Set(rows.map(scopePairKey));
  return catalogFor(objective)
    .filter(item => !listed.has(scopePairKey(item)))
    .map(item => ({ label: scopeItemLabel(item, objective), value: scopePairKey(item) }));
}

// Appends the picked pair with count 1. Unchanged when the value isn't
// offered for the objective, is already listed, or the list is full.
export function addScopeItem(
  rows: readonly ScopeItem[],
  value: string,
  objective: CampaignObjective | null,
): ScopeItem[] {
  const item = catalogFor(objective).find(candidate => scopePairKey(candidate) === value);
  if (!item || rows.length >= SCOPE_MAX_ITEMS) return [...rows];
  if (rows.some(row => scopePairKey(row) === value)) return [...rows];
  return [...rows, { platform: item.platform, type: item.type, count: 1 }];
}
