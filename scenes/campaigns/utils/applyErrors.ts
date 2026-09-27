import { ApiError } from '@/services/http';
import { ApplyValues } from './applySchema';

type ApplyField = keyof ApplyValues;
type SetError = (name: ApplyField | 'root', error: { message: string }) => void;

const GENERIC = 'Something went wrong. Please try again.';

// CF1's body fields -> this form's inputs. `portfolioUrls` errors (keyed
// `portfolioUrls` or `portfolioUrls.0`) land on the first link field.
function toFormField(key: string): ApplyField | null {
  if (key === 'pitch') return 'pitch';
  if (key === 'proposedAmountMinor') return 'amount';
  if (key.startsWith('portfolioUrls')) return 'linkOne';
  return null;
}

// Maps a failed POST /feed/campaigns/:id/apply onto the apply form: backend
// validation errors on their inputs, everything else as one form-level
// message. A 409 is the campaign closing, its deadline passing, or an
// earlier application for it already existing.
export function applyApplicationError(err: unknown, setError: SetError): void {
  if (!(err instanceof ApiError)) {
    setError('root', { message: GENERIC });
    return;
  }

  if (err.errors) {
    let matched = false;
    for (const [key, message] of Object.entries(err.errors)) {
      const field = toFormField(key);
      if (field) {
        setError(field, { message });
        matched = true;
      }
    }
    if (matched) return;
  }

  if (err.code === 'NETWORK_ERROR') {
    setError('root', {
      message: 'Cannot reach the server. Check your connection and try again.',
    });
    return;
  }

  if (err.statusCode === 409) {
    setError('root', {
      message:
        err.message ||
        'You can no longer apply to this campaign. It may have closed, or you already applied.',
    });
    return;
  }

  setError('root', { message: err.message || GENERIC });
}
