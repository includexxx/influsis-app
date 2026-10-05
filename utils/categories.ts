// Directory category slugs ("food-and-beverage", "fintech") as display text,
// shared by the Businesses and Top Creators cards.

// "food-and_beverage" -> "Food and beverage".
export function formatCategory(slug: string): string {
  const words = slug.trim().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : '';
}

// The first `max` categories as display text, plus how many were left out
// (shown as a "+N" chip).
export function visibleCategories(
  categories: readonly string[],
  max: number,
): { shown: string[]; extra: number } {
  const labels = categories.map(formatCategory).filter(Boolean);
  return { shown: labels.slice(0, max), extra: Math.max(0, labels.length - max) };
}
