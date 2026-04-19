import { FrontendUploadStatus } from '@packages/contracts';

import type { AppError } from '../errors/types';

export type UploadItem = {
  localId: string;
  file: File;
  status: FrontendUploadStatus;
  mediaItemId?: string;
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
  | { type: 'retry'; payload: { localId: string } };
