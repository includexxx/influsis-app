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

// Mirrors the backend's CreatorProfilePublicDto (RBAC API group §E4, GET
// /creator-profiles/:userId - the public single-profile page). Unlike the
// business profile, a creator's contact details aren't in the public
// listing at all except `email`/`phone`, which the backend documents as the
// creator-facing presence rather than personal contact info.
export interface CreatorProfilePublic {
  userId: string;
  displayName: string;
  bio: string | null;
  email: string | null;
  phone: string | null;
  categories: string[];
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
