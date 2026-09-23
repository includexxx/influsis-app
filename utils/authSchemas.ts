import { z } from 'zod';
import { looksLikePhone } from './phone';

const isEmail = (value: string) => z.string().email().safeParse(value).success;

export const signInSchema = z.object({
  // The backend accepts a phone or an email as the identifier; a phone
  // sign-up has only a phone to log in with. `SignIn` normalizes a phone to
  // E.164 before sending.
  identifier: z
    .string()
    .trim()
    .min(1, 'Enter your email or phone number')
    .refine(
      value => isEmail(value) || looksLikePhone(value),
      'Enter a valid email or phone number',
    ),
  password: z.string().min(1, 'Enter your password'),
});

const CONTACT_REQUIRED = 'Enter a phone number or an email';

export const signUpSchema = z
  .object({
    // At least one of email / phone is required (checked below); each may be
    // blank on its own. Phone is the verification channel when present.
    email: z.string().trim().email('Enter a valid email').or(z.literal('')),
    phone: z
      .string()
      .trim()
      .regex(/^[\d\s()-]*$/, 'Enter digits only'),
    // Backend RegisterDto minimum; the old mock allowed 6.
    password: z.string().min(8, 'Must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.email && !data.phone) {
      ctx.addIssue({ code: 'custom', path: ['email'], message: CONTACT_REQUIRED });
      ctx.addIssue({ code: 'custom', path: ['phone'], message: CONTACT_REQUIRED });
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
});

export const resetPasswordSchema = z
  .object({
    // Backend ResetPasswordDto minimum; the old mock allowed 6.
    newPassword: z.string().min(8, 'Must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const twoFactorSchema = z.object({
  // Backend Login2faVerifyDto: exactly 6 characters, TOTP is numeric.
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type TwoFactorValues = z.infer<typeof twoFactorSchema>;
