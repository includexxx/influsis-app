export interface PageMeta {
  page: number;
  limit: number;
  itemCount: number;
  hasNextPage: boolean;
  totalCount: number;
  pageCount: number;
}

export interface ApiEnvelope<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta: PageMeta | null;
  requestId: string;
  timestamp: string;
  path: string;
}

export interface ApiListEnvelope<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T[];
  meta: PageMeta;
  requestId: string;
  timestamp: string;
  path: string;
}

export interface ApiErrorBody {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  errors: Record<string, string> | null;
  requestId: string;
  timestamp: string;
  path: string;
}

// The server `code` values this app branches on, plus two synthetic codes for
// failures that never reach the envelope (`NETWORK_ERROR`, `UNKNOWN`). The
// `(string & {})` arm keeps the literals as hints while still accepting an
// undocumented server code.
export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'ALREADY_EXISTS'
  | 'NOT_FOUND'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_TOKEN_MISSING'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_SESSION_REVOKED'
  | 'AUTH_TOKEN_STALE'
  | 'AUTH_MFA_REQUIRED'
  | 'AUTH_MFA_INVALID_CODE'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_PENDING_VERIFICATION'
  | 'INSUFFICIENT_ROLE'
  | 'INSUFFICIENT_PERMISSION'
  | 'STEP_UP_REQUIRED'
  | 'INVALID_STATE_TRANSITION'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'
  | (string & {});
