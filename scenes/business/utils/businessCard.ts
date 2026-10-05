import { BusinessDirectoryItem } from '../types/businessDirectory';

// "Dhaka, Bangladesh" from a directory row's city/country, or null when
// neither is set. The state is left out to keep the line short.
export function formatBusinessLocation(
  business: Pick<BusinessDirectoryItem, 'city' | 'country'>,
): string | null {
  const parts = [business.city, business.country].map(part => part?.trim()).filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}
