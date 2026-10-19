/** Badge text for an unread count: the number up to 99, then `99+` (backend NT2). */
export function formatBadgeCount(count: number): string {
  return count > 99 ? '99+' : String(count);
}
