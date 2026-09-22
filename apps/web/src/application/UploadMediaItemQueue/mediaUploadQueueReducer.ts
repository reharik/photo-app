import { FrontendError, FrontendUploadStatus, MediaKind } from '@packages/contracts';
import { mapFrontendError } from '../../domain/errors/mapToError';
import type { UploadItem, UploadQueueAction, UploadQueueState } from './mediaUploadTypes';
import { resolveUploadFileClassification } from './resolveUploadFileClassification';
import { canRetryUploadItem, stopsUploadQueue } from './uploadRetryPolicy';

export const initialUploadQueueState: UploadQueueState = {
  items: [],
  batchErrors: [],
};

/**
 * Pre-check at enqueue: files we won't upload go in already failed, so they show as rows
 * but never reach a presign batch. The `accept` filter on the picker is only a hint.
 */
const buildEnqueuedItem = (file: File, albumId: string | undefined): UploadItem => {
  const base = { localId: crypto.randomUUID(), file, albumId };
  const classification = resolveUploadFileClassification(file);

  if (!classification) {
    return {
      ...base,
      status: FrontendUploadStatus.failed,
      errors: [mapFrontendError({ code: FrontendError.unsupportedMediaType })],
    };
  }
  if (classification.kind.equals(MediaKind.video)) {
    return {
      ...base,
      status: FrontendUploadStatus.failed,
      errors: [mapFrontendError({ code: FrontendError.videoNotSupported })],
    };
  }
  return { ...base, status: FrontendUploadStatus.queued, classification };
};

export const uploadQueueReducer: React.Reducer<UploadQueueState, UploadQueueAction> = (
  state: UploadQueueState,
  action: UploadQueueAction,
): UploadQueueState => {
  switch (action.type) {
    case 'enqueue': {
      const newItems: UploadItem[] = action.payload.files.map((file) =>
        buildEnqueuedItem(file, action.payload.albumId),
      );

      return {
        ...state,
        items: [...state.items, ...newItems],
        // A new selection is a fresh attempt; drop the previous batch banner.
        batchErrors: [],
      };
    }

    case 'updateStatus': {
      return {
        ...state,
        items: state.items.map((item) =>
          item.localId === action.payload.localId
            ? {
                ...item,
                status: action.payload.status,
                mediaItemId: action.payload.mediaItemId ?? item.mediaItemId,
                errors: action.payload.errors === undefined ? item.errors : action.payload.errors,
              }
            : item,
        ),
      };
    }

    case 'markReady': {
      return {
        ...state,
        items: state.items.map((item) =>
          item.mediaItemId === action.payload.mediaItemId
            ? { ...item, status: FrontendUploadStatus.ready }
            : item,
        ),
      };
    }

    case 'markFailed': {
      return {
        ...state,
        items: state.items.map((item) =>
          item.mediaItemId === action.payload.mediaItemId
            ? { ...item, status: FrontendUploadStatus.failed }
            : item,
        ),
      };
    }

    case 'retry': {
      return {
        ...state,
        items: state.items.map((item) =>
          item.localId === action.payload.localId && canRetryUploadItem(item)
            ? {
                ...item,
                status: FrontendUploadStatus.queued,
                errors: [],
                mediaItemId: undefined,
                uploadInstructions: undefined,
                soloPresign: true,
              }
            : item,
        ),
      };
    }

    case 'presignStarted': {
      const localIds = new Set(action.payload.localIds);
      return {
        ...state,
        items: state.items.map((item) =>
          localIds.has(item.localId)
            ? { ...item, status: FrontendUploadStatus.creating, errors: [] }
            : item,
        ),
      };
    }

    case 'presignSettled': {
      const outcomes = new Map(action.payload.outcomes.map((o) => [o.localId, o]));
      const { batchErrors } = action.payload;
      // Quota: fail everything still queued in this same action, so no later chunk is
      // presigned and the user sees one banner instead of one failure per chunk.
      const stopQueue = stopsUploadQueue(batchErrors);
      return {
        ...state,
        batchErrors: stopQueue ? batchErrors : state.batchErrors,
        items: state.items.map((item): UploadItem => {
          if (stopQueue && item.status.equals(FrontendUploadStatus.queued)) {
            return { ...item, status: FrontendUploadStatus.failed, errors: batchErrors };
          }
          const outcome = outcomes.get(item.localId);
          // Not in this batch (or removed and re-added since): leave it alone.
          if (!outcome || !item.status.equals(FrontendUploadStatus.creating)) {
            return item;
          }
          return outcome.success
            ? {
                ...item,
                status: FrontendUploadStatus.presigned,
                mediaItemId: outcome.mediaItemId,
                uploadInstructions: outcome.uploadInstructions,
              }
            : { ...item, status: FrontendUploadStatus.failed, errors: outcome.errors };
        }),
      };
    }

    case 'remove': {
      const items = state.items.filter((item) => item.localId !== action.payload.localId);
      // Nothing left for the banner to describe once the last row is gone.
      return { ...state, items, batchErrors: items.length === 0 ? [] : state.batchErrors };
    }

    case 'clearCompleted': {
      return {
        ...state,
        items: state.items.filter((item) => !item.status.equals(FrontendUploadStatus.complete)),
        batchErrors: [],
      };
    }

    default:
      return state;
  }
};
