import { FrontendUploadStatus } from '@packages/contracts';

import type { AppError } from '../../domain/errors/errorTypes';
import type { ResolvedUploadClassification } from './resolveUploadFileClassification';

export type UploadInstructions = {
  url: string;
  method: string;
  headers: Array<{ key: string; value: string }>;
};

export type UploadItem = {
  localId: string;
  file: File;
  status: FrontendUploadStatus;
  /** Set on every item that passed the enqueue pre-check; absent only on items rejected there. */
  classification?: ResolvedUploadClassification;
  mediaItemId?: string;
  /** Set by a successful presign; cleared on retry, since the signed URL may have expired. */
  uploadInstructions?: UploadInstructions;
  /** Set on retry: the item is presigned as a batch of one instead of joining the next chunk. */
  soloPresign?: boolean;
  albumId?: string;
  errors?: AppError[];
};

/** A queued item that passed the enqueue pre-check, ready to go into a presign batch. */
export type PresignCandidate = UploadItem & { classification: ResolvedUploadClassification };

export type PresignOutcome =
  | {
      localId: string;
      success: true;
      mediaItemId: string;
      uploadInstructions: UploadInstructions;
    }
  | { localId: string; success: false; errors: AppError[] };

export type UploadWorkflowEvent = {
  type: FrontendUploadStatus;
  mediaItemId?: string;
  stage?: FrontendUploadStatus;
  errors?: AppError[];
};

export type UploadQueueState = {
  items: UploadItem[];
  /** A presign failure that stopped the whole queue (quota). Shown once, not per row. */
  batchErrors: AppError[];
};

export type PresignBatchResult = {
  outcomes: PresignOutcome[];
  /** The chunk-level failure, if the whole call failed; empty otherwise. */
  batchErrors: AppError[];
};

export type EnqueuePayload = {
  files: File[];
  albumId?: string;
};

export type MarkReadyPayload = {
  mediaItemId: string;
};

export type MarkFailedPayload = {
  mediaItemId: string;
};

type RemovePayload = {
  localId: string;
};

type UpdateStatusPayload = {
  localId: string;
  status: FrontendUploadStatus;
  mediaItemId?: string;
  errors?: AppError[];
};
export type UploadQueueAction =
  | { type: 'enqueue'; payload: EnqueuePayload }
  | { type: 'updateStatus'; payload: UpdateStatusPayload }
  | { type: 'remove'; payload: RemovePayload }
  | { type: 'clearCompleted' }
  | { type: 'markReady'; payload: MarkReadyPayload }
  | { type: 'markFailed'; payload: MarkFailedPayload }
  | { type: 'retry'; payload: { localId: string } }
  | { type: 'presignStarted'; payload: { localIds: string[] } }
  | { type: 'presignSettled'; payload: PresignBatchResult };

export type UploadQueueContextValue = {
  items: UploadItem[];
  enqueueFiles: (files: File[], albumId?: string) => void;
  retryItem: (localId: string) => void;
  removeItem: (localId: string) => void;
  clearCompleted: () => void;
  isUploading: boolean;
  batchErrors: AppError[];
};
