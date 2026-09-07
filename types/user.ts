export interface User {
  name: string;
  email: string;
}

export type RoleKey =
  | 'business'
  | 'creator'
  | 'support'
  | 'finance_admin'
  | 'moderator'
  | 'admin'
  | 'super_admin';

export type AccountStatus =
  | 'unverified'
  | 'pending'
  | 'active'
  | 'invited'
  | 'suspended'
  | 'deactivated';

export interface AuthRole {
  key: string;
  displayName: string;
  description: string;
  isInternal: boolean;
  requires2fa: boolean;
  permissionsVersion: number;
  sortOrder: number;
}

// `tokenExpires` is epoch milliseconds, not seconds. This is the shape
// persisted by services/tokenStore.ts.
export interface AuthTokens {
  token: string;
  refreshToken: string;
  tokenExpires: number;
}

// GROUP_D describes this only as "a profile summary once the caller onboards
// one" with no field list. 19b / feature 21 replace it with real fields once a
// live GET /auth/me response is captured. 19a never reads into it.
export type AuthProfileSummary = Record<string, unknown>;

// GET /auth/me
export interface AuthAccount {
  id: string;
  roleKey: RoleKey;
  status: AccountStatus;
  role: AuthRole;
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

// The reduced account object POST /auth/login and OTP-login return - no
// emailVerified / handle / profile. Re-fetch via GET /auth/me for the full
// record.
export interface LoginAccount {
  id: string;
  roleKey: RoleKey;
  role: AuthRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
  deletedAt: string | null;
}
