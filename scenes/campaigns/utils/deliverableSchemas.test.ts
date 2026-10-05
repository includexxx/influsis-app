import { describe, expect, jest, test } from '@jest/globals';

import { ApiError } from '@/services/http';
import {
  applyLivePostError,
  applySubmissionError,
  GENERIC_POSTED_ERROR,
  GENERIC_SUBMIT_ERROR,
  livePostSchema,
  submissionDefaultValues,
  submissionSchema,
} from './deliverableSchemas';

function issues(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) {
  return Object.fromEntries(
    (result.error?.issues ?? []).map(issue => [issue.path.join('.'), issue.message]),
  );
}

describe('submissionSchema', () => {
  test('a link needs a full http(s) URL', () => {
    expect(issues(submissionSchema.safeParse(submissionDefaultValues()))).toEqual({
      externalUrl: 'Paste the link to your content.',
    });
    expect(
      issues(
        submissionSchema.safeParse({
          ...submissionDefaultValues(),
          externalUrl: 'instagram.com/p/1',
        }),
      ),
    ).toEqual({ externalUrl: 'Enter a full link starting with https://' });
    expect(
      submissionSchema.safeParse({
        ...submissionDefaultValues(),
        externalUrl: 'https://instagram.com/p/1',
      }).success,
    ).toBe(true);
  });

  test('an image upload needs a picked image, not a link', () => {
    expect(issues(submissionSchema.safeParse(submissionDefaultValues('image')))).toEqual({
      image: 'Choose an image to upload.',
    });
    expect(
      submissionSchema.safeParse({
        ...submissionDefaultValues('image'),
        image: { uri: 'file:///x.jpg' },
      }).success,
    ).toBe(true);
  });

  test('caps the caption', () => {
    expect(
      issues(
        submissionSchema.safeParse({
          ...submissionDefaultValues(),
          externalUrl: 'https://instagram.com/p/1',
          caption: 'a'.repeat(2001),
        }),
      ),
    ).toEqual({ caption: 'Keep the caption under 2000 characters.' });
  });
});

describe('livePostSchema', () => {
  test('requires a full link', () => {
    expect(issues(livePostSchema.safeParse({ livePostUrl: '' }))).toEqual({
      livePostUrl: 'Paste the link to the live post.',
    });
    expect(
      livePostSchema.safeParse({ livePostUrl: 'https://tiktok.com/@me/video/1' }).success,
    ).toBe(true);
  });
});

describe('applySubmissionError', () => {
  test('a 409 shows the server message and asks for a refetch', () => {
    const setError = jest.fn();
    const stale = applySubmissionError(
      new ApiError({ code: 'DELIVERABLE_NOT_SUBMITTABLE', statusCode: 409, message: 'Approved.' }),
      setError,
    );
    expect(stale).toBe(true);
    expect(setError).toHaveBeenCalledWith('root', { message: 'Approved.' });
  });

  test('a 422 lands on its fields', () => {
    const setError = jest.fn();
    applySubmissionError(
      new ApiError({
        code: 'VALIDATION_FAILED',
        statusCode: 422,
        message: 'The submitted data is invalid.',
        errors: { externalUrl: 'must be a URL', file: 'bad type' },
      }),
      setError,
    );
    expect(setError).toHaveBeenCalledWith('externalUrl', { message: 'must be a URL' });
    expect(setError).toHaveBeenCalledWith('image', {
      message: "That image type isn't supported.",
    });
    expect(setError).toHaveBeenCalledWith('root', { message: 'The submitted data is invalid.' });
  });

  test('anything else is the generic message', () => {
    const setError = jest.fn();
    expect(applySubmissionError(new Error('boom'), setError)).toBe(false);
    expect(setError).toHaveBeenCalledWith('root', { message: GENERIC_SUBMIT_ERROR });
  });
});

describe('applyLivePostError', () => {
  test('a 422 on the link lands on the field; anything else is form-level', () => {
    const setError = jest.fn();
    applyLivePostError(
      new ApiError({
        code: 'VALIDATION_FAILED',
        statusCode: 422,
        message: 'invalid',
        errors: { livePostUrl: 'must be a URL' },
      }),
      setError,
    );
    expect(setError).toHaveBeenCalledWith('livePostUrl', { message: 'must be a URL' });

    applyLivePostError(new Error('boom'), setError);
    expect(setError).toHaveBeenCalledWith('root', { message: GENERIC_POSTED_ERROR });
  });
});
