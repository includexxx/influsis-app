import { ReactElement } from 'react';
import { useLocalSearchParams, Redirect, Href } from 'expo-router';

export interface UseDetailLookupResult<T> {
  item: T | undefined;
  notFoundElement: ReactElement | null;
}

// Shared "find the tapped item by id, or redirect home" pattern used by
// every detail screen (Gig/Influencer/Brand/Campaign Details) - each reads
// its own `id` route param, looks it up in its own canonical list, and
// redirects to a fallback route (a stale deep link, an unmatched id) rather
// than rendering a broken page. Centralizes what was previously 4 separate
// copy-pasted `useLocalSearchParams` + `.find` + `<Redirect>` 3-liners.
export function useDetailLookup<T extends { id: string }>(
  list: T[],
  fallbackHref: Href = '/home',
): UseDetailLookupResult<T> {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = list.find(entry => entry.id === id);
  const notFoundElement = item ? null : <Redirect href={fallbackHref} />;

  return { item, notFoundElement };
}
