// Incoming notification links (build-plan 38d1). Email buttons point at
// `${CREATOR_APP_LINK_URL}${path}?n={notificationId}` (backend
// notification-links.ts); the same paths arrive through the `influsis://`
// scheme, the web build, and the dev client. Pure string handling: React
// Native's URL polyfill is incomplete.

// The 38a route table (route-map.ts) plus the digest and manage links.
const NOTIFICATION_PATHS: RegExp[] = [
  /^\/engagement\/[^/]+$/,
  /^\/engagement\/[^/]+\/submit-delivery$/,
  /^\/engagement\/[^/]+\/review$/,
  /^\/campaign\/[^/]+$/,
  /^\/my-profile$/,
  /^\/notifications$/,
  /^\/notification-settings$/,
];

/** The app path + query of any link form, or null if it isn't one. */
function toAppPath(url: string): string | null {
  let rest = url.trim();
  const hash = rest.indexOf('#');
  if (hash >= 0) rest = rest.slice(0, hash);

  // Dev client / Expo Go: `exp://host:8081/--/engagement/e-1`.
  const dev = rest.indexOf('/--/');
  if (dev >= 0) return rest.slice(dev + 3);

  const scheme = /^([a-z][a-z0-9+.-]*):\/\/(.*)$/i.exec(rest);
  if (!scheme) return rest.startsWith('/') ? rest : null;

  const after = scheme[2];
  if (/^https?$/i.test(scheme[1])) {
    // Drop the host: `app.influsis.com/engagement/e-1?n=1`.
    const start = after.search(/[/?]/);
    if (start < 0) return '/';
    const path = after.slice(start);
    return path.startsWith('/') ? path : `/${path}`;
  }
  // A custom scheme's "host" is the first path segment, as Expo Router reads
  // `influsis://engagement/e-1`.
  return `/${after.replace(/^\/+/, '')}`;
}

/**
 * The path (with its query) a notification link opens, or null when the
 * link isn't for a notification screen - those are never held across
 * sign-in.
 */
export function notificationLinkPath(url: string): string | null {
  const full = toAppPath(url);
  if (!full) return null;
  const q = full.indexOf('?');
  let path = q < 0 ? full : full.slice(0, q);
  const query = q < 0 ? '' : full.slice(q);
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return NOTIFICATION_PATHS.some(re => re.test(path)) ? `${path}${query}` : null;
}

/** The `n` (notification id) query value of a path or URL, or null. */
export function readParam(url: string): string | null {
  const q = url.indexOf('?');
  if (q < 0) return null;
  const query = url.slice(q + 1).split('#')[0];
  for (const part of query.split('&')) {
    const eq = part.indexOf('=');
    const key = eq < 0 ? part : part.slice(0, eq);
    if (key !== 'n') continue;
    const value = eq < 0 ? '' : decodeURIComponent(part.slice(eq + 1).replace(/\+/g, ' '));
    return value || null;
  }
  return null;
}
