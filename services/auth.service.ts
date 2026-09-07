import { request } from './http';
import { AuthAccount, AuthTokens, LoginAccount } from '@/types';

export type OtpChannel = 'sms' | 'email';

export type OtpPurpose =
  | 'registration'
  | 'login'
  | 'password_reset'
  | 'phone_change'
  | 'email_change';

export interface RegisterInput {
  roleKey: 'creator' | 'business';
  email?: string;
  phone?: string;
  password: string;
}

interface TokenBody {
  token: string;
  refreshToken: string;
  tokenExpires: number;
}

interface SessionBody extends TokenBody {
  user: LoginAccount;
}

function toTokens(body: TokenBody): AuthTokens {
  return {
    token: body.token,
    refreshToken: body.refreshToken,
    tokenExpires: body.tokenExpires,
  };
}

export type LoginResult =
  | { status: 'ok'; tokens: AuthTokens; account: LoginAccount }
  | { status: 'mfa'; preAuthToken: string };

export type VerifyOtpResult =
  | { kind: 'session'; tokens: AuthTokens; account: LoginAccount }
  | { kind: 'reset'; resetToken: string }
  | { kind: 'confirmed' };

export async function register(input: RegisterInput): Promise<void> {
  await request<null>('/auth/register', { method: 'POST', body: input });
}

export async function login(input: { identifier: string; password: string }): Promise<LoginResult> {
  const body = await request<SessionBody | { mfaRequired: true; preAuthToken: string }>(
    '/auth/login',
    { method: 'POST', body: input },
  );

  if ('mfaRequired' in body) {
    return { status: 'mfa', preAuthToken: body.preAuthToken };
  }
  return { status: 'ok', tokens: toTokens(body), account: body.user };
}

export async function verifyLogin2fa(input: {
  preAuthToken: string;
  code: string;
}): Promise<{ tokens: AuthTokens; account: LoginAccount }> {
  const body = await request<SessionBody>('/auth/login/2fa/verify', {
    method: 'POST',
    body: input,
  });
  return { tokens: toTokens(body), account: body.user };
}

export async function requestOtp(input: {
  destination: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
}): Promise<void> {
  await request<null>('/auth/otp/request', { method: 'POST', body: input });
}

export async function verifyOtp(input: {
  destination: string;
  purpose: OtpPurpose;
  code: string;
}): Promise<VerifyOtpResult> {
  const data = await request<SessionBody & { resetToken?: string; confirmed?: boolean }>(
    '/auth/otp/verify',
    { method: 'POST', body: input },
  );

  if (input.purpose === 'registration' || input.purpose === 'login') {
    return { kind: 'session', tokens: toTokens(data), account: data.user };
  }
  if (input.purpose === 'password_reset') {
    return { kind: 'reset', resetToken: data.resetToken as string };
  }
  return { kind: 'confirmed' };
}

export async function resetPassword(input: {
  resetToken: string;
  newPassword: string;
}): Promise<void> {
  await request<null>('/auth/reset-password', { method: 'POST', body: input });
}

// The refresh token travels in the Authorization header, not the body
// (_CONVENTIONS.md `H-Refresh`).
export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const body = await request<TokenBody>('/auth/refresh', {
    method: 'POST',
    token: refreshToken,
  });
  return toTokens(body);
}

export async function logout(accessToken: string): Promise<void> {
  await request<null>('/auth/logout', { method: 'POST', token: accessToken });
}

export async function getMe(accessToken: string): Promise<AuthAccount> {
  return request<AuthAccount>('/auth/me', { token: accessToken });
}
