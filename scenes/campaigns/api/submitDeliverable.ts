import { request } from '@/services/http';
import { Dispatch } from '@/utils/store';

import { DeliverableSubmission, SubmitDeliverableArgs } from '../types/deliverables';
import { campaignFeedApi } from './campaignFeedApi';

// Campaign API group CI2 - submit a revision of one piece: an image (a
// multipart `file` part) or a link (`externalUrl`), never both, plus an
// optional caption. Not an RTK Query endpoint: the base query can't override
// httpClient's JSON content type per request, so the image path calls
// request() directly - the same approach as services/mediaUpload.ts.
// Failures reject with the ApiError from request() (409
// DELIVERABLE_NOT_SUBMITTABLE, 422 field errors).
export async function submitDeliverable(
  args: SubmitDeliverableArgs,
): Promise<DeliverableSubmission> {
  const url = `/engagements/${encodeURIComponent(args.engagementId)}/deliverables/${encodeURIComponent(args.pieceId)}/submissions`;
  const caption = args.caption?.trim();

  if (args.kind === 'link') {
    return request<DeliverableSubmission>({
      url,
      method: 'POST',
      data: { externalUrl: args.externalUrl.trim(), ...(caption ? { caption } : {}) },
    });
  }

  // RN's FormData accepts a `{ uri, name, type }` file part; the DOM lib
  // types only know `string | Blob`, hence the cast.
  const form = new FormData();
  form.append('file', {
    uri: args.image.uri,
    name: args.image.fileName ?? 'deliverable.jpg',
    type: args.image.mimeType ?? 'image/jpeg',
  } as unknown as Blob);
  if (caption) form.append('caption', caption);

  return request<DeliverableSubmission>({
    url,
    method: 'POST',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// After a successful submit: the piece list and the engagement (its progress
// counters) are stale.
export function invalidateAfterSubmit(dispatch: Dispatch, engagementId: string): void {
  dispatch(
    campaignFeedApi.util.invalidateTags([
      { type: 'Deliverables', id: engagementId },
      { type: 'MyEngagement', id: engagementId },
    ]),
  );
}
