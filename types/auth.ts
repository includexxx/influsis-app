export interface AuthTokens {
  token: string;
  refreshToken: string;
  /** Epoch milliseconds. */
  tokenExpires: number;
}

export type SessionAccountStatus =
  | 'active'
  | 'pending'
  | 'invited'
  | 'suspended'
  | 'deactivated'
  | 'unverified';

export interface AuthRole {
  key: string;
  displayName: string;
  description: string;
  isInternal: boolean;
  requires2fa: boolean;
  permissionsVersion: number;
  sortOrder: number;
}

export interface AuthProfileSummary {
  kind: 'business' | 'creator' | 'admin';
  displayName: string;
  avatarUrl: string | null;
  verificationStatus: string;
}

/** Shape of `GET /auth/me` (`MeResponseDto`). */
export interface AuthAccount {
  id: string;
  roleKey: string;
  status: SessionAccountStatus;
  role: AuthRole | null;
  createdAt: string;
  deactivatedAt: string | null;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  handle: string | null;
  profile: AuthProfileSummary | null;
}
