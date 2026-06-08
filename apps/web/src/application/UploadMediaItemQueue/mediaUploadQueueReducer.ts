import { FrontendUploadStatus } from '@packages/contracts';
import type { UploadItem, UploadQueueAction, UploadQueueState } from './mediaUploadTypes';

export const initialUploadQueueState: UploadQueueState = {
  items: [],
};

export const uploadQueueReducer: React.Reducer<UploadQueueState, UploadQueueAction> = (
  state: UploadQueueState,
  action: UploadQueueAction,
): UploadQueueState => {
  switch (action.type) {
    case 'enqueue': {
      const newItems: UploadItem[] = action.payload.files.map((file) => ({
        localId: crypto.randomUUID(),
        file,
        status: FrontendUploadStatus.queued,
        albumId: action.payload.albumId,
      }));

      return {
        ...state,
        items: [...state.items, ...newItems],
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

    case 'retry': {
      return {
        ...state,
        items: state.items.map((item) =>
          item.localId === action.payload.localId
            ? {
                ...item,
                status: FrontendUploadStatus.queued,
                errors: [],
              }
            : item,
        ),
      };
    }

    case 'remove': {
      return {
        ...state,
        items: state.items.filter((item) => item.localId !== action.payload.localId),
      };
    }

    case 'clearCompleted': {
      return {
        ...state,
        items: state.items.filter((item) => !item.status.equals(FrontendUploadStatus.complete)),
      };
    }

    default:
      return state;
  }
};
