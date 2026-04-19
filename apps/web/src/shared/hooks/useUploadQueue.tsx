import { useCallback, useEffect, useMemo } from 'react';

import { ApolloClient } from '@apollo/client';
import { FrontendUploadStatus } from '@packages/contracts';
import { useReducer, useRef } from 'react';
import {
  initialUploadQueueState,
  uploadQueueReducer,
} from '../../application/media/mediaUploadQueueReducer';
import { mediaUploadWorkflow } from '../../application/media/mediaUploadWorkflow';
import { UploadQueueState, UploadWorkflowEvent } from '../../application/media/types';
import { workflowEventToQueueAction } from '../../application/media/workflowEventToQueueAction';

export const useUploadQueue = (client: ApolloClient) => {
  const [state, dispatch] = useReducer(uploadQueueReducer, initialUploadQueueState);
  const stateRef = useRef<UploadQueueState>(state);
  const isProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const enqueueFiles = useCallback((files: File[]) => {
    dispatch({ type: 'enqueue', payload: { files } });
  }, []);

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

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      while (true) {
        const nextItem = stateRef.current.items.find(
          (item) => item.status === FrontendUploadStatus.queued,
        );

        if (!nextItem) break;

        await mediaUploadWorkflow(client, nextItem.file, handleWorkflowEvent(nextItem.localId));
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [client, handleWorkflowEvent]);

  useEffect(() => {
    void processQueue();
  }, [state.items, processQueue]);

  return {
    items: state.items,
    enqueueFiles,
    retryItem,
    removeItem,
    clearCompleted,
    isUploading,
  };
};
