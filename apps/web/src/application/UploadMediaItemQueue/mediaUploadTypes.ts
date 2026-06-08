import { FrontendUploadStatus } from '@packages/contracts';

import type { AppError } from '../../domain/errors/errorTypes';

export type UploadItem = {
  localId: string;
  file: File;
  status: FrontendUploadStatus;
  mediaItemId?: string;
  albumId?: string;
  errors?: AppError[];
};

export type UploadWorkflowEvent = {
  type: FrontendUploadStatus;
  mediaItemId?: string;
  stage?: FrontendUploadStatus;
  errors?: AppError[];
};

export type UploadQueueState = {
  items: UploadItem[];
};

export type EnqueuePayload = {
  files: File[];
  albumId?: string;
};

export type MarkReadyPayload = {
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
  | { type: 'retry'; payload: { localId: string } };

export type UploadQueueContextValue = {
  items: UploadItem[];
  enqueueFiles: (files: File[], albumId?: string) => void;
  retryItem: (localId: string) => void;
  removeItem: (localId: string) => void;
  clearCompleted: () => void;
  isUploading: boolean;
};
