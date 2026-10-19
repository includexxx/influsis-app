// The scheme + host (+ port) of the API base URL, which is where the
// Socket.io server listens: `http://10.0.2.2:3000/api/v1` ->
// `http://10.0.2.2:3000`. A regex, because React Native's URL polyfill does
// not implement `origin`.
export function socketOrigin(apiUrl: string): string {
  const match = /^(https?:\/\/[^/?#]+)/i.exec(apiUrl.trim());
  if (!match) throw new Error(`Not an http(s) API URL: ${apiUrl}`);
  return match[1];
}

/** The backend's realtime namespace (ARCHITECTURE §8). */
export const REALTIME_NAMESPACE = '/realtime';
