export type CreatorVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

// Mirrors the backend's CreatorProfileDirectoryItemDto (RBAC API group §E3,
// GET /creator-profiles - the paginated directory row).
export interface CreatorDirectoryItem {
  userId: string;
  displayName: string;
  categories: string[];
  country: string | null;
  state: string | null;
  city: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  avatarUrl: string | null;
  isDiscoverable: boolean;
  verificationStatus: CreatorVerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorPublicPlatform {
  /** facebook | instagram | youtube | tiktok */
  platform: string;
  /** Bare handle, not a URL. */
  handle: string | null;
}

export interface CreatorPublicPortfolioItem {
  url: string;
  /** Free text (instagram, youtube, tiktok, others, ...). */
  platform: string;
  /** Absolute URL, or null. */
  thumbnailUrl: string | null;
}

// Mirrors the backend's CreatorProfilePublicDto (RBAC API group §E4, GET
// /creator-profiles/:userId - the public single-profile page): the
// creator-facing presence only. Unlike a business profile, a creator's
// contact and personal details (email, phone, date of birth, gender,
// address, postal code) are never public, and `deliverables` is owner-only.
export interface CreatorProfilePublic {
  userId: string;
  displayName: string;
  bio: string | null;
  categories: string[];
  subcategories: string[];
  languages: string[];
  platforms: CreatorPublicPlatform[];
  portfolio: CreatorPublicPortfolioItem[];
  country: string | null;
  state: string | null;
  city: string | null;
  websiteUrl: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  verificationStatus: CreatorVerificationStatus;
  handle: string | null;
  createdAt: string;
}

export interface CreatorDirectoryPageArgs {
  page: number;
  limit: number;
}
