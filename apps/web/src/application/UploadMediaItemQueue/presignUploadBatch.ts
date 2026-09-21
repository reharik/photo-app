import type { ApolloClient } from '@apollo/client';

import { FrontendError, FrontendUploadStatus } from '@packages/contracts';
import { type AppError } from '../../domain/errors/errorTypes';
import { mapFrontendError, mapUnknownSystemError } from '../../domain/errors/mapToError';
import { executeMutation } from '../../domain/graphql/executeMutation';
import { CreateMediaUploadDocument } from '../../graphql/generated/types';
import type {
  PresignBatchResult,
  PresignCandidate,
  PresignOutcome,
  UploadItem,
} from './mediaUploadTypes';

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

const failAll = (batch: PresignCandidate[], errors: AppError[]): PresignBatchResult => ({
  outcomes: batch.map(({ localId }) => ({ localId, success: false, errors })),
  batchErrors: errors,
});

/**
 * Presigns a batch in one createMediaUpload call. The batch is all-or-nothing on the server;
 * results are matched back by clientId (our localId), never by array order, and an item
 * with no matching result fails on its own.
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

    const byClientId = new Map(result.data.map((payload) => [payload.clientId, payload]));
    const outcomes = batch.map(({ localId }): PresignOutcome => {
      const payload = byClientId.get(localId);
      if (!payload?.mediaItemId || !payload.uploadInstructions?.url) {
        return {
          localId,
          success: false,
          errors: [mapFrontendError({ code: FrontendError.invalidCreateMediaUploadPayload })],
        };
      }
      return {
        localId,
        success: true,
        mediaItemId: payload.mediaItemId,
        uploadInstructions: payload.uploadInstructions,
      };
    });
    return { outcomes, batchErrors: [] };
  } catch (error) {
    return failAll(batch, [mapUnknownSystemError(error)]);
  }
};
