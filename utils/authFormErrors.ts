import { ApiError } from '@/services';

type SetError<N extends string> = (name: N | 'root', error: { message: string }) => void;

const GENERIC = 'Something went wrong. Please try again.';

const CODE_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'The email or password is incorrect.',
  ACCOUNT_SUSPENDED: 'This account has been suspended. Contact support for help.',
  ACCOUNT_DEACTIVATED: 'This account has been deactivated.',
  ACCOUNT_PENDING_VERIFICATION: 'Verify your account to continue. Check your email for the code.',
  NETWORK_ERROR: 'Cannot reach the server. Check your connection and try again.',
};

/**
 * Maps an `ApiError` from an auth mutation onto react-hook-form. A
 * `VALIDATION_FAILED` field map lands on matching inputs; every other case is a
 * single form-level (`root`) message. Never surfaces a token or a raw password.
 */
export function applyApiError<N extends string>(
  err: unknown,
  setError: SetError<N>,
  fields: N[],
): void {
  if (!(err instanceof ApiError)) {
    setError('root', { message: GENERIC });
    return;
  }

  if (err.code === 'VALIDATION_FAILED' && err.errors) {
    let matched = false;
    for (const [key, message] of Object.entries(err.errors)) {
      if ((fields as string[]).includes(key)) {
        setError(key as N, { message });
        matched = true;
      }
    }
    if (matched) return;
    setError('root', { message: err.message || GENERIC });
    return;
  }

  if (err.code === 'ALREADY_EXISTS' && (fields as string[]).includes('email')) {
    setError('email' as N, { message: 'An account with this email already exists.' });
    return;
  }

  const known = CODE_MESSAGES[err.code];
  setError('root', { message: known ?? err.message ?? GENERIC });
}
