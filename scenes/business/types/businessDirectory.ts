import { CreatorReputation, ReputationBrief } from '@/scenes/creator/types/creatorDirectory';

export type BusinessVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface BusinessSocialLink {
  platform: string;
  handle: string;
}

// Mirrors the backend's BusinessProfileDirectoryItemDto (RBAC API group §E1,
// GET /business-profiles - the paginated directory row).
export interface BusinessDirectoryItem {
  userId: string;
  businessName: string;
  username: string | null;
  description: string | null;
  categories: string[];
  subcategories: string[];
  country: string | null;
  state: string | null;
  city: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  avatarUrl: string | null;
  verificationStatus: BusinessVerificationStatus;
  createdAt: string;
  updatedAt: string;
  /** Backend 23b - the rating brief every directory row carries. */
  reputation?: ReputationBrief;
}

// Mirrors the backend's BusinessProfilePublicDto (RBAC API group §E2, GET
// /business-profiles/:userId - the public single-profile page). A superset
// of the directory row's fields, plus socialLinks/coverUrl/handle and no
// updatedAt.
export interface BusinessProfilePublic {
  userId: string;
  businessName: string;
  username: string | null;
  description: string | null;
  categories: string[];
  subcategories: string[];
  socialLinks: BusinessSocialLink[];
  country: string | null;
  state: string | null;
  city: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  verificationStatus: BusinessVerificationStatus;
  handle: string | null;
  createdAt: string;
  /** Backend 23b - from the reviews creators wrote about this business;
   * `completedEngagements` counts completed engagements across its campaigns. */
  reputation?: CreatorReputation;
}

export interface BusinessDirectoryPageArgs {
  page: number;
  limit: number;
}
