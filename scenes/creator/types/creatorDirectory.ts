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
  /** Backend 23b - the rating brief every directory row carries. */
  reputation?: ReputationBrief;
}

// Backend 23b `reputation` on a directory row (E1/E3): no completed count.
export interface ReputationBrief {
  averageRating: number | null;
  reviewCount: number;
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
  /** Backend 23b - computed on read from visible, non-hidden reviews. */
  reputation?: CreatorReputation;
}

// Backend 23b `reputation` on a single profile read (E4). `averageRating` is
// 0-5 to one decimal, or null with no visible reviews ("New", never 0
// stars). `completedEngagements` counts every completed engagement,
// reviewed or not, hidden from the portfolio or not.
export interface CreatorReputation extends ReputationBrief {
  completedEngagements: number;
}

// One row of campaign API CK3, GET /creator-profiles/:userId/reviews - a
// visible, non-hidden review a business wrote about the creator. `message`
// is plain text. A gone reviewer reads as "Former Influsis member" with
// `handle`/`avatarUrl` null.
export interface ProfileReview {
  id: string;
  rating: number;
  message: string;
  submittedAt: string;
  reviewer: {
    userId: string;
    displayName: string;
    handle: string | null;
    avatarUrl: string | null;
  };
  campaign: { id: string; title: string };
}

// CK3/CK4 (reviews), CK5 (public Campaign work) - one page of a profile's list.
export interface CreatorReviewsPageArgs {
  userId: string;
  page: number;
  limit: number;
}

export interface CreatorDirectoryPageArgs {
  page: number;
  limit: number;
}
