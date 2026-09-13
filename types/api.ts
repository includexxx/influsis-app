export interface PageMeta {
  page: number;
  limit: number;
  itemCount: number;
  hasNextPage: boolean;
  totalCount?: number;
  pageCount?: number;
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

export interface ApiListEnvelope<T> extends Omit<ApiEnvelope<T[]>, 'meta'> {
  meta: PageMeta;
}

export interface ApiPermissionErrorDetail {
  required: string[];
  mode: string;
}

export interface ApiErrorBody {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  errors: Record<string, string> | ApiPermissionErrorDetail | null;
  requestId: string;
  timestamp: string;
  path: string;
}

/**
 * The backend error catalog (platform-context/api-contracts/README.md), which
 * that doc states is exhaustive, plus the two synthetic codes http.ts raises
 * for transport and unparseable-response failures.
 */
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'MALFORMED_JSON'
  | 'AUTH_TOKEN_MISSING'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_SESSION_REVOKED'
  | 'AUTH_TOKEN_STALE'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_MFA_REQUIRED'
  | 'AUTH_MFA_INVALID_CODE'
  | 'FORBIDDEN'
  | 'INSUFFICIENT_ROLE'
  | 'INSUFFICIENT_PERMISSION'
  | 'STEP_UP_REQUIRED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_PENDING_VERIFICATION'
  | 'SELF_ACTION_FORBIDDEN'
  | 'NOT_RESOURCE_OWNER'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'ALREADY_EXISTS'
  | 'HANDLE_TAKEN'
  | 'HANDLE_RESERVED'
  | 'ROLE_IN_USE'
  | 'INVALID_STATE_TRANSITION'
  | 'VALIDATION_FAILED'
  | 'BUSINESS_RULE_VIOLATION'
  | 'MEDIA_INVALID_TYPE'
  | 'MEDIA_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'OTP_ATTEMPTS_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';
