// Neither directory row nor public profile has a single "location" string
// (the backend splits it into city/state/country) - CreatorCard needs one
// display string, so this joins whichever parts are set the same way the
// mock data's "City, Country" labels read (e.g. "Dhaka, Bangladesh").
export function formatCreatorLocation(
  city: string | null,
  state: string | null,
  country: string | null,
): string {
  const parts = [city, state, country].filter((part): part is string => !!part);
  return parts.length ? parts.join(', ') : 'Location not set';
}

// The single letter shown in place of a creator's avatar photo when
// `avatarUrl` is null - same reasoning as
// scenes/business/utils/businessAvatar.ts's getBusinessInitial.
export function getCreatorInitial(displayName: string): string {
  const trimmed = displayName.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}
