export type ProfileKind = 'business' | 'creator' | 'admin';

export interface CreatorPortfolioItem {
  url: string;
  /** Free-text key, not a closed enum — a client that can't classify a link
   * (e.g. Facebook, a blog) sends its own fallback value. This app sends
   * `'others'` for anything `detectPlatform()` can't recognize. */
  platform: string;
  thumbnailUrl: string | null;
}

export interface CreatorProfilePlatform {
  platform: string;
  handle: string | null;
}

/**
 * Shape of `creator_profile` (+ its child rows) returned by
 * `GET/PATCH /profiles/me` and `POST /profiles/onboarding-creator`. This app
 * only ships the creator role today, so screens type the response as this
 * directly rather than the full business/creator/admin union the backend's
 * `MyProfileResponseDto` documents — see `isCreatorProfileResponse` below for
 * the one place that distinction actually matters.
 */
export interface CreatorProfile {
  id: string;
  name: string;
  bio: string | null;
  categories: string[];
  subcategories: string[];
  languages: string[];
  deliverables: string[];
  platforms: CreatorProfilePlatform[];
  portfolio: CreatorPortfolioItem[];
  /** ISO date or date-time string, or null. */
  dateOfBirth: string | null;
  gender: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  isDiscoverable: boolean;
  verificationDocumentsUrl: string | null;
  verificationStatus: string;
  verificationNotes: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `GET|PATCH /profiles/me` and `POST /profiles/onboarding-creator`. */
export interface MyProfileResponse {
  kind: ProfileKind;
  handle: string | null;
  profile: CreatorProfile;
}

/**
 * Narrows a `MyProfileResponse` to the creator kind. A business/admin account
 * hitting a creator-only screen should get a clear "not applicable" message
 * instead of rendering fields that were never returned.
 */
export function isCreatorProfileResponse(
  response: MyProfileResponse,
): response is MyProfileResponse & { kind: 'creator' } {
  return response.kind === 'creator';
}

export interface PortfolioItemRequest {
  url: string;
  platform: string;
  /** Media key or absolute URL. */
  thumbnail?: string;
}

/**
 * `POST /profiles/onboarding-creator` body. Wire names differ from storage —
 * `zip` -> `postalCode`, `profilePhoto`/`coverPhoto` -> `avatarUrl`/`coverUrl` —
 * see `utils/onboardingPayload.ts`.
 */
export interface OnboardCreatorProfileRequest {
  name?: string;
  gender?: string;
  dateOfBirth?: string;
  bio?: string;
  country?: string;
  state?: string;
  city?: string;
  zip?: string;
  address?: string;
  handle?: string;
  categories?: string[];
  subcategories?: string[];
  languages?: string[];
  deliverables?: string[];
  portfolio?: PortfolioItemRequest[];
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  profilePhoto?: string;
  coverPhoto?: string;
  isDiscoverable?: boolean;
}

/**
 * `PATCH /profiles/me` body — STORAGE names, not the onboarding wire names
 * (`postalCode` not `zip`, `avatarUrl`/`coverUrl` not `profilePhoto`/`coverPhoto`).
 * `null` explicitly clears a nullable field; an omitted key leaves it
 * unchanged — see `utils/profileMappers.ts`.
 *
 * Deliberately excludes `phoneCountryCode`: that field is business-only and
 * 422s `notApplicableForProfileKind` for a creator account.
 */
export interface UpdateMyProfileRequest {
  name?: string;
  handle?: string;
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  isDiscoverable?: boolean;
  categories?: string[];
  subcategories?: string[];
  languages?: string[];
  deliverables?: string[];
  portfolio?: PortfolioItemRequest[];
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;
  address?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  websiteUrl?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
}

/** `POST /media` response (HTTP 201). */
export interface MediaUploadResponse {
  id: string;
  key: string;
  url: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}
