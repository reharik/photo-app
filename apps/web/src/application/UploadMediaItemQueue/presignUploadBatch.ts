import type { ApolloClient } from '@apollo/client';

import { FrontendError, FrontendUploadStatus } from '@packages/contracts';
import { type AppError } from '../../domain/errors/errorTypes';
import {
  mapContractError,
  mapFrontendError,
  mapUnknownSystemError,
} from '../../domain/errors/mapToError';
import { executeMutation } from '../../domain/graphql/executeMutation';
import {
  CreateMediaUploadDocument,
  type CreateMediaUploadMutation,
} from '../../graphql/generated/types';
import type {
  PresignBatchResult,
  PresignCandidate,
  PresignOutcome,
  UploadItem,
} from './mediaUploadTypes';

/** One element of `createMediaUpload.data`: either a presigned item or one the server refused. */
type CreateMediaUploadItem = NonNullable<
  CreateMediaUploadMutation['createMediaUpload']['data']
>[number];

type CreateMediaUploadPayloadItem = Extract<
  CreateMediaUploadItem,
  { __typename: 'CreateMediaUploadPayload' }
>;

/**
 * Items per createMediaUpload call. Uploads run one at a time, so a chunk's last URL waits
 * behind the rest of the chunk. Keep it small against the 15-minute presign TTL, and the
 * next chunk is only requested once this one is used up.
 */
export const PRESIGN_BATCH_SIZE = 20;

const isPresignCandidate = (item: UploadItem): item is PresignCandidate =>
  item.status.equals(FrontendUploadStatus.queued) && item.classification != null;

/**
 * The next chunk to presign, in queue order. The server applies the first albumId it finds
 * to the whole call, so a chunk only ever holds items for one album (or none). A retried
 * item at the head of the queue goes alone.
 */
export const selectPresignBatch = (items: UploadItem[]): PresignCandidate[] => {
  const candidates = items.filter(isPresignCandidate);
  const head = candidates[0];
  if (!head) {
    return [];
  }
  if (head.soloPresign) {
    return [head];
  }
  return candidates
    .filter((item) => !item.soloPresign && item.albumId === head.albumId)
    .slice(0, PRESIGN_BATCH_SIZE);
};

/**
 * The whole call failed, so every item in it failed with the same error. `batchErrors` is set
 * too: that is what the banner reads, and what {@link stopsUploadQueue} inspects to decide
 * whether later chunks are doomed as well. A per-item refusal must never come through here.
 */
const failAll = (batch: PresignCandidate[], errors: AppError[]): PresignBatchResult => ({
  outcomes: batch.map(({ localId }) => ({ localId, success: false, errors })),
  batchErrors: errors,
});

/** The server said nothing usable about this item — a malformed or incomplete response. */
const failUnmatched = (localId: string): PresignOutcome => ({
  localId,
  success: false,
  errors: [mapFrontendError({ code: FrontendError.invalidCreateMediaUploadPayload })],
});

/**
 * Presigns a batch in one createMediaUpload call. Results are matched back by clientId (our
 * localId), never by array order.
 *
 * The server settles each item on its own, so a chunk can come back mixed: an item over the
 * per-kind size cap fails while its neighbours are presigned and must still upload. Only a
 * batch-level failure (quota) fails everything — see {@link failAll}.
 */
export const presignUploadBatch = async (
  client: ApolloClient,
  batch: PresignCandidate[],
): Promise<PresignBatchResult> => {
  try {
    const albumIds = new Set(batch.map((item) => item.albumId));
    if (albumIds.size > 1) {
      throw new Error('Upload batch mixes albums; the server would apply only the first.');
    }

    const result = await executeMutation(
      client,
      {
        mutation: CreateMediaUploadDocument,
        variables: {
          input: batch.map(({ localId, file, classification, albumId }) => ({
            clientId: localId,
            kind: classification.kind,
            mimeType: classification.mimeType,
            originalFileName: file.name.trim() !== '' ? file.name : undefined,
            albumId,
            // Signed into the URL as Content-Length; must equal the bytes the PUT sends.
            size: file.size,
          })),
        },
      },
      (data) => data.createMediaUpload,
    );

    if (!result.success) {
      return failAll(batch, result.errors);
    }

    const presigned = new Map<string, CreateMediaUploadPayloadItem>();
    const refused = new Map<string, AppError>();
    for (const entry of result.data) {
      if (entry.__typename === 'CreateMediaUploadPayload') {
        presigned.set(entry.clientId, entry);
      } else {
        refused.set(entry.clientId, mapContractError(entry.error));
      }
    }

    const outcomes = batch.map(({ localId }): PresignOutcome => {
      const payload = presigned.get(localId);
      if (payload) {
        // A payload missing the parts we actually need is as useless as no payload at all.
        if (!payload.mediaItemId || !payload.uploadInstructions?.url) {
          return failUnmatched(localId);
        }
        return {
          localId,
          success: true,
          mediaItemId: payload.mediaItemId,
          uploadInstructions: payload.uploadInstructions,
        };
      }
      const error = refused.get(localId);
      if (error) {
        return { localId, success: false, errors: [error] };
      }
      // Neither presigned nor refused: the server never accounted for this clientId.
      return failUnmatched(localId);
    });
    // Deliberately empty: a refused item is that item's problem. Setting batchErrors here would
    // raise the banner and, for a quota-shaped code, stop every chunk still queued behind it.
    return { outcomes, batchErrors: [] };
  } catch (error) {
    return failAll(batch, [mapUnknownSystemError(error)]);
  }
};
