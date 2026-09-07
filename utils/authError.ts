import { ApiError } from '@/services/http';

// Maps an `ApiError` from the auth endpoints to copy the Sign In / Sign Up
// screens can show directly. Branch on `err.code`, never `err.message`.

const MESSAGE_BY_CODE: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'Incorrect email or password.',
  ALREADY_EXISTS: 'An account with this email already exists.',
  ACCOUNT_SUSPENDED: 'This account has been suspended. Contact support.',
  ACCOUNT_DEACTIVATED: 'This account has been deactivated.',
  ACCOUNT_PENDING_VERIFICATION: 'This account is not active yet.',
  RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
  NETWORK_ERROR: 'Cannot reach the server. Check your connection and try again.',
};

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

export function authErrorMessage(err: ApiError): string {
  if (err.code === 'VALIDATION_FAILED') {
    const first = err.errors ? Object.values(err.errors)[0] : undefined;
    return first ?? 'Please check the form and try again.';
  }
  return MESSAGE_BY_CODE[err.code] ?? DEFAULT_MESSAGE;
}

// Known backend field tokens get a full sentence; anything else (e.g. a
// class-validator string like "must be longer than or equal to 8 characters")
// is already human-readable and passes through unchanged.
const FIELD_TOKEN_MESSAGE: Record<string, string> = {
  emailAlreadyExists: 'An account with this email already exists.',
  phoneAlreadyExists: 'An account with this phone number already exists.',
  phoneOrEmailRequired: 'Enter an email address.',
};

const SURFACED_FIELDS = ['email', 'password', 'phone'] as const;

export function authErrorFieldErrors(err: ApiError): Record<string, string> {
  const out: Record<string, string> = {};
  if (!err.errors) return out;

  for (const field of SURFACED_FIELDS) {
    const raw = err.errors[field];
    if (raw == null) continue;
    out[field] = FIELD_TOKEN_MESSAGE[raw] ?? raw;
  }
  return out;
}
