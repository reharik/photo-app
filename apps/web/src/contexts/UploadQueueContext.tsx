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
import { evictFieldOnCachedEntities } from '../graphql/evictFieldOnCachedEntities';

const UploadQueueContext = createContext<UploadQueueContextValue | null>(null);

/** Trailing debounce for coalescing cache evictions across a batch of uploads going ready. */
const EVICTION_DEBOUNCE_MS = 1000;
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

  // Cache eviction when uploads become ready, coalesced. Library/album lists only contain
  // server-ready items, so "ready" is when cached lists go stale. Evicting makes a mounted
  // grid refetch on its own (Apollo cache miss → network, previous data kept while
  // loading) and makes an unmounted one skip the serve-from-cache path on back navigation.
  // Each eviction of a mounted list costs a refetch that trims it to the first-page limit,
  // so a batch upload collects what to evict and flushes once: ~1s after the last item goes
  // ready, or immediately when nothing else in the queue is still on its way to ready.
  const itemsRef = useRef(state.items);
  itemsRef.current = state.items;
  const readyMediaItemIdsRef = useRef<Set<string>>(new Set());
  const pendingEvictLibraryRef = useRef(false);
  const pendingEvictAlbumIdsRef = useRef<Set<string>>(new Set());
  const evictFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushEvictions = useCallback((): void => {
    if (evictFlushTimerRef.current != null) {
      clearTimeout(evictFlushTimerRef.current);
      evictFlushTimerRef.current = null;
    }
    if (pendingEvictLibraryRef.current) {
      pendingEvictLibraryRef.current = false;
      // All sort variants on every cached Viewer.
      evictFieldOnCachedEntities(client, 'Viewer', 'mediaItems');
    }
    for (const albumId of pendingEvictAlbumIdsRef.current) {
      const albumCacheId = client.cache.identify({ __typename: 'Album', id: albumId });
      if (albumCacheId != null) {
        client.cache.evict({ id: albumCacheId, fieldName: 'items' });
      }
    }
    pendingEvictAlbumIdsRef.current.clear();
  }, [client]);

  const scheduleEvictionsForReadyItem = useCallback(
    (mediaItemId: string): void => {
      readyMediaItemIdsRef.current.add(mediaItemId);
      pendingEvictLibraryRef.current = true;
      const albumId = itemsRef.current.find((item) => item.mediaItemId === mediaItemId)?.albumId;
      if (albumId != null) {
        pendingEvictAlbumIdsRef.current.add(albumId);
      }

      // "Still on its way to ready": uploading (in flight) or finalized and awaiting server
      // processing (complete). Items already reported ready this session are excluded, since
      // itemsRef may not reflect their markReady dispatch yet.
      const anyStillPending = itemsRef.current.some(
        (item) =>
          (isInFlightStatus(item.status) || item.status.equals(FrontendUploadStatus.complete)) &&
          !(item.mediaItemId != null && readyMediaItemIdsRef.current.has(item.mediaItemId)),
      );
      if (!anyStillPending) {
        flushEvictions();
        return;
      }
      if (evictFlushTimerRef.current != null) {
        clearTimeout(evictFlushTimerRef.current);
      }
      evictFlushTimerRef.current = setTimeout(flushEvictions, EVICTION_DEBOUNCE_MS);
    },
    [flushEvictions],
  );

  useEffect(
    () => () => {
      if (evictFlushTimerRef.current != null) {
        clearTimeout(evictFlushTimerRef.current);
      }
    },
    [],
  );

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

    void awaitMediaItemsReady(client, ids, {
      onItemReady: (mediaItemId) => {
        dispatch({ type: 'markReady', payload: { mediaItemId } });
        scheduleEvictionsForReadyItem(mediaItemId);
      },
      onItemFailed: (mediaItemId) => {
        dispatch({ type: 'markFailed', payload: { mediaItemId } });
      },
    });
  }, [state.items, client, scheduleEvictionsForReadyItem]);

  const value = useMemo(
    () => ({
      items: state.items,
      enqueueFiles,
      retryItem,
      removeItem,
      clearCompleted,
      isUploading,
      batchErrors: state.batchErrors,
    }),
    [
      state.items,
      state.batchErrors,
      enqueueFiles,
      retryItem,
      removeItem,
      clearCompleted,
      isUploading,
    ],
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
