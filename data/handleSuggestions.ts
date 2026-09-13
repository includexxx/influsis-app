// Deterministic handle suggestions for the creator onboarding Username step
// (build-plan 20g). Shown only when the chosen handle comes back taken or
// reserved. There is no backend suggestion service, so this is a pure client
// heuristic over the name and city the creator already entered: a slugified
// name plus a small fixed set of suffixes. Every candidate is run through
// `handleSchema` so a shown chip always passes the format rules, the taken
// handle is never suggested back, and the list is capped at 3. Returns `[]`
// when the name yields no usable slug.
import { handleSchema } from '@/utils/onboardingSchemas';

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function generateHandleSuggestions(
  name?: string,
  city?: string,
  takenHandle?: string,
): string[] {
  const base = slugify(name ?? '');
  if (!base) return [];

  const citySlug = slugify(city ?? '');
  const candidates = [
    `${base}1`,
    citySlug ? `${base}_${citySlug}` : `${base}.creator`,
    `${base}.creator`,
    `${base}_creator`,
  ];

  const seen = new Set<string>();
  const suggestions: string[] = [];
  for (const candidate of candidates) {
    if (candidate === takenHandle || seen.has(candidate)) continue;
    seen.add(candidate);
    if (!handleSchema.safeParse(candidate).success) continue;
    suggestions.push(candidate);
    if (suggestions.length === 3) break;
  }
  return suggestions;
}
