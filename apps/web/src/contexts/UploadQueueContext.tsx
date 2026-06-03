import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import { useApolloClient } from '@apollo/client/react';
import { FrontendUploadStatus, isInFlightStatus } from '@packages/contracts';
import { awaitMediaItemsReady } from '../application/UploadMediaItemQueue/awaitMediaItemsReady';
import {
  initialUploadQueueState,
  uploadQueueReducer,
} from '../application/UploadMediaItemQueue/mediaUploadQueueReducer';
import {
  UploadQueueContextValue,
  UploadWorkflowEvent,
} from '../application/UploadMediaItemQueue/mediaUploadTypes';
import { mediaUploadWorkflow } from '../application/UploadMediaItemQueue/mediaUploadWorkflow';
import { workflowEventToQueueAction } from '../application/UploadMediaItemQueue/workflowEventToQueueAction';

const UploadQueueContext = createContext<UploadQueueContextValue | null>(null);
export const UploadQueueProvider = ({ children }: { children: ReactNode }) => {
  const client = useApolloClient();

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
    () => state.items.some((i) => isInFlightStatus(i.status)),
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

  // Track which items have already been handed off to readiness polling,
  // so we don't double-start polling for the same item across re-renders.
  const polledIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newlyComplete = state.items.filter(
      (item) =>
        item.status === FrontendUploadStatus.complete &&
        item.mediaItemId != null &&
        !polledIdsRef.current.has(item.mediaItemId),
    );

    if (newlyComplete.length === 0) return;

    const ids = newlyComplete.map((item) => item.mediaItemId!);
    ids.forEach((id) => polledIdsRef.current.add(id));

    void awaitMediaItemsReady(client, ids, {
      onItemReady: (mediaItemId) => {
        dispatch({ type: 'markReady', payload: { mediaItemId } });
      },
    });
  }, [state.items, client]);

  const value = useMemo(
    () => ({
      items: state.items,
      enqueueFiles,
      retryItem,
      removeItem,
      clearCompleted,
      isUploading,
    }),
    [state.items, enqueueFiles, retryItem, removeItem, clearCompleted, isUploading],
  );
  return <UploadQueueContext.Provider value={value}>{children}</UploadQueueContext.Provider>;
};

export const useUploadQueue = () => {
  const value = useContext(UploadQueueContext);
  if (value === null) {
    throw new Error('useUploadQueue must be used within UploadQueueProvider');
  }
  return value;
};
