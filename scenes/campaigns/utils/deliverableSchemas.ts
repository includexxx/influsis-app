import { z } from 'zod';
import { ApiError } from '@/services/http';
import { pickedImageSchema } from '@/utils/onboardingSchemas';

import { validateLivePostUrl, validateSubmission } from './deliverables';

// react-hook-form schemas for the Deliverable piece screen. The rules and
// messages stay in utils/deliverables.ts (validateSubmission /
// validateLivePostUrl, which mirror the backend); these wrap them so the
// form shows each message under its own field.

export const submissionSchema = z
  .object({
    kind: z.enum(['link', 'image']),
    externalUrl: z.string(),
    image: pickedImageSchema.nullable(),
    caption: z.string(),
  })
  .superRefine((values, ctx) => {
    for (const [field, message] of Object.entries(validateSubmission(values))) {
      if (message) ctx.addIssue({ code: 'custom', path: [field], message });
    }
  });

export type SubmissionValues = z.infer<typeof submissionSchema>;

export function submissionDefaultValues(kind: SubmissionValues['kind'] = 'link'): SubmissionValues {
  return { kind, externalUrl: '', image: null, caption: '' };
}

export const livePostSchema = z.object({
  livePostUrl: z.string().superRefine((value, ctx) => {
    const message = validateLivePostUrl(value);
    if (message) ctx.addIssue({ code: 'custom', message });
  }),
});

export type LivePostValues = z.infer<typeof livePostSchema>;

const NETWORK_ERROR = 'Cannot reach the server. Check your connection and try again.';
export const GENERIC_SUBMIT_ERROR = "Couldn't submit. Please try again.";
export const GENERIC_POSTED_ERROR = "Couldn't save the link. Please try again.";

type SubmissionField = 'externalUrl' | 'image' | 'caption';
type SetSubmissionError = (name: SubmissionField | 'root', error: { message: string }) => void;

// Maps a failed CI2 onto the submit form. Returns true when the piece is
// stale (409 DELIVERABLE_NOT_SUBMITTABLE) and should be refetched.
export function applySubmissionError(err: unknown, setError: SetSubmissionError): boolean {
  const error = err instanceof ApiError ? err : null;
  if (error?.statusCode === 409) {
    setError('root', { message: error.message || GENERIC_SUBMIT_ERROR });
    return true;
  }
  if (error?.statusCode === 422 && error.errors) {
    const fields = error.errors;
    if (fields.externalUrl) setError('externalUrl', { message: fields.externalUrl });
    if (fields.caption) setError('caption', { message: fields.caption });
    if (fields.file) setError('image', { message: "That image type isn't supported." });
    setError('root', { message: error.message || GENERIC_SUBMIT_ERROR });
    return false;
  }
  setError('root', {
    message: error?.code === 'NETWORK_ERROR' ? NETWORK_ERROR : GENERIC_SUBMIT_ERROR,
  });
  return false;
}

type SetLivePostError = (name: 'livePostUrl' | 'root', error: { message: string }) => void;

// Maps a failed CI4 onto the live post form.
export function applyLivePostError(err: unknown, setError: SetLivePostError): void {
  const error = err instanceof ApiError ? err : null;
  if (error?.statusCode === 422 && error.errors?.livePostUrl) {
    setError('livePostUrl', { message: error.errors.livePostUrl });
  } else if (error?.statusCode === 409) {
    setError('root', { message: error.message || GENERIC_POSTED_ERROR });
  } else {
    setError('root', {
      message: error?.code === 'NETWORK_ERROR' ? NETWORK_ERROR : GENERIC_POSTED_ERROR,
    });
  }
}
