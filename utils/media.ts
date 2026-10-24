const LOCALHOST_ORIGIN = process.env.EXPO_API_ORIGIN || 'http://192.168.68.106:3001';

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url?.startsWith('http')) return url;
  return `${LOCALHOST_ORIGIN}${url}`;
}
