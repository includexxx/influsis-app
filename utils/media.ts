import config from './config';

// The backend's local dev setup bakes its own `http://localhost:<port>` (or
// `127.0.0.1`) into absolute media URLs it returns (avatarUrl/coverUrl/
// portfolio thumbnailUrl), based on how it sees itself, not how a client
// reaches it. That resolves fine on the machine running the backend, but
// "localhost" from a physical device or emulator points at the device
// itself, so the image request never reaches the dev machine and the image
// never loads. `API_URL` in .env.dev is already set to the reachable LAN
// host for this exact reason — reuse its origin for any media URL the
// backend mistakenly stamped as localhost. A real CDN/production URL never
// matches this pattern, so this is a no-op outside local dev.
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;

function apiOrigin(): string | null {
  const match = config.apiUrl?.match(/^https?:\/\/[^/]+/i);
  return match ? match[0] : null;
}

/** Rewrites a `localhost`/`127.0.0.1` media URL onto the app's configured
 * API host so it's reachable from a device/emulator; any other URL (a real
 * CDN host, or already-correct) passes through unchanged. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!LOCALHOST_ORIGIN.test(url)) return url;
  const origin = apiOrigin();
  if (!origin) return url;
  return url.replace(LOCALHOST_ORIGIN, origin);
}
