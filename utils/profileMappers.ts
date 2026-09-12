import { nanoid } from '@reduxjs/toolkit';
import { MyProfileResponse, UpdateMyProfileRequest } from '@/types';
import { EditProfileValues } from './profileSchemas';

/**
 * Maps a `GET /profiles/me` response onto `EditProfileValues` so the edit
 * form can seed its `defaultValues`. Nulls become the field's "empty" value
 * (`''` / `[]`) since the form itself is what turns a blank field back into
 * an explicit `null` on submit — see `toUpdateMyProfileRequest` below.
 */
export function toEditProfileDefaults(response: MyProfileResponse): EditProfileValues {
  const { profile } = response;

  return {
    name: profile.name,
    handle: response.handle ?? '',
    avatarPhoto: profile.avatarUrl ? { uri: profile.avatarUrl } : undefined,
    coverPhoto: profile.coverUrl ? { uri: profile.coverUrl } : undefined,
    gender: (profile.gender as EditProfileValues['gender']) ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    bio: profile.bio ?? '',
    country: (profile.country as EditProfileValues['country']) ?? '',
    state: (profile.state as EditProfileValues['state']) ?? '',
    city: profile.city ?? '',
    postalCode: profile.postalCode ?? '',
    address: profile.address ?? '',
    contactEmail: profile.contactEmail ?? '',
    contactPhone: profile.contactPhone ?? '',
    websiteUrl: profile.websiteUrl ?? '',
    categories: profile.categories,
    subcategories: profile.subcategories,
    languages: profile.languages,
    deliverables: profile.deliverables,
    // The server doesn't return a client-side list key — `useFieldArray` and
    // `PortfolioEntryCard` both need a stable `id`, so mint one per item.
    portfolio: profile.portfolio.map(item => ({
      id: nanoid(),
      url: item.url,
      platform: item.platform,
      thumbnail: item.thumbnailUrl ? { uri: item.thumbnailUrl } : undefined,
    })),
    isDiscoverable: profile.isDiscoverable,
  };
}

export interface EditProfileMediaKeys {
  avatarUrl?: string;
  coverUrl?: string;
  portfolioThumbnails?: Record<string, string>;
}

/**
 * `''` -> explicit `null` for a dirty nullable field. `UpdateMyProfileDto`
 * transforms an empty string to "leave unchanged" server-side (the same
 * transform runs on JSON bodies, not just multipart), so the only way to
 * actually clear a field like bio or website is to send `null`.
 */
function nullable(value: string): string | null {
  return value === '' ? null : value;
}

/**
 * Builds the `PATCH /profiles/me` body from the edit form's current values,
 * touching only the fields react-hook-form marked dirty. Untouched
 * `categories`/`subcategories`/`languages`/`deliverables`/`portfolio` are
 * full-set replacements server-side, so resending them unchanged would
 * needlessly delete-and-reinsert their child rows on every save.
 */
export function toUpdateMyProfileRequest(
  values: EditProfileValues,
  dirtyFields: Partial<Record<keyof EditProfileValues, unknown>>,
  media: EditProfileMediaKeys = {},
): UpdateMyProfileRequest {
  const body: UpdateMyProfileRequest = {};
  const isDirty = (key: keyof EditProfileValues) => !!dirtyFields[key];

  if (isDirty('name')) body.name = values.name.trim();
  if (isDirty('handle') && values.handle) body.handle = values.handle;

  if (isDirty('gender')) body.gender = nullable(values.gender ?? '');
  if (isDirty('dateOfBirth')) body.dateOfBirth = nullable(values.dateOfBirth ?? '');
  if (isDirty('bio')) body.bio = nullable(values.bio ?? '');

  if (isDirty('country')) body.country = nullable(values.country ?? '');
  if (isDirty('state')) body.state = nullable(values.state ?? '');
  if (isDirty('city')) body.city = nullable(values.city ?? '');
  if (isDirty('postalCode')) body.postalCode = nullable(values.postalCode ?? '');
  if (isDirty('address')) body.address = nullable(values.address ?? '');

  if (isDirty('contactEmail')) body.contactEmail = nullable(values.contactEmail ?? '');
  if (isDirty('contactPhone')) body.contactPhone = nullable(values.contactPhone ?? '');
  if (isDirty('websiteUrl')) body.websiteUrl = nullable(values.websiteUrl ?? '');

  if (isDirty('categories')) body.categories = values.categories;
  if (isDirty('subcategories')) body.subcategories = values.subcategories;
  if (isDirty('languages')) body.languages = values.languages;
  if (isDirty('deliverables')) body.deliverables = values.deliverables;

  if (isDirty('portfolio')) {
    body.portfolio = values.portfolio.map(entry => ({
      url: entry.url.trim(),
      platform: entry.platform,
      thumbnail: media.portfolioThumbnails?.[entry.id],
    }));
  }

  if (isDirty('avatarPhoto')) body.avatarUrl = media.avatarUrl ?? null;
  if (isDirty('coverPhoto')) body.coverUrl = media.coverUrl ?? null;

  if (isDirty('isDiscoverable')) body.isDiscoverable = values.isDiscoverable;

  return body;
}
