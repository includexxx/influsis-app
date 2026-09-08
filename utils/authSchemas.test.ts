import { describe, expect, test } from '@jest/globals';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  twoFactorSchema,
} from './authSchemas';

const validSignUp = {
  fullName: 'Test Creator',
  email: 'creator@influsis.test',
  phone: '1521000000',
  password: 'password1',
  confirmPassword: 'password1',
};

describe('signInSchema', () => {
  test('accepts a valid email and password', () => {
    expect(signInSchema.safeParse({ identifier: ' a@b.co ', password: 'x' }).success).toBe(true);
  });

  test('rejects an invalid email', () => {
    const r = signInSchema.safeParse({ identifier: 'not-an-email', password: 'x' });
    expect(r.success).toBe(false);
  });

  test('rejects an empty password', () => {
    const r = signInSchema.safeParse({ identifier: 'a@b.co', password: '' });
    expect(r.success).toBe(false);
  });
});

describe('signUpSchema', () => {
  test('accepts a fully valid form', () => {
    expect(signUpSchema.safeParse(validSignUp).success).toBe(true);
  });

  test('rejects a password shorter than 8', () => {
    const r = signUpSchema.safeParse({
      ...validSignUp,
      password: 'short',
      confirmPassword: 'short',
    });
    expect(r.success).toBe(false);
  });

  test('rejects a confirmPassword that does not match', () => {
    const r = signUpSchema.safeParse({ ...validSignUp, confirmPassword: 'password2' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some(i => i.path[0] === 'confirmPassword')).toBe(true);
    }
  });

  test('rejects an empty full name and phone', () => {
    expect(signUpSchema.safeParse({ ...validSignUp, fullName: '  ' }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...validSignUp, phone: '' }).success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  test('accepts a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: ' a@b.co ' }).success).toBe(true);
  });

  test('rejects an invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  test('accepts matching 8+ char passwords', () => {
    expect(
      resetPasswordSchema.safeParse({ newPassword: 'password1', confirmPassword: 'password1' })
        .success,
    ).toBe(true);
  });

  test('rejects a password shorter than 8', () => {
    expect(
      resetPasswordSchema.safeParse({ newPassword: 'short', confirmPassword: 'short' }).success,
    ).toBe(false);
  });

  test('rejects a mismatch on the confirmPassword path', () => {
    const r = resetPasswordSchema.safeParse({
      newPassword: 'password1',
      confirmPassword: 'password2',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some(i => i.path[0] === 'confirmPassword')).toBe(true);
    }
  });
});

describe('twoFactorSchema', () => {
  test('accepts exactly 6 digits', () => {
    expect(twoFactorSchema.safeParse({ code: ' 123456 ' }).success).toBe(true);
  });

  test('rejects fewer than 6 digits', () => {
    expect(twoFactorSchema.safeParse({ code: '12345' }).success).toBe(false);
  });

  test('rejects non-numeric input', () => {
    expect(twoFactorSchema.safeParse({ code: '12345a' }).success).toBe(false);
  });
});
