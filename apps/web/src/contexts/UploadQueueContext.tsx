import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import { useApolloClient } from '@apollo/client/react';
import { FrontendError, FrontendUploadStatus, isInFlightStatus } from '@packages/contracts';
import { awaitMediaItemsReady } from '../application/UploadMediaItemQueue/awaitMediaItemsReady';
import {
  initialUploadQueueState,
  uploadQueueReducer,
} from '../application/UploadMediaItemQueue/mediaUploadQueueReducer';
import {
  UploadQueueContextValue,
  UploadWorkflowEvent,
} from '../application/UploadMediaItemQueue/mediaUploadTypes';
import { uploadAndFinalize } from '../application/UploadMediaItemQueue/mediaUploadWorkflow';
import {
  presignUploadBatch,
  selectPresignBatch,
} from '../application/UploadMediaItemQueue/presignUploadBatch';
import { workflowEventToQueueAction } from '../application/UploadMediaItemQueue/workflowEventToQueueAction';
import { mapFrontendError } from '../domain/errors/mapToError';
import { ViewerProcessingMediaItemIdsDocument } from '../graphql/generated/types';
import { noteMediaItemsProcessing } from '../hooks/useProcessingMediaItems';

const UploadQueueContext = createContext<UploadQueueContextValue | null>(null);

export const UploadQueueProvider = ({ children }: { children: ReactNode }) => {
  const client = useApolloClient();

  const [state, dispatch] = useReducer(uploadQueueReducer, initialUploadQueueState);
  const isPresigningRef = useRef<boolean>(false);
  const isUploadingRef = useRef<boolean>(false);

  const enqueueFiles = useCallback(
    (files: File[], albumId?: string) => {
      dispatch({ type: 'enqueue', payload: { files, albumId } });
    },
    [dispatch],
  );

  const retryItem = useCallback(
    (localId: string) => dispatch({ type: 'retry', payload: { localId } }),
    [dispatch],
  );

  const removeItem = useCallback(
    (localId: string) => dispatch({ type: 'remove', payload: { localId } }),
    [dispatch],
  );

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
   * Each effect below starts at most one async step per run and guards it with a ref. Walking
   * the queue in a loop instead reads a stale snapshot after the first `await` and re-sends
   * items still shown as queued (runaway duplicate rows). When a step finishes it clears its
   * ref and bumps `driverTick`, so the next step is never left waiting for an unrelated render.
   */
  const [driverTick, wakeDriver] = useReducer((n: number) => n + 1, 0);

  // Presign: one chunk in flight at a time, requested lazily. The next chunk is fetched once
  // no presigned item is left waiting, which overlaps it with the current item's PUT.
  useEffect(() => {
    if (isPresigningRef.current) {
      return;
    }

    // Unreachable today: enqueue fails unclassified files outright. If one ever does end up
    // queued, fail it so it can't sit queued forever.
    const unclassified = state.items.find(
      (item) => item.status.equals(FrontendUploadStatus.queued) && item.classification == null,
    );
    if (unclassified) {
      dispatch({
        type: 'updateStatus',
        payload: {
          localId: unclassified.localId,
          status: FrontendUploadStatus.failed,
          errors: [mapFrontendError({ code: FrontendError.unsupportedMediaType })],
        },
      });
      return;
    }

    if (state.items.some((item) => item.status.equals(FrontendUploadStatus.presigned))) {
      return;
    }

    const batch = selectPresignBatch(state.items);
    if (batch.length === 0) {
      return;
    }

    isPresigningRef.current = true;
    dispatch({ type: 'presignStarted', payload: { localIds: batch.map((item) => item.localId) } });

    void presignUploadBatch(client, batch)
      .then((result) => dispatch({ type: 'presignSettled', payload: result }))
      .finally(() => {
        isPresigningRef.current = false;
        wakeDriver();
      });
  }, [state.items, client, driverTick]);

  // Upload: one PUT + finalize at a time, in queue order.
  useEffect(() => {
    if (isUploadingRef.current) {
      return;
    }

    const nextItem = state.items.find((item) => item.status.equals(FrontendUploadStatus.presigned));
    if (!nextItem?.mediaItemId || !nextItem.uploadInstructions) {
      return;
    }

    isUploadingRef.current = true;

    void uploadAndFinalize(
      client,
      nextItem.file,
      nextItem.mediaItemId,
      nextItem.uploadInstructions,
      handleWorkflowEvent(nextItem.localId),
    ).finally(() => {
      isUploadingRef.current = false;
      wakeDriver();
    });
  }, [state.items, client, handleWorkflowEvent, driverTick]);

  // Track which items have already been handed off to readiness polling,
  // so we don't double-start polling for the same item across re-renders.
  const polledIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newlyComplete = state.items.filter(
      (item) =>
        item.status.equals(FrontendUploadStatus.complete) &&
        item.mediaItemId != null &&
        !polledIdsRef.current.has(item.mediaItemId),
    );

    if (newlyComplete.length === 0) return;

    const ids = newlyComplete.map((item) => item.mediaItemId!);
    ids.forEach((id) => polledIdsRef.current.add(id));

    // Grid lists hold only READY items; refreshing them is useProcessingMediaItems' job.
    // Hand it the finalized ids and wake its watch now instead of at its next poll.
    noteMediaItemsProcessing(ids);
    void client.refetchQueries({ include: [ViewerProcessingMediaItemIdsDocument] });

    // Drives this widget's rows only.
    void awaitMediaItemsReady(client, ids, {
      onItemReady: (mediaItemId) => {
        dispatch({ type: 'markReady', payload: { mediaItemId } });
      },
      onItemFailed: (mediaItemId) => {
        dispatch({ type: 'markFailed', payload: { mediaItemId } });
      },
      onItemTimedOut: (mediaItemId) => {
        dispatch({ type: 'markProcessingDelayed', payload: { mediaItemId } });
      },
    });
  }, [state.items, client]);

  const value = useMemo(
    () => ({
      items: state.items,
      enqueueFiles,
      retryItem,
      removeItem,
      isUploading,
      batchErrors: state.batchErrors,
    }),
    [state.items, state.batchErrors, enqueueFiles, retryItem, removeItem, isUploading],
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
