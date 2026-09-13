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

export type OtpPurpose =
  | 'registration'
  | 'login'
  | 'password_reset'
  | 'phone_change'
  | 'email_change';

export type OtpChannel = 'sms' | 'email';

/**
 * The `{ token, refreshToken, tokenExpires, user }` payload returned by
 * `POST /auth/login`, `POST /auth/login/2fa/verify`, and `POST /auth/otp/verify`
 * for `registration` / `login`. `auth.md` names `user` without printing its
 * shape; it is the `MeResponseDto` (`AuthAccount`). 19d/19e confirm against a
 * live response.
 */
export interface SessionTokenPair extends AuthTokens {
  user: AuthAccount;
}

export interface RegisterRequest {
  roleKey: 'creator' | 'business';
  email?: string;
  phone?: string;
  password: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export type LoginResponse = SessionTokenPair | { mfaRequired: true; preAuthToken: string };

export interface Login2faVerifyRequest {
  preAuthToken: string;
  code: string;
}

export interface OtpRequestRequest {
  destination: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
}

export interface OtpVerifyRequest {
  destination: string;
  purpose: OtpPurpose;
  code: string;
}

export type OtpVerifyResponse = SessionTokenPair | { resetToken: string } | { confirmed: true };

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}
