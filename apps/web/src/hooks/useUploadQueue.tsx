import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { ApolloClient } from '@apollo/client';
import { FrontendUploadStatus } from '@packages/contracts';
import {
  initialUploadQueueState,
  uploadQueueReducer,
} from '../domain/media/mediaUploadQueueReducer';
import { UploadWorkflowEvent } from '../domain/media/mediaUploadTypes';
import { mediaUploadWorkflow } from '../domain/media/mediaUploadWorkflow';
import { workflowEventToQueueAction } from '../domain/media/workflowEventToQueueAction';

export const useUploadQueue = (client: ApolloClient) => {
  const [state, dispatch] = useReducer(uploadQueueReducer, initialUploadQueueState);
  const isProcessingRef = useRef<boolean>(false);
  const [albumId, setAlbumId] = useState<string | undefined>(undefined);

  const enqueueFiles = useCallback(
    (files: File[], albumId?: string) => {
      setAlbumId(albumId);
      dispatch({ type: 'enqueue', payload: { files } });
    },
    [setAlbumId],
  );

  const retryItem = useCallback(
    (localId: string) => dispatch({ type: 'retry', payload: { localId } }),
    [dispatch],
  );

  const removeItem = useCallback(
    (localId: string) => dispatch({ type: 'remove', payload: { localId } }),
    [dispatch],
  );

  const clearCompleted = useCallback(() => dispatch({ type: 'clearCompleted' }), [dispatch]);

  const isUploading = useMemo(
    () =>
      state.items.some(
        (item) =>
          item.status === FrontendUploadStatus.queued ||
          item.status === FrontendUploadStatus.creating ||
          item.status === FrontendUploadStatus.uploading ||
          item.status === FrontendUploadStatus.finalizing,
      ),
    [state.items],
  );

  const handleWorkflowEvent = useCallback(
    (localId: string) =>
      (event: UploadWorkflowEvent): void => {
        dispatch(workflowEventToQueueAction(localId, event));
      },
    [],
  );

  /**
   * Process at most one queued item per effect run. The previous implementation walked the queue
   * using a ref that was only synced in an effect after commit, so after `await mediaUploadWorkflow`
   * the snapshot could still show items as `queued` and the inner `while` loop would call
   * `createMediaUpload` again for the same files (runaway duplicate rows).
   */
  useEffect(() => {
    if (isProcessingRef.current) {
      return;
    }

    const nextItem = state.items.find((item) => item.status === FrontendUploadStatus.queued);
    if (!nextItem) {
      return;
    }

    isProcessingRef.current = true;

    void mediaUploadWorkflow(
      client,
      nextItem.file,
      handleWorkflowEvent(nextItem.localId),
      albumId,
    ).finally(() => {
      isProcessingRef.current = false;
    });
  }, [state.items, client, handleWorkflowEvent, albumId]);

  return {
    items: state.items,
    enqueueFiles,
    retryItem,
    removeItem,
    clearCompleted,
    isUploading,
  };
};
