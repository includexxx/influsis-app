// "Good morning" / "Good afternoon" / "Good evening" for Home's greeting,
// from the device's local time. `now` is a parameter for tests.
export function greetingFor(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// The name Home greets the creator by: the first word of their profile name,
// else "@handle", else a neutral fallback.
export function greetingName(
  profile: { handle: string | null; profile?: { name?: string | null } | null } | undefined,
): string {
  const first = profile?.profile?.name?.trim().split(/\s+/)[0];
  if (first) return first;
  if (profile?.handle) return `@${profile.handle}`;
  return 'there';
}
