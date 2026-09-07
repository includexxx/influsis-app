import { beforeEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('./http', () => ({
  __esModule: true,
  ...(jest.requireActual('./http') as object),
  request: jest.fn(),
}));

import { ApiError, request } from './http';
import { login, refresh, register, verifyOtp } from './auth.service';

const mockRequest = request as jest.MockedFunction<typeof request>;

const tokenBody = {
  token: 'access-abc',
  refreshToken: 'refresh-xyz',
  tokenExpires: 1788177686241,
};
const user = { id: 'u1', roleKey: 'creator' } as unknown;

describe('auth.service', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  test('register resolves void and posts the body to /auth/register', async () => {
    mockRequest.mockResolvedValue(null as never);

    await expect(
      register({ roleKey: 'creator', email: 'a@b.com', password: 'Secret123!' }),
    ).resolves.toBeUndefined();
    expect(mockRequest).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: { roleKey: 'creator', email: 'a@b.com', password: 'Secret123!' },
    });
  });

  test('login maps the token branch to status "ok"', async () => {
    mockRequest.mockResolvedValue({ ...tokenBody, user } as never);

    await expect(login({ identifier: 'a@b.com', password: 'x' })).resolves.toEqual({
      status: 'ok',
      tokens: tokenBody,
      account: user,
    });
  });

  test('login maps the mfaRequired branch to status "mfa"', async () => {
    mockRequest.mockResolvedValue({ mfaRequired: true, preAuthToken: 'pre-1' } as never);

    await expect(login({ identifier: 'a@b.com', password: 'x' })).resolves.toEqual({
      status: 'mfa',
      preAuthToken: 'pre-1',
    });
  });

  test('verifyOtp maps a registration purpose to a session result', async () => {
    mockRequest.mockResolvedValue({ ...tokenBody, user } as never);

    await expect(
      verifyOtp({ destination: 'a@b.com', purpose: 'registration', code: '123456' }),
    ).resolves.toEqual({ kind: 'session', tokens: tokenBody, account: user });
  });

  test('verifyOtp maps a password_reset purpose to a reset result', async () => {
    mockRequest.mockResolvedValue({ resetToken: 'reset-1' } as never);

    await expect(
      verifyOtp({ destination: 'a@b.com', purpose: 'password_reset', code: '123456' }),
    ).resolves.toEqual({ kind: 'reset', resetToken: 'reset-1' });
  });

  test('verifyOtp maps an email_change purpose to a confirmed result', async () => {
    mockRequest.mockResolvedValue({ confirmed: true } as never);

    await expect(
      verifyOtp({ destination: 'a@b.com', purpose: 'email_change', code: '123456' }),
    ).resolves.toEqual({ kind: 'confirmed' });
  });

  test('refresh sends the refresh token as the bearer and returns the new tokens', async () => {
    const rotated = { token: 'new-a', refreshToken: 'new-r', tokenExpires: 1788177687224 };
    mockRequest.mockResolvedValue(rotated as never);

    await expect(refresh('refresh-xyz')).resolves.toEqual(rotated);
    expect(mockRequest).toHaveBeenCalledWith('/auth/refresh', {
      method: 'POST',
      token: 'refresh-xyz',
    });
  });

  test('an ApiError from request propagates unchanged', async () => {
    const err = new ApiError({
      code: 'AUTH_INVALID_CREDENTIALS',
      statusCode: 401,
      message: 'Incorrect email/phone or password.',
    });
    mockRequest.mockRejectedValue(err);

    await expect(login({ identifier: 'a@b.com', password: 'wrong' })).rejects.toBe(err);
  });
});
