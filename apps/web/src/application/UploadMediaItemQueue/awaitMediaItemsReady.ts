import { ApolloClient } from '@apollo/client';

import { MediaItemStatus } from '@packages/contracts';

import { ViewerMediaItemStatusDocument } from '../../graphql/generated/types';
import { nextProcessingPollDelayMs } from '../processingPollSchedule';

/**
 * Covers a realistic worst case: a long 1080p clip took 275s to transcode in prod, and there
 * is always a longer clip. Past this the item is reported timed out, not failed.
 */
const DEFAULT_MAX_DURATION_MS = 20 * 60_000;

/** Consecutive failed status requests tolerated before giving up; one blip must not end the wait. */
const MAX_CONSECUTIVE_ERRORS = 3;

export type AwaitMediaItemsReadyOptions = {
  maxDurationMs?: number;
  /**
   * Called the first time this item reaches {@link MediaItemStatus.ready} (not invoked on timeout
   * or terminal error snapshot). Enables incremental UI refreshes while other items finish processing.
   */
  onItemReady?: (mediaItemId: string) => void;
  /**
   * Called the first time this item reaches {@link MediaItemStatus.failed} — the backend gave up on
   * the derivative pipeline. Without this the item is indistinguishable from one still processing
   * and the poll spins until {@link AwaitMediaItemsReadyOptions.maxDurationMs} elapses.
   */
  onItemFailed?: (mediaItemId: string) => void;
  /**
   * Called when polling stops without a ready/failed status: the budget ran out,
   * {@link MAX_CONSECUTIVE_ERRORS} status requests in a row failed, or the item no longer
   * exists (deleted). None of these is a processing failure, so none is reported as one.
   */
  onItemTimedOut?: (mediaItemId: string) => void;
};

type ItemCallbacks = Pick<
  AwaitMediaItemsReadyOptions,
  'onItemReady' | 'onItemFailed' | 'onItemTimedOut'
>;

type StatusSnapshot = { kind: 'status'; status: MediaItemStatus } | { kind: 'gone' };

/**
 * The item's current status, or `gone` when it no longer exists. The owner's lookup has no
 * status filter, so a null `mediaItem` means deleted, not "not ready yet".
 */
const fetchStatus = async (client: ApolloClient, mediaItemId: string): Promise<StatusSnapshot> => {
  const result = await client.query({
    query: ViewerMediaItemStatusDocument,
    variables: { mediaItemId },
    fetchPolicy: 'network-only',
  });
  const status = result.data?.viewer?.mediaItem?.status;
  return status == null ? { kind: 'gone' } : { kind: 'status', status };
};

const waitUntilMediaItemSettles = (
  client: ApolloClient,
  mediaItemId: string,
  maxDurationMs: number,
  { onItemReady, onItemFailed, onItemTimedOut }: ItemCallbacks,
): Promise<void> =>
  new Promise<void>((resolve) => {
    const startedAt = Date.now();
    let consecutiveErrors = 0;

    const poll = async (): Promise<void> => {
      // undefined: this request failed.
      let snapshot: StatusSnapshot | undefined;
      try {
        snapshot = await fetchStatus(client, mediaItemId);
        consecutiveErrors = 0;
      } catch {
        consecutiveErrors += 1;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          onItemTimedOut?.(mediaItemId);
          resolve();
          return;
        }
      }

      if (snapshot?.kind === 'gone') {
        onItemTimedOut?.(mediaItemId);
        resolve();
        return;
      }
      const status = snapshot?.status;
      if (status != null && MediaItemStatus.ready.equals(status)) {
        onItemReady?.(mediaItemId);
        resolve();
        return;
      }
      if (status != null && MediaItemStatus.failed.equals(status)) {
        onItemFailed?.(mediaItemId);
        resolve();
        return;
      }

      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs >= maxDurationMs) {
        onItemTimedOut?.(mediaItemId);
        resolve();
        return;
      }
      setTimeout(
        () => void poll(),
        Math.min(nextProcessingPollDelayMs(elapsedMs), maxDurationMs - elapsedMs),
      );
    };

    void poll();
  });

/**
 * Poll backend processing status until each item is ready, failed, or times out. Each item
 * reports exactly one of {@link AwaitMediaItemsReadyOptions.onItemReady}, `onItemFailed` or
 * `onItemTimedOut`.
 */
export const awaitMediaItemsReady = async (
  client: ApolloClient,
  mediaItemIds: string[],
  options?: AwaitMediaItemsReadyOptions,
): Promise<void> => {
  if (mediaItemIds.length === 0) {
    return;
  }

  const maxDurationMs = options?.maxDurationMs ?? DEFAULT_MAX_DURATION_MS;
  const callbacks: ItemCallbacks = {
    onItemReady: options?.onItemReady,
    onItemFailed: options?.onItemFailed,
    onItemTimedOut: options?.onItemTimedOut,
  };

  await Promise.all(
    mediaItemIds.map((mediaItemId) =>
      waitUntilMediaItemSettles(client, mediaItemId, maxDurationMs, callbacks),
    ),
  );
};
