import { FrontendUploadStatus } from '@packages/contracts';
import type { UploadQueueAction, UploadWorkflowEvent } from './mediaUploadTypes';

export const workflowEventToQueueAction = (
  localId: string,
  event: UploadWorkflowEvent,
): UploadQueueAction => {
  switch (event.type) {
    case FrontendUploadStatus.creating:
    case FrontendUploadStatus.uploading:
    case FrontendUploadStatus.finalizing:
    case FrontendUploadStatus.complete:
      return {
        type: 'updateStatus',
        payload: {
          localId,
          status: event.type,
          mediaItemId: 'mediaItemId' in event ? event.mediaItemId : undefined,
          errors: event.type === FrontendUploadStatus.complete ? [] : undefined,
        },
      };

    case FrontendUploadStatus.failed:
      return {
        type: 'updateStatus',
        payload: {
          localId,
          status: FrontendUploadStatus.failed,
          mediaItemId: event.mediaItemId,
          errors: event.errors,
        },
      };
    default:
      throw new Error(`Unsupported workflow event type: ${JSON.stringify(event.type)}`);
  }
};
