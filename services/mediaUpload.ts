import { PickedImageAsset, PortfolioEntry } from '@/utils/onboardingSchemas';
import { MediaUploadResponse } from '@/types';
import { CreatorOnboardingState } from '@/slices/creatorOnboarding.slice';
import { request } from './http';

/**
 * Uploads one locally-picked image to `POST /media` and returns its managed
 * `key` (to be sent as `profilePhoto`/`coverPhoto`/`portfolio[].thumbnail` on
 * a profile write). Not RTK Query: `httpClient` hardcodes
 * `'Content-Type': 'application/json'` as an instance default, and the RTK
 * Query base query (services/baseQuery.ts) has no way to override it per
 * request — this calls `request()` directly instead, with a one-off header.
 *
 * If `asset.uri` already points at an http(s) URL, it's an existing server
 * value (e.g. re-editing a profile whose photo was never re-picked), not a
 * new local file — pass it through unchanged rather than re-uploading it.
 */
export async function uploadPickedImage(
  asset: PickedImageAsset,
  fallbackName = 'upload.jpg',
): Promise<string> {
  if (/^https?:\/\//i.test(asset.uri)) {
    return asset.uri;
  }

  // RN's FormData accepts a `{ uri, name, type }` file part; the DOM lib
  // types only know `string | Blob`, hence the cast.
  const form = new FormData();
  form.append('file', {
    uri: asset.uri,
    name: asset.fileName ?? fallbackName,
    type: asset.mimeType ?? 'image/jpeg',
  } as unknown as Blob);

  const media = await request<MediaUploadResponse>({
    url: '/media',
    method: 'POST',
    data: form,
    // Per-request override of httpClient's json default; RN's XHR fills in
    // the multipart boundary itself.
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return media.key;
}

/**
 * Uploads every portfolio entry's thumbnail (skipping entries without one),
 * keyed by entry `id` rather than array index — `Promise.all` resolves out of
 * order, and the id is what the mapping layer uses to reattach the key to the
 * right entry afterwards.
 */
export async function uploadPortfolioThumbnails(
  entries: PortfolioEntry[],
): Promise<Record<string, string>> {
  const withThumbnails = entries.filter(entry => entry.thumbnail);
  if (withThumbnails.length === 0) return {};

  const uploaded = await Promise.all(
    withThumbnails.map(async entry => {
      const key = await uploadPickedImage(
        entry.thumbnail as PickedImageAsset,
        `portfolio-${entry.id}.jpg`,
      );
      return [entry.id, key] as const;
    }),
  );

  return Object.fromEntries(uploaded);
}

export interface OnboardingMediaKeys {
  profilePhoto?: string;
  coverPhoto?: string;
  /** Portfolio entry id -> uploaded media key. */
  portfolioThumbnails?: Record<string, string>;
}

/**
 * Uploads every local image in a creator-onboarding draft (profile photo,
 * cover photo, and each portfolio thumbnail) in parallel. Lets the first
 * rejection propagate — it's already an `ApiError` — rather than swallowing a
 * failed upload, since a half-uploaded portfolio silently missing an image is
 * worse than surfacing the failure and letting the user retry.
 */
export async function uploadOnboardingMedia(
  state: CreatorOnboardingState,
): Promise<OnboardingMediaKeys> {
  const [profilePhoto, coverPhoto, portfolioThumbnails] = await Promise.all([
    state.profilePhoto ? uploadPickedImage(state.profilePhoto, 'profile-photo.jpg') : undefined,
    state.coverPhoto ? uploadPickedImage(state.coverPhoto, 'cover-photo.jpg') : undefined,
    uploadPortfolioThumbnails(state.portfolio ?? []),
  ]);

  return { profilePhoto, coverPhoto, portfolioThumbnails };
}
