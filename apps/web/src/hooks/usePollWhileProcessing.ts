import type { MediaItemStatus } from '@packages/contracts';
import { useEffect, useRef } from 'react';
import { getMediaItemReadiness } from '../features/media/viewer/mediaItemReadiness';

export const MEDIA_PROCESSING_POLL_MS = 3000;

type PollableQuery = {
  startPolling: (pollInterval: number) => void;
  stopPolling: () => void;
};

/**
 * Polls a media item's detail query while the item is still processing, so a viewer
 * opened mid-pipeline swaps its "still processing" notice for the media once the
 * worker marks it READY. Refetching the detail query (not just the status) also brings
 * in what the worker wrote alongside it — dimensions, duration.
 *
 * Stops as soon as the status settles (ready, failed, unavailable) or the item changes.
 */
export const usePollWhileProcessing = (
  query: PollableQuery,
  status: MediaItemStatus | undefined,
): void => {
  const isProcessing = status != null && getMediaItemReadiness(status) === 'processing';
  // Held in a ref so the effect keys only on isProcessing: if the query object's
  // methods changed identity per render, restarting the poll each render could keep
  // resetting the interval before it ever fired.
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    if (!isProcessing) {
      return;
    }
    queryRef.current.startPolling(MEDIA_PROCESSING_POLL_MS);
    return () => {
      queryRef.current.stopPolling();
    };
  }, [isProcessing]);
};
